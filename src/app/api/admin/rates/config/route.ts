import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import FxRate from '@/models/FxRate';
import Region from '@/models/Region';
import PlatformFeesLimits from '@/models/PlatformFeesLimits';
import ConversionControl from '@/models/ConversionControl';
import Transaction from '@/models/Transaction';
import Currency from '@/models/Currency';
import { validateAdmin } from '@/lib/adminAuth';
import { PERMISSIONS } from '@/lib/rbac';

async function syncRatesFromProvider() {
    try {
        const controller = new AbortController();
        const id = setTimeout(() => controller.abort(), 2000);
        
        const response = await fetch('https://open.er-api.com/v6/latest/USD', { signal: controller.signal });
        clearTimeout(id);
        
        if (!response.ok) return false;
        const data = await response.json();
        if (!data || !data.rates) return false;
        
        const rates = data.rates;
        const quoteCurrencies = ['USD', 'KES', 'UGX', 'TZS', 'NGN', 'GHS', 'EUR', 'GBP'];
        const base = 'USDT';
        
        for (const quote of quoteCurrencies) {
            if (rates[quote]) {
                const usdToQuote = rates[quote];
                const newRate = usdToQuote;
                
                const existing = await FxRate.findOne({ baseCurrency: base, quoteCurrency: quote });
                if (existing) {
                    if (existing.isLocked) continue;
                    
                    const oldRate = existing.rate;
                    if (oldRate !== newRate) {
                        existing.previousRate = oldRate;
                        existing.rate = newRate;
                        existing.changePercentage = parseFloat((((newRate - oldRate) / oldRate) * 100).toFixed(4));
                        existing.source = 'provider';
                        existing.providerName = 'open-er-api';
                        await existing.save();
                    }
                } else {
                    await FxRate.create({
                        baseCurrency: base,
                        quoteCurrency: quote,
                        rate: newRate,
                        previousRate: newRate,
                        changePercentage: 0,
                        isLocked: false,
                        source: 'provider',
                        providerName: 'open-er-api'
                    });
                }
            }
        }
        return true;
    } catch (err) {
        console.error('Rates sync error:', err);
        return false;
    }
}

export async function GET(req: NextRequest) {
    const { error } = await validateAdmin(req, PERMISSIONS.AUDIT_LOGS);
    if (error) return error;

    try {
        await dbConnect();

        // 1. Sync rates live from the provider
        const syncSuccess = await syncRatesFromProvider();

        // 2. Fetch config records
        const [fxRates, regions, feesLimits, conversionControl] = await Promise.all([
            FxRate.find().sort({ baseCurrency: 1, quoteCurrency: 1 }),
            Region.find().sort({ countryName: 1 }),
            (PlatformFeesLimits as any).getSettings(),
            (ConversionControl as any).getSettings()
        ]);

        // 3. Calculate Executive Treasury Metrics
        const usdtToKesPair = fxRates.find(r => r.baseCurrency === 'USDT' && r.quoteCurrency === 'KES');
        const kesRate = usdtToKesPair ? usdtToKesPair.rate : 130;
        
        const now = new Date();
        const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        
        const dailyTransactions = await Transaction.find({
            status: 'SUCCESS',
            createdAt: { $gte: oneDayAgo }
        });
        
        const monthlyTransactions = await Transaction.find({
            status: 'SUCCESS',
            createdAt: { $gte: thirtyDaysAgo }
        });
        
        const getKesValue = (tx: any) => {
            const amt = tx.amount || 0;
            if (tx.currency === 'USDT') {
                return amt * kesRate;
            }
            return amt;
        };
        
        const getKesFee = (tx: any) => {
            const fee = tx.fee || 0;
            if (tx.currency === 'USDT') {
                return fee * kesRate;
            }
            return fee;
        };
        
        const dailyVolume = dailyTransactions.reduce((acc, tx) => acc + getKesValue(tx), 0);
        const monthlyVolume = monthlyTransactions.reduce((acc, tx) => acc + getKesValue(tx), 0);
        const revenueGenerated = monthlyTransactions.reduce((acc, tx) => acc + getKesFee(tx), 0);
        
        const conversionTxs = monthlyTransactions.filter(tx => tx.type === 'CONVERT');
        const exchangeProfit = conversionTxs.reduce((acc, tx) => acc + getKesFee(tx), 0);
        
        const totalConverts = await Transaction.countDocuments({
            type: 'CONVERT',
            createdAt: { $gte: thirtyDaysAgo }
        });
        const successConverts = await Transaction.countDocuments({
            type: 'CONVERT',
            status: 'SUCCESS',
            createdAt: { $gte: thirtyDaysAgo }
        });
        const conversionSuccessRate = totalConverts > 0 ? parseFloat(((successConverts / totalConverts) * 100).toFixed(2)) : 100;
        
        const avgConversionVolume = conversionTxs.length > 0 
            ? parseFloat((conversionTxs.reduce((acc, tx) => acc + getKesValue(tx), 0) / conversionTxs.length).toFixed(2)) 
            : 0;

        const activeRegionsCount = regions.filter(r => r.enabled).length;
        const supportedCurrenciesCount = await Currency.countDocuments({ enabled: true });

        // 4. Compile dynamic 7-day chart data
        const chartLabels: string[] = [];
        const chartVolumeData: number[] = [];
        const chartRevenueData: number[] = [];
        
        for (let i = 6; i >= 0; i--) {
            const start = new Date();
            start.setHours(0, 0, 0, 0);
            start.setDate(start.getDate() - i);
            const end = new Date();
            end.setHours(23, 59, 59, 999);
            end.setDate(end.getDate() - i);
            
            const dayTxs = await Transaction.find({
                status: 'SUCCESS',
                createdAt: { $gte: start, $lte: end }
            });
            
            const dayVol = dayTxs.reduce((sum, tx) => sum + getKesValue(tx), 0);
            const dayRev = dayTxs.reduce((sum, tx) => sum + getKesFee(tx), 0);
            
            chartLabels.push(start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
            chartVolumeData.push(dayVol);
            chartRevenueData.push(dayRev);
        }

        // 5. Automation Warning & Operations Alerts
        const alerts: any[] = [];
        const volatilePairs = fxRates.filter(r => Math.abs(r.changePercentage) > 1.5);
        volatilePairs.forEach(p => {
            alerts.push({
                type: 'VOLATILITY',
                message: `High volatility detected for ${p.baseCurrency}/${p.quoteCurrency}: ${p.changePercentage}% change.`,
                severity: 'WARNING',
                timestamp: new Date()
            });
        });
        
        if (dailyVolume > 1000000) {
            alerts.push({
                type: 'LIQUIDITY',
                message: `Treasury operations alert: Daily volume has crossed 1,000,000 KES. Current: ${dailyVolume.toLocaleString()} KES.`,
                severity: 'INFO',
                timestamp: new Date()
            });
        }
        
        const degradedRegions = regions.filter(r => r.operationalHealth && r.operationalHealth !== 'HEALTHY');
        degradedRegions.forEach(r => {
            alerts.push({
                type: 'LIQUIDITY',
                message: `Regional service alert: ${r.countryName} is marked as ${r.operationalHealth}.`,
                severity: r.operationalHealth === 'OUTAGE' ? 'CRITICAL' : 'WARNING',
                timestamp: new Date()
            });
        });

        return NextResponse.json({
            fxRates,
            regions,
            feesLimits,
            conversionControl,
            liveSync: syncSuccess,
            metrics: {
                dailyVolume,
                monthlyVolume,
                revenueGenerated,
                exchangeProfit,
                activeRegions: activeRegionsCount,
                supportedCurrencies: supportedCurrenciesCount,
                avgConversionVolume,
                conversionSuccessRate
            },
            charts: {
                labels: chartLabels,
                volume: chartVolumeData,
                revenue: chartRevenueData
            },
            alerts
        });
    } catch (err: any) {
        return NextResponse.json({ message: err.message }, { status: 500 });
    }
}
