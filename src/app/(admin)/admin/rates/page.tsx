"use client";

import React, { useState, useEffect, useCallback } from 'react';
import {
    Globe,
    Coins,
    Plus,
    Trash2,
    Save,
    AlertCircle,
    TrendingDown,
    TrendingUp,
    Settings2,
    Percent,
    History,
    Info,
    Loader2,
    Lock,
    Unlock,
    Activity,
    ShieldAlert,
    ShieldCheck,
    RefreshCw,
    Play,
    Pause,
    Layers,
    DollarSign
} from 'lucide-react';
import { adminService } from '@/services/admin.service';

export default function RatesPage() {
    const [activeTab, setActiveTab] = useState<'overview' | 'currencies' | 'fees' | 'regions' | 'emergency' | 'history'>('overview');
    
    // Core Config state
    const [config, setConfig] = useState<any>(null);
    const [currencies, setCurrencies] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    
    // History & Logs
    const [history, setHistory] = useState<any[]>([]);
    
    // Modals & Editors
    const [newPairModal, setNewPairModal] = useState(false);
    const [showAddRegionModal, setShowAddRegionModal] = useState(false);
    const [showAddCurrencyModal, setShowAddCurrencyModal] = useState(false);
    const [selectedRegion, setSelectedRegion] = useState<any | null>(null);
    const [selectedCurrency, setSelectedCurrency] = useState<any | null>(null);
    
    // Emergency Double Confirmation State
    const [confirmEmergency, setConfirmEmergency] = useState<{
        show: boolean;
        type: 'CONVERSIONS' | 'DEPOSITS' | 'WITHDRAWALS' | 'DISABLE_REGION' | 'DISABLE_CURRENCY';
        target?: string;
        targetName?: string;
        actionState: boolean;
    } | null>(null);
    const [emergencyReason, setEmergencyReason] = useState('');
    const [doubleConfirmText, setDoubleConfirmText] = useState('');

    // Simulator State
    const [simAmount, setSimAmount] = useState<number>(1000);
    const [simFeeType, setSimFeeType] = useState<string>('withdrawalFee');
    const [simResult, setSimResult] = useState<number | null>(null);

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const [ratesData, currenciesData] = await Promise.all([
                adminService.getRatesConfig(),
                adminService.getCurrencies().catch(() => ({ currencies: [] }))
            ]);
            setConfig(ratesData);
            setCurrencies(currenciesData.currencies || []);
        } catch (err: any) {
            alert(err.message || "Failed to load treasury data.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Live update simulator whenever inputs change
    useEffect(() => {
        if (config && config.feesLimits) {
            const feeConfig = config.feesLimits[simFeeType];
            const netFeeConfig = simFeeType === 'withdrawalFee' ? config.feesLimits.networkFee : null;
            const res = simulateFee(simAmount, feeConfig, netFeeConfig);
            setSimResult(res);
        }
    }, [simAmount, simFeeType, config]);

    // Fees Simulation calculator
    const simulateFee = (amount: number, feeConfig: any, networkFeeConfig?: any) => {
        if (!feeConfig) return 0;
        let fee = 0;
        if (feeConfig.type === 'fixed') {
            fee = feeConfig.value;
        } else if (feeConfig.type === 'percentage') {
            fee = (amount * feeConfig.value) / 100;
        } else if (feeConfig.type === 'tiered') {
            const sorted = [...(feeConfig.tiers || [])].sort((a: any, b: any) => a.limit - b.limit);
            const matchedTier = sorted.find((t: any) => amount <= t.limit);
            if (matchedTier) {
                fee = matchedTier.fee;
            } else {
                fee = feeConfig.value;
            }
        }
        
        if (networkFeeConfig) {
            if (networkFeeConfig.type === 'fixed') {
                fee += networkFeeConfig.value;
            } else if (networkFeeConfig.type === 'percentage') {
                fee += (amount * networkFeeConfig.value) / 100;
            }
        }
        return parseFloat(fee.toFixed(4));
    };

    const handleSaveFeesLimits = async () => {
        try {
            setSaving(true);
            await adminService.updateFeesLimits(config.feesLimits);
            alert("Platform fees and limits updated successfully.");
            await fetchData();
        } catch (err: any) {
            alert(err.message || "Failed to save fees settings.");
        } finally {
            setSaving(false);
        }
    };

    const handleToggleRateLock = async (base: string, quote: string, currentLock: boolean) => {
        try {
            setSaving(true);
            await adminService.toggleRatePairLock(base, quote, !currentLock);
            await fetchData();
        } catch (err: any) {
            alert(err.message || "Failed to lock rate pair.");
        } finally {
            setSaving(false);
        }
    };

    const handleDeletePair = async (base: string, quote: string) => {
        if (!confirm(`Are you sure you want to delete the ${base}/${quote} pair?`)) return;
        try {
            setSaving(true);
            await adminService.deleteRatePair(base, quote);
            await fetchData();
        } catch (err: any) {
            alert(err.message);
        } finally {
            setSaving(false);
        }
    };

    // Emergency Control Switches
    const triggerEmergencyModal = (
        type: 'CONVERSIONS' | 'DEPOSITS' | 'WITHDRAWALS' | 'DISABLE_REGION' | 'DISABLE_CURRENCY',
        actionState: boolean,
        target?: string,
        targetName?: string
    ) => {
        setConfirmEmergency({
            show: true,
            type,
            target,
            targetName,
            actionState
        });
        setEmergencyReason('');
        setDoubleConfirmText('');
    };

    const handleProcessEmergency = async () => {
        if (!confirmEmergency) return;
        const { type, actionState, target } = confirmEmergency;

        if (doubleConfirmText !== 'CONFIRM') {
            alert("Please type 'CONFIRM' to authorize.");
            return;
        }

        if (!emergencyReason.trim() || emergencyReason.trim().length < 5) {
            alert("A valid operation reason is required (min 5 characters).");
            return;
        }

        try {
            setSaving(true);
            
            if (type === 'CONVERSIONS') {
                await adminService.toggleEmergencyFreeze({
                    conversionsFrozen: actionState,
                    reason: emergencyReason
                });
            } else if (type === 'DEPOSITS') {
                await adminService.toggleEmergencyFreeze({
                    depositsFrozen: actionState,
                    reason: emergencyReason
                });
            } else if (type === 'WITHDRAWALS') {
                await adminService.toggleEmergencyFreeze({
                    withdrawalsFrozen: actionState,
                    reason: emergencyReason
                });
            } else if (type === 'DISABLE_REGION' && target) {
                // Disable region via freeze collection or update its active status
                const currentDisabled = config.conversionControl.disabledRegions || [];
                const updated = actionState 
                    ? [...currentDisabled, target]
                    : currentDisabled.filter((code: string) => code !== target);
                
                await adminService.toggleEmergencyFreeze({
                    disabledRegions: updated,
                    reason: emergencyReason
                });
            } else if (type === 'DISABLE_CURRENCY' && target) {
                const currentDisabled = config.conversionControl.disabledCurrencies || [];
                const updated = actionState 
                    ? [...currentDisabled, target]
                    : currentDisabled.filter((code: string) => code !== target);
                
                await adminService.toggleEmergencyFreeze({
                    disabledCurrencies: updated,
                    reason: emergencyReason
                });
            }

            alert("Emergency operational control executed successfully.");
            setConfirmEmergency(null);
            await fetchData();
        } catch (err: any) {
            alert(err.message || "Failed to process emergency action.");
        } finally {
            setSaving(false);
        }
    };

    // Currencies Engine operations
    const handleUpdateCurrency = async (code: string, data: any) => {
        try {
            setSaving(true);
            await adminService.updateCurrency(code, data);
            setSelectedCurrency(null);
            await fetchData();
        } catch (err: any) {
            alert(err.message);
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteCurrency = async (code: string) => {
        if (!confirm(`Are you sure you want to remove ${code} currency from the platform?`)) return;
        try {
            setSaving(true);
            await adminService.deleteCurrency(code);
            await fetchData();
        } catch (err: any) {
            alert(err.message);
        } finally {
            setSaving(false);
        }
    };

    // Regional operations updates
    const handleUpdateRegionDetails = async (code: string, data: any) => {
        try {
            setSaving(true);
            await adminService.updateRegion(code, data);
            setSelectedRegion(null);
            await fetchData();
        } catch (err: any) {
            alert(err.message);
        } finally {
            setSaving(false);
        }
    };

    // Fetch Rates History Log
    const fetchHistory = async () => {
        try {
            setLoading(true);
            const data = await adminService.getRatesHistory();
            setHistory(data.history || []);
            setActiveTab('history');
        } catch (err: any) {
            alert(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (loading || !config) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 font-sans">
                <Loader2 className="animate-spin text-primary-orange" size={40} />
                <p className="text-slate-500 font-bold uppercase tracking-widest text-xs animate-pulse">Syncing platform treasury...</p>
            </div>
        );
    }

    const { metrics = {}, charts = {}, alerts = [] } = config;

    return (
        <div className="space-y-8 animate-in fade-in duration-700 pb-20 font-sans">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h2 className="text-3xl font-bold text-white tracking-tight">Treasury & Rates Console</h2>
                    <p className="text-slate-400 mt-1">Global liquidity desk, exchange pairs synchronization, and multi-country operational limits.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={fetchData}
                        className="flex items-center justify-center w-10 h-10 bg-[#0D1017] hover:bg-white/[0.03] text-slate-400 hover:text-white rounded-xl border border-[#1E2533] transition-all"
                        title="Reload Treasury State"
                    >
                        <RefreshCw size={16} />
                    </button>
                    <button
                        onClick={fetchHistory}
                        className="flex items-center gap-2 px-4 py-2.5 bg-[#0D1017] hover:bg-white/[0.03] text-white font-bold text-xs uppercase tracking-wider rounded-xl border border-[#1E2533] transition-all shadow-sm"
                    >
                        <History size={16} />
                        Compliance Logs
                    </button>
                </div>
            </div>

            {/* Treasury Overview Metrics Ribbon */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                <MetricCard title="Daily Volume" value={`${metrics.dailyVolume?.toLocaleString() || 0} KES`} trend="+4.8%" up={true} />
                <MetricCard title="Monthly Volume" value={`${metrics.monthlyVolume?.toLocaleString() || 0} KES`} trend="+12.5%" up={true} />
                <MetricCard title="Total Platform Revenue" value={`${metrics.revenueGenerated?.toLocaleString() || 0} KES`} desc="Fees in past 30 days" />
                <MetricCard title="Exchange Profit" value={`${metrics.exchangeProfit?.toLocaleString() || 0} KES`} desc="Conversion spread margins" />
                <MetricCard title="Active Regions" value={metrics.activeRegions} desc="Enabled country terminals" />
                <MetricCard title="Supported Currencies" value={metrics.supportedCurrencies} desc="Asset codes registered" />
                <MetricCard title="Avg conversion size" value={`${metrics.avgConversionVolume?.toLocaleString() || 0} KES`} />
                <MetricCard title="Conversion success" value={`${metrics.conversionSuccessRate || 0}%`} desc="SLA fulfillment rate" />
            </div>

            {/* Navigation Tabs */}
            <div className="border-b border-[#1E2533] flex gap-8 overflow-x-auto pb-px scrollbar-none">
                <TabButton label="Exchange Desk" active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} />
                <TabButton label="Fee Management" active={activeTab === 'fees'} onClick={() => setActiveTab('fees')} />
                <TabButton label="Multi-Currency Engine" active={activeTab === 'currencies'} onClick={() => setActiveTab('currencies')} />
                <TabButton label="Regional Operations" active={activeTab === 'regions'} onClick={() => setActiveTab('regions')} />
                <TabButton label="Global Kill Switches" active={activeTab === 'emergency'} onClick={() => setActiveTab('emergency')} />
                <TabButton label="Audit Trail Logs" active={activeTab === 'history'} onClick={fetchHistory} />
            </div>

            {/* TAB: Exchange Desk (Overview & Charts & Rates) */}
            {activeTab === 'overview' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left & Middle: Analytics & Rates list */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Charts Area */}
                        <div className="bg-[#0D1017]/80 border border-[#1E2533] rounded-3xl p-8 backdrop-blur-md shadow-2xl space-y-6">
                            <h3 className="text-base font-bold text-white uppercase tracking-wider flex items-center gap-3">
                                <Activity className="text-primary-orange" size={20} />
                                Conversion Volume & Revenue (Past 7 Days)
                            </h3>
                            <div className="h-64 w-full">
                                {renderAnalyticsChart(charts)}
                            </div>
                        </div>

                        {/* Fx Rates List */}
                        <div className="bg-[#0D1017]/80 border border-[#1E2533] rounded-3xl p-8 backdrop-blur-md shadow-2xl">
                            <div className="flex items-center justify-between mb-8">
                                <h3 className="text-base font-bold text-white uppercase tracking-wider flex items-center gap-3">
                                    <Coins className="text-primary-orange" size={22} />
                                    Live Currency Exchange Pairs
                                </h3>
                                <div className={`flex items-center gap-2 px-3 py-1 text-[9px] font-black uppercase tracking-widest rounded-lg border transition-all ${config.liveSync ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-[0_0_8px_rgba(16,185,129,0.1)]' : 'bg-rose-500/10 text-rose-400 border-rose-500/20 shadow-[0_0_8px_rgba(244,63,94,0.1)]'}`}>
                                    <div className={`w-1 h-1 rounded-full ${config.liveSync ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`} />
                                    <span>{config.liveSync ? 'Live Provider Sync Active' : 'Live Provider Sync Failed'}</span>
                                </div>
                            </div>

                            <div className="space-y-4">
                                {config.fxRates.map((rate: any) => {
                                    const isFrozen = config.conversionControl?.disabledCurrencies?.includes(rate.baseCurrency) || 
                                                     config.conversionControl?.disabledCurrencies?.includes(rate.quoteCurrency);
                                    return (
                                        <div key={rate._id} className={`flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 bg-[#07090E]/40 border border-[#1E2533] rounded-2xl hover:border-primary-orange/20 transition-all duration-300 group ${isFrozen ? 'opacity-40 select-none cursor-not-allowed border-rose-500/20' : ''}`}>
                                            <div className="flex flex-col">
                                                <div className="flex items-center gap-2 mb-1.5">
                                                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{rate.baseCurrency}/{rate.quoteCurrency}</span>
                                                    <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase ${rate.source === 'manual_override' ? 'bg-primary-orange-light text-primary-orange border border-primary-orange-border' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'}`}>
                                                        {rate.source.replace('_', ' ')}
                                                    </span>
                                                    {isFrozen && (
                                                        <span className="px-1.5 py-0.5 rounded text-[8px] font-black uppercase bg-rose-500/10 text-rose-400 border border-rose-500/20">
                                                            Frozen
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm font-bold text-slate-300 uppercase tracking-wider">
                                                        {rate.rate.toLocaleString()}
                                                    </span>
                                                    <span className={`text-[10px] font-mono font-bold flex items-center ${rate.changePercentage >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                                        {rate.changePercentage >= 0 ? '+' : ''}{rate.changePercentage}%
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-3">
                                                {/* Manual Override inputs */}
                                                <div className="flex items-center gap-2 font-mono">
                                                    <span className="text-[9px] text-slate-600">Rate override:</span>
                                                    <input 
                                                        type="number"
                                                        step="0.0001"
                                                        defaultValue={rate.rate}
                                                        onBlur={async (e) => {
                                                            const newRate = parseFloat(e.target.value);
                                                            if (isNaN(newRate) || newRate <= 0) return;
                                                            if (newRate === rate.rate) return;
                                                            try {
                                                                await adminService.updateRatePair({
                                                                    baseCurrency: rate.baseCurrency,
                                                                    quoteCurrency: rate.quoteCurrency,
                                                                    rate: newRate,
                                                                    source: 'manual_override'
                                                                });
                                                                fetchData();
                                                            } catch (err: any) {
                                                                alert(err.message);
                                                            }
                                                        }}
                                                        className="w-24 bg-[#07090E] border border-[#1E2533] rounded-xl px-2 py-1.5 text-xs text-white text-center focus:outline-none focus:border-primary-orange"
                                                    />
                                                </div>

                                                {/* Lock Toggle */}
                                                <button
                                                    onClick={() => handleToggleRateLock(rate.baseCurrency, rate.quoteCurrency, rate.isLocked)}
                                                    className={`p-2.5 rounded-xl border transition-all ${rate.isLocked ? 'bg-[#FF6B00]/10 text-primary-orange border-[#FF6B00]/30' : 'bg-[#07090E] text-slate-500 border-[#1E2533] hover:text-white'}`}
                                                    title={rate.isLocked ? "Rates Lock Active (Click to unlock)" : "Lock exchange rates to manual overrides"}
                                                >
                                                    {rate.isLocked ? <Lock size={14} /> : <Unlock size={14} />}
                                                </button>

                                                <button
                                                    onClick={() => handleDeletePair(rate.baseCurrency, rate.quoteCurrency)}
                                                    className="p-2.5 text-rose-400 hover:text-white hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 rounded-xl transition-all"
                                                    title="Delete Pair"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            <button
                                onClick={() => setNewPairModal(true)}
                                className="w-full mt-6 py-4 bg-[#07090E] hover:bg-white/[0.02] border border-[#1E2533] hover:border-primary-orange/20 rounded-2xl text-slate-400 hover:text-white text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                            >
                                <Plus size={16} />
                                Add Rate Pairing
                            </button>
                        </div>
                    </div>

                    {/* Right Side: Warning alerts & quick config */}
                    <div className="space-y-6">
                        {/* Alerts Box */}
                        <div className="bg-[#0D1017]/80 border border-[#1E2533] rounded-3xl p-6 backdrop-blur-md shadow-2xl">
                            <h4 className="text-xs font-bold text-white mb-6 uppercase tracking-wider flex items-center gap-2">
                                <ShieldAlert className="text-primary-orange" size={16} />
                                Live Treasury Alerts
                            </h4>
                            <div className="space-y-4">
                                {alerts.map((alertItem: any, idx: number) => (
                                    <div key={idx} className={`p-4 rounded-xl border flex gap-3 ${alertItem.severity === 'CRITICAL' ? 'bg-rose-500/10 border-rose-500/20 text-rose-300' : 'bg-amber-500/10 border-amber-500/20 text-amber-300'}`}>
                                        <AlertCircle size={16} className="shrink-0 mt-0.5" />
                                        <div>
                                            <p className="text-[10px] font-black uppercase tracking-wider">{alertItem.type} alert</p>
                                            <p className="text-[10px] font-medium leading-relaxed mt-1 font-sans text-slate-400">{alertItem.message}</p>
                                        </div>
                                    </div>
                                ))}
                                {alerts.length === 0 && (
                                    <div className="text-center py-6 border border-dashed border-[#1E2533] rounded-2xl">
                                        <ShieldCheck className="text-emerald-500 mx-auto mb-2" size={24} />
                                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Treasury status healthy. No alerts.</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Conversions Kill Switch Info */}
                        <div className={`bg-[#0D1017]/80 border border-[#1E2533] rounded-3xl p-6 backdrop-blur-md shadow-2xl transition-all duration-500 ${config.conversionControl.conversionsFrozen ? 'ring-2 ring-rose-500/50 bg-rose-500/5 border-rose-500/30' : ''}`}>
                            <div className="flex items-center justify-between mb-4">
                                <div className={`flex items-center gap-2 font-bold ${config.conversionControl.conversionsFrozen ? 'text-rose-400' : 'text-slate-400'}`}>
                                    <AlertCircle size={18} className={config.conversionControl.conversionsFrozen ? 'animate-pulse' : ''} />
                                    <h4 className="text-xs tracking-wider uppercase font-black">Conversions Lock</h4>
                                </div>
                                <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded ${config.conversionControl.conversionsFrozen ? 'bg-rose-500/10 text-rose-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                                    {config.conversionControl.conversionsFrozen ? 'Halted' : 'Active'}
                                </span>
                            </div>
                            <p className="text-[10px] text-slate-500 leading-relaxed mb-6 font-medium font-sans">
                                {config.conversionControl.conversionsFrozen
                                    ? `CONVERSIONS HALTED: "${config.conversionControl.freezeReason}"`
                                    : "Halt all peer-to-peer conversion requests instantly in case of high volatility or liquidity failure."}
                            </p>
                            <button
                                onClick={() => triggerEmergencyModal('CONVERSIONS', !config.conversionControl.conversionsFrozen)}
                                className={`w-full py-3 text-white font-black text-xs rounded-xl transition-all uppercase tracking-widest flex items-center justify-center gap-2 ${config.conversionControl.conversionsFrozen ? 'bg-emerald-600 hover:bg-emerald-500 shadow-lg shadow-emerald-500/20' : 'bg-rose-600 hover:bg-rose-500 shadow-lg shadow-rose-500/20 border border-rose-500/20'}`}
                            >
                                {config.conversionControl.conversionsFrozen ? <Play size={12} /> : <Pause size={12} />}
                                {config.conversionControl.conversionsFrozen ? "Resume Conversions" : "Freeze Conversions"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* TAB: Fee Management Center */}
            {activeTab === 'fees' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left: Fee Editors */}
                    <div className="lg:col-span-2 bg-[#0D1017]/80 border border-[#1E2533] rounded-3xl p-8 backdrop-blur-md shadow-2xl space-y-8">
                        <div className="flex items-center justify-between border-b border-[#1E2533] pb-6">
                            <h3 className="text-base font-bold text-white uppercase tracking-wider flex items-center gap-3">
                                <Percent className="text-primary-orange" size={22} />
                                Global Transaction Fee Engine
                            </h3>
                            <button
                                onClick={handleSaveFeesLimits}
                                disabled={saving}
                                className="flex items-center gap-2 px-5 py-2 bg-primary-orange hover:bg-primary-orange-hover text-white font-black text-[10px] uppercase tracking-widest rounded-xl transition-all disabled:opacity-50"
                            >
                                {saving ? <Loader2 className="animate-spin" size={12} /> : <Save size={12} />}
                                Save Fee Matrix
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <FeeEditorField
                                label="Deposit Fees"
                                config={config.feesLimits.depositFee}
                                onChange={(val: any) => setConfig({
                                    ...config,
                                    feesLimits: { ...config.feesLimits, depositFee: val }
                                })}
                            />
                            <FeeEditorField
                                label="Withdrawal Fees"
                                config={config.feesLimits.withdrawalFee}
                                onChange={(val: any) => setConfig({
                                    ...config,
                                    feesLimits: { ...config.feesLimits, withdrawalFee: val }
                                })}
                            />
                            <FeeEditorField
                                label="Transfer Fees"
                                config={config.feesLimits.transferFee}
                                onChange={(val: any) => setConfig({
                                    ...config,
                                    feesLimits: { ...config.feesLimits, transferFee: val }
                                })}
                            />
                            <FeeEditorField
                                label="Conversion Fees"
                                config={config.feesLimits.conversionFee}
                                onChange={(val: any) => setConfig({
                                    ...config,
                                    feesLimits: { ...config.feesLimits, conversionFee: val }
                                })}
                            />
                            <FeeEditorField
                                label="Network Fees"
                                config={config.feesLimits.networkFee}
                                onChange={(val: any) => setConfig({
                                    ...config,
                                    feesLimits: { ...config.feesLimits, networkFee: val }
                                })}
                            />
                        </div>
                    </div>

                    {/* Right: Fee Impact Simulator */}
                    <div className="bg-[#0D1017]/80 border border-[#1E2533] rounded-3xl p-6 backdrop-blur-md shadow-2xl space-y-6">
                        <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                            <Settings2 size={16} className="text-primary-orange" />
                            Fee Impact Simulator
                        </h4>
                        <p className="text-[10px] text-slate-500 leading-relaxed font-sans font-medium">
                            Test how fixed, percentage, and tiered schedules affect a given transaction amount.
                        </p>

                        <div className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest pl-0.5">Transaction Type</label>
                                <select 
                                    value={simFeeType}
                                    onChange={(e) => setSimFeeType(e.target.value)}
                                    className="w-full bg-[#07090E] border border-[#1E2533] text-slate-300 rounded-xl px-3 py-2.5 text-xs font-bold uppercase tracking-wider outline-none focus:border-primary-orange cursor-pointer"
                                >
                                    <option value="depositFee">Deposit Transaction</option>
                                    <option value="withdrawalFee">Withdrawal Transaction</option>
                                    <option value="transferFee">Internal Transfer</option>
                                    <option value="conversionFee">Currency Conversion</option>
                                </select>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest pl-0.5">Simulate Amount</label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-mono font-bold text-slate-600">Amt:</span>
                                    <input 
                                        type="number"
                                        value={simAmount}
                                        onChange={(e) => setSimAmount(parseFloat(e.target.value) || 0)}
                                        className="w-full bg-[#07090E] border border-[#1E2533] rounded-xl pl-12 pr-4 py-2.5 text-xs font-bold text-white focus:outline-none focus:border-primary-orange"
                                    />
                                </div>
                            </div>

                            {simResult !== null && (
                                <div className="p-4 bg-[#07090E] border border-white/[0.02] rounded-2xl flex flex-col items-center justify-center font-mono">
                                    <span className="text-[8px] text-slate-600 font-sans uppercase tracking-widest mb-1.5">Calculated Fee Impact</span>
                                    <span className="text-lg font-black text-white">{simResult.toLocaleString()} Units</span>
                                    <span className="text-[8px] text-slate-500 font-sans uppercase tracking-widest mt-1.5">
                                        Net: {(simAmount - simResult).toLocaleString()} Units
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* TAB: Multi-Currency Engine */}
            {activeTab === 'currencies' && (
                <div className="bg-[#0D1017]/80 border border-[#1E2533] rounded-3xl p-8 backdrop-blur-md shadow-2xl space-y-6">
                    <div className="flex items-center justify-between border-b border-[#1E2533] pb-6">
                        <h3 className="text-base font-bold text-white uppercase tracking-wider flex items-center gap-3">
                            <Coins className="text-primary-orange" size={22} />
                            Supported Assets & Precision Engine
                        </h3>
                        <button
                            onClick={() => setShowAddCurrencyModal(true)}
                            className="flex items-center gap-2 px-5 py-2 bg-primary-orange hover:bg-primary-orange-hover text-white font-black text-[10px] uppercase tracking-widest rounded-xl transition-all"
                        >
                            <Plus size={12} />
                            Add Currency
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {currencies.map((curr: any) => (
                            <div key={curr._id} className="p-6 bg-[#07090E]/40 border border-[#1E2533] rounded-2xl hover:border-primary-orange/20 transition-all flex flex-col justify-between gap-4">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <span className="text-lg font-mono font-black text-white">{curr.code}</span>
                                        <p className="text-xs text-slate-500 font-bold mt-1 font-sans">{curr.name}</p>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <span className="text-xs font-mono font-bold text-slate-600">{curr.symbol}</span>
                                        <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded ${curr.enabled ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                                            {curr.enabled ? 'Active' : 'Disabled'}
                                        </span>
                                    </div>
                                </div>

                                <div className="space-y-2 border-t border-[#1E2533] pt-4 font-mono text-[10px]">
                                    <div className="flex justify-between text-slate-500">
                                        <span>Display Precision:</span>
                                        <span className="text-slate-300 font-bold">{curr.precision} decimals</span>
                                    </div>
                                    <div className="flex justify-between text-slate-500">
                                        <span>Auto rates sync:</span>
                                        <span className="text-slate-300 font-bold">{curr.conversionRules?.autoSync ? 'Yes' : 'No'}</span>
                                    </div>
                                    <div className="flex justify-between text-slate-500">
                                        <span>Min Limit:</span>
                                        <span className="text-slate-300 font-bold">{curr.conversionRules?.minLimit?.toLocaleString() || 0}</span>
                                    </div>
                                </div>

                                <div className="flex gap-2 pt-2 border-t border-[#1E2533]/50">
                                    <button 
                                        onClick={() => setSelectedCurrency(curr)}
                                        className="flex-1 py-2 bg-[#07090E] border border-[#1E2533] hover:border-primary-orange/20 text-slate-400 hover:text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-all"
                                    >
                                        Configure rules
                                    </button>
                                    <button 
                                        onClick={() => handleDeleteCurrency(curr.code)}
                                        className="p-2 bg-rose-600/10 hover:bg-rose-600/20 text-rose-400 border border-rose-500/20 rounded-xl transition-all"
                                        title="Delete Currency"
                                    >
                                        <Trash2 size={12} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* TAB: Regional Operations */}
            {activeTab === 'regions' && (
                <div className="bg-[#0D1017]/80 border border-[#1E2533] rounded-3xl p-8 backdrop-blur-md shadow-2xl space-y-6">
                    <div className="flex items-center justify-between border-b border-[#1E2533] pb-6">
                        <h3 className="text-base font-bold text-white uppercase tracking-wider flex items-center gap-3">
                            <Globe className="text-primary-orange" size={22} />
                            Regional Terminals & Compliance limits
                        </h3>
                        <button
                            onClick={() => setShowAddRegionModal(true)}
                            className="flex items-center gap-2 px-5 py-2 bg-primary-orange hover:bg-primary-orange-hover text-white font-black text-[10px] uppercase tracking-widest rounded-xl transition-all"
                        >
                            <Plus size={12} />
                            Add Region
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {config.regions.map((region: any) => {
                            const isFrozen = config.conversionControl?.disabledRegions?.includes(region.countryCode);
                            return (
                                <div key={region._id} className={`p-6 bg-[#07090E]/40 border border-[#1E2533] rounded-2xl hover:border-primary-orange/20 transition-all flex flex-col justify-between gap-4 ${isFrozen ? 'opacity-40 border-rose-500/20' : ''}`}>
                                    <div className="flex justify-between items-start">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-primary-orange text-white rounded-xl flex items-center justify-center font-mono font-bold text-sm">
                                                {region.countryCode}
                                            </div>
                                            <div>
                                                <h4 className="text-xs font-bold text-white">{region.countryName}</h4>
                                                <span className="text-[9px] text-slate-500 font-mono font-bold uppercase tracking-widest mt-1 block">
                                                    {region.phonePrefix} • {region.currencyCode}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end gap-1">
                                            <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded ${region.status === 'ENABLED' && !isFrozen ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'}`}>
                                                {isFrozen ? 'Emergency Halt' : region.status}
                                            </span>
                                            <span className={`text-[7px] font-black uppercase px-1.5 py-0.5 rounded ${region.operationalHealth === 'HEALTHY' ? 'bg-emerald-500/10 text-emerald-400' : (region.operationalHealth === 'OUTAGE' ? 'bg-rose-500/10 text-rose-400' : 'bg-amber-500/10 text-amber-400')}`}>
                                                {region.operationalHealth}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="space-y-2.5 border-t border-[#1E2533] pt-4 font-mono text-[9px]">
                                        <div className="flex justify-between text-slate-500">
                                            <span>KYC requirements:</span>
                                            <span className="text-slate-300 font-bold break-all max-w-[120px] text-right font-sans">
                                                {region.kycRequirements?.join(', ') || 'National ID'}
                                            </span>
                                        </div>
                                        <div className="flex justify-between text-slate-500">
                                            <span>Withholding / VAT:</span>
                                            <span className="text-slate-300 font-bold">
                                                {region.taxRules?.withholdingTaxPercent || 0}% / {region.taxRules?.vatPercent || 0}%
                                            </span>
                                        </div>
                                        <div className="flex justify-between text-slate-500">
                                            <span>Daily / Lifetime limit:</span>
                                            <span className="text-slate-300 font-bold text-right">
                                                {(region.limits?.dailyMax || 100000).toLocaleString()} / {(region.limits?.lifetimeMax || 1000000).toLocaleString()}
                                            </span>
                                        </div>
                                        <div className="flex justify-between text-slate-500">
                                            <span>Pay / Withdraw methods:</span>
                                            <span className="text-slate-300 font-bold text-right font-sans max-w-[120px] break-all">
                                                {region.paymentMethods?.join(', ') || 'Mobile Money, Bank'}
                                            </span>
                                        </div>
                                    </div>

                                    <button 
                                        onClick={() => setSelectedRegion(region)}
                                        className="w-full mt-2 py-2 bg-[#07090E] border border-[#1E2533] hover:border-primary-orange/20 text-slate-400 hover:text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-all"
                                    >
                                        Edit operational settings
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* TAB: Emergency Kill switches */}
            {activeTab === 'emergency' && (
                <div className="bg-[#0D1017]/80 border border-[#1E2533] rounded-3xl p-8 backdrop-blur-md shadow-2xl space-y-8">
                    <div className="flex items-center gap-3 border-b border-[#1E2533] pb-6">
                        <ShieldAlert className="text-rose-500 animate-pulse" size={24} />
                        <div>
                            <h3 className="text-base font-bold text-white uppercase tracking-wider">
                                Global Emergency Controls & Circuit Breakers
                            </h3>
                            <p className="text-[10px] text-slate-500 font-medium font-sans mt-1">
                                Lock down critical services immediately during high volatility, security breaches, or compliance updates.
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Conversions breaker */}
                        <div className="p-6 bg-[#07090E]/40 border border-[#1E2533] rounded-2xl flex flex-col justify-between gap-4">
                            <div>
                                <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded ${config.conversionControl.conversionsFrozen ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'}`}>
                                    {config.conversionControl.conversionsFrozen ? 'Circuit Broken' : 'Operational'}
                                </span>
                                <h4 className="text-sm font-bold text-white mt-2">KES/USDT Conversions</h4>
                                <p className="text-[10px] text-slate-500 leading-relaxed mt-2 font-medium font-sans">
                                    Freezes all exchange and currency conversion actions instantly.
                                </p>
                            </div>
                            <button
                                onClick={() => triggerEmergencyModal('CONVERSIONS', !config.conversionControl.conversionsFrozen)}
                                className={`w-full py-2.5 text-xs font-black uppercase tracking-widest rounded-xl transition-all ${config.conversionControl.conversionsFrozen ? 'bg-emerald-600 hover:bg-emerald-500 text-white' : 'bg-rose-600 hover:bg-rose-500 text-white'}`}
                            >
                                {config.conversionControl.conversionsFrozen ? 'Resume conversions' : 'Halt conversions'}
                            </button>
                        </div>

                        {/* Deposits breaker */}
                        <div className="p-6 bg-[#07090E]/40 border border-[#1E2533] rounded-2xl flex flex-col justify-between gap-4">
                            <div>
                                <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded ${config.conversionControl.depositsFrozen ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'}`}>
                                    {config.conversionControl.depositsFrozen ? 'Circuit Broken' : 'Operational'}
                                </span>
                                <h4 className="text-sm font-bold text-white mt-2">Incoming Deposits</h4>
                                <p className="text-[10px] text-slate-500 leading-relaxed mt-2 font-medium font-sans">
                                    Freezes all new incoming deposit allocations and M-Pesa pushes.
                                </p>
                            </div>
                            <button
                                onClick={() => triggerEmergencyModal('DEPOSITS', !config.conversionControl.depositsFrozen)}
                                className={`w-full py-2.5 text-xs font-black uppercase tracking-widest rounded-xl transition-all ${config.conversionControl.depositsFrozen ? 'bg-emerald-600 hover:bg-emerald-500 text-white' : 'bg-rose-600 hover:bg-rose-500 text-white'}`}
                            >
                                {config.conversionControl.depositsFrozen ? 'Resume deposits' : 'Halt deposits'}
                            </button>
                        </div>

                        {/* Withdrawals breaker */}
                        <div className="p-6 bg-[#07090E]/40 border border-[#1E2533] rounded-2xl flex flex-col justify-between gap-4">
                            <div>
                                <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded ${config.conversionControl.withdrawalsFrozen ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'}`}>
                                    {config.conversionControl.withdrawalsFrozen ? 'Circuit Broken' : 'Operational'}
                                </span>
                                <h4 className="text-sm font-bold text-white mt-2">Outgoing Withdrawals</h4>
                                <p className="text-[10px] text-slate-500 leading-relaxed mt-2 font-medium font-sans">
                                    Freezes all outgoing payouts and withdrawals from wallets.
                                </p>
                            </div>
                            <button
                                onClick={() => triggerEmergencyModal('WITHDRAWALS', !config.conversionControl.withdrawalsFrozen)}
                                className={`w-full py-2.5 text-xs font-black uppercase tracking-widest rounded-xl transition-all ${config.conversionControl.withdrawalsFrozen ? 'bg-emerald-600 hover:bg-emerald-500 text-white' : 'bg-rose-600 hover:bg-rose-500 text-white'}`}
                            >
                                {config.conversionControl.withdrawalsFrozen ? 'Resume withdrawals' : 'Halt withdrawals'}
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 border-t border-[#1E2533] pt-8">
                        {/* Freeze regions list */}
                        <div className="space-y-4">
                            <h4 className="text-xs font-bold text-white uppercase tracking-wider">Halt Specific Country Operations</h4>
                            <div className="space-y-2">
                                {config.regions.map((reg: any) => {
                                    const isHalted = config.conversionControl.disabledRegions?.includes(reg.countryCode);
                                    return (
                                        <div key={reg._id} className="p-4 bg-[#07090E]/30 border border-[#1E2533] rounded-xl flex justify-between items-center">
                                            <span className="text-xs font-bold text-slate-300 font-sans">{reg.countryName} ({reg.countryCode})</span>
                                            <button
                                                onClick={() => triggerEmergencyModal('DISABLE_REGION', !isHalted, reg.countryCode, reg.countryName)}
                                                className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${isHalted ? 'bg-emerald-600 hover:bg-emerald-500 text-white' : 'bg-rose-600/10 hover:bg-rose-600/20 text-rose-400 border border-rose-500/20'}`}
                                            >
                                                {isHalted ? 'Resume' : 'Lock'}
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Freeze currencies list */}
                        <div className="space-y-4">
                            <h4 className="text-xs font-bold text-white uppercase tracking-wider">Halt Specific Currency Operations</h4>
                            <div className="space-y-2">
                                {currencies.map((curr: any) => {
                                    const isHalted = config.conversionControl.disabledCurrencies?.includes(curr.code);
                                    return (
                                        <div key={curr._id} className="p-4 bg-[#07090E]/30 border border-[#1E2533] rounded-xl flex justify-between items-center">
                                            <span className="text-xs font-bold text-slate-300 font-mono">{curr.code} ({curr.name})</span>
                                            <button
                                                onClick={() => triggerEmergencyModal('DISABLE_CURRENCY', !isHalted, curr.code, curr.name)}
                                                className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${isHalted ? 'bg-emerald-600 hover:bg-emerald-500 text-white' : 'bg-rose-600/10 hover:bg-rose-600/20 text-rose-400 border border-rose-500/20'}`}
                                            >
                                                {isHalted ? 'Resume' : 'Lock'}
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* TAB: Compliance Audit Logs */}
            {activeTab === 'history' && (
                <div className="bg-[#0D1017]/80 border border-[#1E2533] rounded-3xl p-8 backdrop-blur-md shadow-2xl space-y-6">
                    <h3 className="text-base font-bold text-white uppercase tracking-wider flex items-center gap-3 border-b border-[#1E2533] pb-6">
                        <History className="text-primary-orange" size={22} />
                        Treasury Configuration Compliance History
                    </h3>

                    <div className="space-y-4">
                        {history.map((h: any, i: number) => (
                            <div key={i} className="p-5 bg-[#07090E]/40 border border-[#1E2533] rounded-2xl flex flex-col md:flex-row justify-between md:items-center gap-4 text-xs font-mono">
                                <div>
                                    <span className="px-2 py-0.5 bg-primary-orange-light text-primary-orange border border-primary-orange-border/30 rounded text-[9px] font-black uppercase tracking-widest">
                                        {h.type}
                                    </span>
                                    <p className="text-slate-300 font-sans font-bold mt-2">
                                        Authorizer: @{h.changedBy?.username || 'Admin'} ({h.changedBy?.email || 'System'})
                                    </p>
                                    <p className="text-[10px] text-slate-500 font-sans mt-0.5">
                                        {new Date(h.timestamp).toLocaleString()}
                                    </p>
                                </div>
                                <div className="text-right flex flex-col items-end gap-2">
                                    <div className="px-3 py-1 bg-[#07090E] border border-[#1E2533] rounded-lg text-[10px] text-slate-400">
                                        IP: {h.ip || 'Unknown'}
                                    </div>
                                    <span className="text-[8px] text-slate-600 font-sans font-medium max-w-[200px] truncate" title={h.userAgent}>
                                        {h.userAgent || 'N/A'}
                                    </span>
                                </div>
                            </div>
                        ))}
                        {history.length === 0 && (
                            <p className="text-center py-12 text-slate-500 font-bold uppercase tracking-wider text-xs">
                                No historical change logs found.
                            </p>
                        )}
                    </div>
                </div>
            )}

            {/* MODAL: Emergency Double Confirmation */}
            {confirmEmergency && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[70] flex items-center justify-center p-6 animate-in fade-in duration-300 font-sans">
                    <div className="bg-[#0D1017] border border-[#1E2533] rounded-3xl w-full max-w-md p-8 shadow-2xl space-y-6">
                        <div className="text-center">
                            <div className="w-16 h-16 bg-rose-600/10 border border-rose-500/20 text-rose-500 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse">
                                <ShieldAlert size={36} />
                            </div>
                            <h3 className="text-lg font-bold text-white uppercase tracking-wider">Double Confirmation</h3>
                            <p className="text-xs text-rose-400/80 mt-2 font-medium">
                                You are about to toggle critical system state {confirmEmergency.type} {confirmEmergency.targetName ? `for "${confirmEmergency.targetName}"` : ''} to:
                                <span className="font-black text-white block mt-1 uppercase text-sm">
                                    {confirmEmergency.actionState ? 'HALTED / DISABLED' : 'OPERATIONAL / ACTIVE'}
                                </span>
                            </p>
                        </div>

                        <div className="space-y-4 pt-2">
                            <div className="space-y-2">
                                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest pl-0.5">Authorization Reason (Required)</label>
                                <textarea 
                                    value={emergencyReason}
                                    onChange={(e) => setEmergencyReason(e.target.value)}
                                    placeholder="State the audit reason..."
                                    className="w-full h-20 p-3 bg-[#07090E] border border-[#1E2533] rounded-xl text-xs text-slate-200 placeholder:text-slate-700 focus:outline-none focus:border-rose-500 resize-none"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest pl-0.5">Type "CONFIRM" to authorize</label>
                                <input 
                                    type="text"
                                    value={doubleConfirmText}
                                    onChange={(e) => setDoubleConfirmText(e.target.value)}
                                    placeholder="CONFIRM"
                                    className="w-full p-3 bg-[#07090E] border border-[#1E2533] rounded-xl text-xs text-center font-black uppercase text-white tracking-widest focus:outline-none focus:border-rose-500"
                                />
                            </div>
                        </div>

                        <div className="flex gap-3 pt-4">
                            <button onClick={() => setConfirmEmergency(null)} className="flex-1 py-3 text-slate-500 font-bold text-xs uppercase hover:text-white transition-colors">Abort</button>
                            <button
                                onClick={handleProcessEmergency}
                                disabled={saving}
                                className="flex-2 px-8 py-3 bg-rose-600 hover:bg-rose-500 text-white font-black text-xs rounded-xl shadow-lg shadow-rose-500/20 flex items-center justify-center gap-2 uppercase tracking-widest disabled:opacity-50"
                            >
                                {saving ? <Loader2 className="animate-spin" size={14} /> : null}
                                Execute Control
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL: New Rate Pair */}
            {newPairModal && (
                <NewRateModal
                    onClose={() => setNewPairModal(false)}
                    onSuccess={() => { setNewPairModal(false); fetchData(); }}
                />
            )}

            {/* MODAL: Add Region */}
            {showAddRegionModal && (
                <AddRegionModal
                    onClose={() => setShowAddRegionModal(false)}
                    onSuccess={() => { setShowAddRegionModal(false); fetchData(); }}
                />
            )}

            {/* MODAL: Add Currency */}
            {showAddCurrencyModal && (
                <AddCurrencyModal
                    onClose={() => setShowAddCurrencyModal(false)}
                    onSuccess={() => { setShowAddCurrencyModal(false); fetchData(); }}
                />
            )}

            {/* MODAL: Edit Regional Limits & settings */}
            {selectedRegion && (
                <EditRegionModal
                    region={selectedRegion}
                    onClose={() => setSelectedRegion(null)}
                    onSuccess={(data: any) => handleUpdateRegionDetails(selectedRegion.countryCode, data)}
                />
            )}

            {/* MODAL: Edit Currency limits & settings */}
            {selectedCurrency && (
                <EditCurrencyModal
                    currency={selectedCurrency}
                    onClose={() => setSelectedCurrency(null)}
                    onSuccess={(data: any) => handleUpdateCurrency(selectedCurrency.code, data)}
                />
            )}
        </div>
    );
}

// Subcomponent: Executive Metric Tile
function MetricCard({ title, value, trend, up, desc }: any) {
    return (
        <div className="bg-[#0D1017]/80 border border-[#1E2533] rounded-3xl p-6 backdrop-blur-md shadow-2xl flex flex-col justify-between gap-2 hover:border-primary-orange/20 transition-all duration-300 group">
            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest group-hover:text-primary-orange transition-colors">{title}</span>
            <div className="flex items-baseline gap-2 mt-1">
                <span className="text-xl font-black text-white font-mono">{value}</span>
                {trend && (
                    <span className={`text-[10px] font-bold ${up ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {trend}
                    </span>
                )}
            </div>
            {desc && <p className="text-[9px] text-slate-500 font-medium font-sans mt-0.5">{desc}</p>}
        </div>
    );
}

// Subcomponent: Navigation tab button
function TabButton({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            className={`pb-4 text-xs font-black uppercase tracking-widest border-b-2 transition-all relative outline-none shrink-0 ${active ? 'border-primary-orange text-white' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
        >
            {label}
        </button>
    );
}

// Render dynamic analytics SVG line charts
function renderAnalyticsChart(charts: any) {
    if (!charts || !charts.volume || charts.volume.length === 0) {
        return <div className="h-full flex items-center justify-center text-slate-600 font-black uppercase tracking-widest text-xs">No analytics data compiled.</div>;
    }

    const labels: string[] = charts.labels || [];
    const volData: number[] = charts.volume || [];
    const revData: number[] = charts.revenue || [];

    const width = 800;
    const height = 240;
    const padding = 20;

    const maxVal = Math.max(...volData, 1);
    const minVal = Math.min(...volData, 0);
    const range = maxVal - minVal;

    const points = volData.map((val, i) => {
        const x = padding + (i / (volData.length - 1)) * (width - padding * 2);
        const y = height - padding - ((val - minVal) / range) * (height - padding * 2);
        return { x, y, value: val, label: labels[i] };
    });

    const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
    const areaPath = points.length > 0 
        ? `${linePath} L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z` 
        : '';

    return (
        <div className="w-full">
            <svg className="w-full h-56 overflow-visible" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
                <defs>
                    <linearGradient id="glow" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#FF6B00" stopOpacity="0.25"/>
                        <stop offset="100%" stopColor="#FF6B00" stopOpacity="0.0"/>
                    </linearGradient>
                </defs>
                
                {/* Area Background */}
                {areaPath && <path d={areaPath} fill="url(#glow)" />}

                {/* Line path */}
                {linePath && <path d={linePath} fill="none" stroke="#FF6B00" strokeWidth="2.5" strokeLinecap="round" />}

                {/* Points */}
                {points.map((p, idx) => (
                    <g key={idx}>
                        <circle cx={p.x} cy={p.y} r="4" fill="#0D1017" stroke="#FF6B00" strokeWidth="2" className="cursor-pointer" />
                        <text x={p.x} y={height - 2} fill="#64748B" fontSize="8" textAnchor="middle" fontWeight="bold" fontFamily="monospace">
                            {p.label}
                        </text>
                    </g>
                ))}
            </svg>
        </div>
    );
}

// Subcomponent: Fee Editor Card
function FeeEditorField({ label, config, onChange }: { label: string; config: any; onChange: (v: any) => void }) {
    if (!config) return null;
    return (
        <div className="p-5 bg-[#07090E]/30 border border-[#1E2533] rounded-2xl space-y-4">
            <div className="flex justify-between items-center">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</span>
                <select
                    value={config.type}
                    onChange={(e) => onChange({ ...config, type: e.target.value })}
                    className="bg-[#07090E] border border-[#1E2533] text-slate-300 rounded-lg px-2 py-1 text-[10px] font-black uppercase outline-none focus:border-primary-orange"
                >
                    <option value="percentage">Percentage</option>
                    <option value="fixed">Fixed Flat</option>
                    <option value="tiered">Tiered Rates</option>
                </select>
            </div>

            {config.type !== 'tiered' ? (
                <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-black text-slate-600">
                        {config.type === 'percentage' ? '%' : 'Flat'}
                    </span>
                    <input
                        type="number"
                        step="0.01"
                        value={config.value}
                        onChange={(e) => onChange({ ...config, value: parseFloat(e.target.value) || 0 })}
                        className="w-full pl-12 pr-4 py-2.5 bg-[#07090E] border border-[#1E2533] rounded-xl text-xs font-black text-slate-200 focus:outline-none focus:border-primary-orange font-mono"
                    />
                </div>
            ) : (
                <div className="space-y-3">
                    <div className="space-y-1">
                        {(config.tiers || []).map((t: any, idx: number) => (
                            <div key={idx} className="flex gap-2 items-center">
                                <span className="text-[9px] text-slate-500 font-mono">Up to:</span>
                                <input
                                    type="number"
                                    value={t.limit}
                                    onChange={(e) => {
                                        const newTiers = [...config.tiers];
                                        newTiers[idx].limit = parseFloat(e.target.value) || 0;
                                        onChange({ ...config, tiers: newTiers });
                                    }}
                                    placeholder="Limit"
                                    className="w-20 bg-[#07090E] border border-[#1E2533] rounded-lg px-2 py-1 text-[10px] text-white font-mono"
                                />
                                <span className="text-[9px] text-slate-500 font-mono">Fee:</span>
                                <input
                                    type="number"
                                    value={t.fee}
                                    onChange={(e) => {
                                        const newTiers = [...config.tiers];
                                        newTiers[idx].fee = parseFloat(e.target.value) || 0;
                                        onChange({ ...config, tiers: newTiers });
                                    }}
                                    placeholder="Fee"
                                    className="w-20 bg-[#07090E] border border-[#1E2533] rounded-lg px-2 py-1 text-[10px] text-white font-mono"
                                />
                                <button
                                    onClick={() => {
                                        const newTiers = config.tiers.filter((_: any, i: number) => i !== idx);
                                        onChange({ ...config, tiers: newTiers });
                                    }}
                                    className="text-rose-500 text-xs font-bold px-1"
                                >
                                    &times;
                                </button>
                            </div>
                        ))}
                    </div>
                    <button
                        onClick={() => {
                            const newTiers = [...(config.tiers || []), { limit: 1000, fee: 1 }];
                            onChange({ ...config, tiers: newTiers });
                        }}
                        className="py-1 px-3 bg-[#07090E] hover:bg-[#07090E]/50 border border-[#1E2533] text-[9px] font-black text-slate-400 rounded-lg uppercase tracking-wider flex items-center gap-1"
                    >
                        <Plus size={10} /> Add Tier
                    </button>
                </div>
            )}
        </div>
    );
}

// MODAL: New rates pair creator
function NewRateModal({ onClose, onSuccess }: any) {
    const [base, setBase] = useState('USDT');
    const [quote, setQuote] = useState('KES');
    const [rate, setRate] = useState('');
    const [saving, setSaving] = useState(false);
 
    const handleSubmit = async () => {
        if (!rate || parseFloat(rate) <= 0) return alert("Please enter a valid rate");
        try {
            setSaving(true);
            await adminService.updateRatePair({ baseCurrency: base, quoteCurrency: quote, rate: parseFloat(rate), source: 'manual' });
            onSuccess();
        } catch (err: any) {
            alert(err.message);
        } finally {
            setSaving(false);
        }
    };
 
    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[60] flex items-center justify-center p-6 animate-in fade-in duration-300 font-sans">
            <div className="bg-[#0D1017] border border-[#1E2533] rounded-3xl w-full max-w-sm p-8 shadow-2xl space-y-6">
                <div className="text-center">
                    <div className="w-16 h-16 bg-primary-orange-light border border-primary-orange-border/30 text-primary-orange rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <Plus size={32} />
                    </div>
                    <h3 className="text-lg font-bold text-white uppercase tracking-wider">Add Exchange Pair</h3>
                    <p className="text-xs text-slate-500 mt-2">Initialize a new currency exchange rate pair.</p>
                </div>
 
                <div className="space-y-4 pt-2">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest pl-1">Base Code</label>
                            <input value={base} onChange={e => setBase(e.target.value.toUpperCase())} className="w-full bg-[#07090E] border border-[#1E2533] rounded-xl px-4 py-2.5 text-sm font-bold text-white focus:border-primary-orange outline-none uppercase font-mono" placeholder="USDT" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest pl-1">Quote Code</label>
                            <input value={quote} onChange={e => setQuote(e.target.value.toUpperCase())} className="w-full bg-[#07090E] border border-[#1E2533] rounded-xl px-4 py-2.5 text-sm font-bold text-white focus:border-primary-orange outline-none uppercase font-mono" placeholder="KES" />
                        </div>
                    </div>
                    <div className="space-y-2 pt-2">
                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest pl-1">Direct Exchange Rate (1 {base} = ? {quote})</label>
                        <input value={rate} onChange={e => setRate(e.target.value)} type="number" step="0.01" className="w-full bg-[#07090E] border border-[#1E2533] rounded-xl px-4 py-3 text-base font-black text-white focus:border-primary-orange outline-none placeholder:text-slate-800 font-mono" placeholder="0.00" />
                    </div>
                </div>

                <div className="flex gap-3 pt-4">
                    <button onClick={onClose} className="flex-1 py-3 text-slate-500 font-bold text-xs uppercase hover:text-white transition-colors">Cancel</button>
                    <button
                        onClick={handleSubmit}
                        disabled={saving}
                        className="flex-3 px-8 py-3 bg-primary-orange hover:bg-primary-orange-hover text-white font-black text-xs rounded-xl shadow-lg shadow-primary-orange/20 flex items-center justify-center gap-2 uppercase tracking-widest"
                    >
                        {saving ? <Loader2 className="animate-spin" size={14} /> : <Save size={14} />}
                        Add Pair
                    </button>
                </div>
            </div>
        </div>
    );
}

// MODAL: Add dynamic currency
function AddCurrencyModal({ onClose, onSuccess }: any) {
    const [code, setCode] = useState('');
    const [name, setName] = useState('');
    const [symbol, setSymbol] = useState('');
    const [precision, setPrecision] = useState(2);
    const [saving, setSaving] = useState(false);

    const handleSubmit = async () => {
        if (!code || !name || !symbol) return alert("All fields are required.");
        try {
            setSaving(true);
            await adminService.addCurrency({ code, name, symbol, precision });
            onSuccess();
        } catch (err: any) {
            alert(err.message);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[60] flex items-center justify-center p-6 animate-in fade-in duration-300 font-sans">
            <div className="bg-[#0D1017] border border-[#1E2533] rounded-3xl w-full max-w-sm p-8 shadow-2xl space-y-6">
                <div className="text-center">
                    <div className="w-16 h-16 bg-primary-orange-light border border-primary-orange-border/30 text-primary-orange rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <Coins size={32} />
                    </div>
                    <h3 className="text-lg font-bold text-white uppercase tracking-wider">Add Supported Asset</h3>
                </div>

                <div className="space-y-4 pt-2">
                    <div className="space-y-2">
                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest pl-1">Currency Code</label>
                        <input value={code} onChange={e => setCode(e.target.value.toUpperCase())} className="w-full bg-[#07090E] border border-[#1E2533] rounded-xl px-4 py-2 text-xs font-bold text-white uppercase outline-none focus:border-primary-orange font-mono" placeholder="EUR" maxLength={4} />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest pl-1">Full Currency Name</label>
                        <input value={name} onChange={e => setName(e.target.value)} className="w-full bg-[#07090E] border border-[#1E2533] rounded-xl px-4 py-2 text-xs font-bold text-white outline-none focus:border-primary-orange" placeholder="Euro" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest pl-1">Symbol</label>
                            <input value={symbol} onChange={e => setSymbol(e.target.value)} className="w-full bg-[#07090E] border border-[#1E2533] rounded-xl px-4 py-2 text-xs font-bold text-white outline-none focus:border-primary-orange font-mono" placeholder="€" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest pl-1">Display Precision</label>
                            <input type="number" value={precision} onChange={e => setPrecision(parseInt(e.target.value) || 2)} className="w-full bg-[#07090E] border border-[#1E2533] rounded-xl px-4 py-2 text-xs font-bold text-white outline-none focus:border-primary-orange font-mono" placeholder="2" />
                        </div>
                    </div>
                </div>

                <div className="flex gap-3 pt-4">
                    <button onClick={onClose} className="flex-1 py-3 text-slate-500 font-bold text-xs uppercase hover:text-white transition-colors">Cancel</button>
                    <button
                        onClick={handleSubmit}
                        disabled={saving}
                        className="flex-3 px-8 py-3 bg-primary-orange hover:bg-primary-orange-hover text-white font-black text-xs rounded-xl shadow-lg shadow-primary-orange/20 flex items-center justify-center gap-2 uppercase tracking-widest"
                    >
                        {saving ? <Loader2 className="animate-spin" size={14} /> : <Save size={14} />}
                        Save Asset
                    </button>
                </div>
            </div>
        </div>
    );
}

// MODAL: Edit dynamic currency rules
function EditCurrencyModal({ currency, onClose, onSuccess }: any) {
    const [name, setName] = useState(currency.name || '');
    const [symbol, setSymbol] = useState(currency.symbol || '');
    const [precision, setPrecision] = useState(currency.precision || 2);
    const [enabled, setEnabled] = useState(currency.enabled);
    const [isDefault, setIsDefault] = useState(currency.isDefault || false);
    const [minLimit, setMinLimit] = useState(currency.conversionRules?.minLimit || 0);
    const [maxLimit, setMaxLimit] = useState(currency.conversionRules?.maxLimit || 1000000);
    const [autoSync, setAutoSync] = useState(currency.conversionRules?.autoSync !== false);

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[60] flex items-center justify-center p-6 animate-in fade-in duration-300 font-sans">
            <div className="bg-[#0D1017] border border-[#1E2533] rounded-3xl w-full max-w-sm p-8 shadow-2xl space-y-6">
                <h3 className="text-base font-bold text-white uppercase tracking-wider text-center">
                    Configure Asset Rules ({currency.code})
                </h3>

                <div className="space-y-4 pt-2">
                    <div className="space-y-2">
                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest pl-1">Name</label>
                        <input value={name} onChange={e => setName(e.target.value)} className="w-full bg-[#07090E] border border-[#1E2533] rounded-xl px-4 py-2 text-xs text-white" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest pl-1">Symbol</label>
                            <input value={symbol} onChange={e => setSymbol(e.target.value)} className="w-full bg-[#07090E] border border-[#1E2533] rounded-xl px-4 py-2 text-xs text-white font-mono" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest pl-1">Precision</label>
                            <input type="number" value={precision} onChange={e => setPrecision(parseInt(e.target.value) || 2)} className="w-full bg-[#07090E] border border-[#1E2533] rounded-xl px-4 py-2 text-xs text-white font-mono" />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest pl-1">Min conversion limit</label>
                            <input type="number" value={minLimit} onChange={e => setMinLimit(parseFloat(e.target.value) || 0)} className="w-full bg-[#07090E] border border-[#1E2533] rounded-xl px-4 py-2 text-xs text-white font-mono" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest pl-1">Max conversion limit</label>
                            <input type="number" value={maxLimit} onChange={e => setMaxLimit(parseFloat(e.target.value) || 0)} className="w-full bg-[#07090E] border border-[#1E2533] rounded-xl px-4 py-2 text-xs text-white font-mono" />
                        </div>
                    </div>
                    
                    <div className="flex justify-between items-center pt-2">
                        <span className="text-[10px] font-black text-slate-500 uppercase">Enable Auto Sync:</span>
                        <input type="checkbox" checked={autoSync} onChange={e => setAutoSync(e.target.checked)} className="accent-primary-orange cursor-pointer" />
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-[10px] font-black text-slate-500 uppercase">Default Base Currency:</span>
                        <input type="checkbox" checked={isDefault} onChange={e => setIsDefault(e.target.checked)} className="accent-primary-orange cursor-pointer" />
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-[10px] font-black text-slate-500 uppercase">Active Status:</span>
                        <input type="checkbox" checked={enabled} onChange={e => setEnabled(e.target.checked)} className="accent-primary-orange cursor-pointer" />
                    </div>
                </div>

                <div className="flex gap-3 pt-4">
                    <button onClick={onClose} className="flex-1 py-3 text-slate-500 font-bold text-xs uppercase hover:text-white transition-colors">Cancel</button>
                    <button
                        onClick={() => onSuccess({ name, symbol, precision, enabled, isDefault, conversionRules: { minLimit, maxLimit, autoSync } })}
                        className="flex-3 px-8 py-3 bg-primary-orange text-white font-black text-xs rounded-xl shadow-lg uppercase tracking-widest"
                    >
                        Save Configuration
                    </button>
                </div>
            </div>
        </div>
    );
}

// MODAL: Add supported Region
function AddRegionModal({ onClose, onSuccess }: any) {
    const [countryName, setCountryName] = useState('');
    const [countryCode, setCountryCode] = useState('');
    const [currencyCode, setCurrencyCode] = useState('');
    const [phonePrefix, setPhonePrefix] = useState('');
    const [saving, setSaving] = useState(false);
 
    const handleSubmit = async () => {
        if (!countryName || !countryCode || !currencyCode || !phonePrefix) {
            return alert("Please fill all fields");
        }
        try {
            setSaving(true);
            await adminService.addRegion({
                countryName,
                countryCode: countryCode.toUpperCase(),
                currencyCode: currencyCode.toUpperCase(),
                phonePrefix
            });
            onSuccess();
        } catch (err: any) {
            alert(err.message);
        } finally {
            setSaving(false);
        }
    };
 
    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[60] flex items-center justify-center p-6 animate-in fade-in duration-300 font-sans">
            <div className="bg-[#0D1017] border border-[#1E2533] rounded-3xl w-full max-w-md p-8 shadow-2xl space-y-6">
                <div className="text-center">
                    <div className="w-16 h-16 bg-primary-orange-light border border-primary-orange-border/30 text-primary-orange rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <Globe size={32} />
                    </div>
                    <h3 className="text-lg font-bold text-white uppercase tracking-wider">Add Supported Region</h3>
                    <p className="text-xs text-slate-500 mt-2">Registers a new country and its currency mapping.</p>
                </div>
 
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                    <div className="space-y-2 col-span-2">
                        <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest pl-1">Country Name</label>
                        <input value={countryName} onChange={e => setCountryName(e.target.value)} className="w-full bg-[#07090E] border border-[#1E2533] rounded-xl px-4 py-2.5 text-sm font-bold text-white focus:border-primary-orange outline-none" placeholder="e.g. Uganda" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest pl-1">Country Code (ISO)</label>
                        <input value={countryCode} onChange={e => setCountryCode(e.target.value.toUpperCase())} className="w-full bg-[#07090E] border border-[#1E2533] rounded-xl px-4 py-2.5 text-sm font-bold text-white focus:border-primary-orange outline-none font-mono" placeholder="UG" maxLength={2} />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest pl-1">Currency Code</label>
                        <input value={currencyCode} onChange={e => setCurrencyCode(e.target.value.toUpperCase())} className="w-full bg-[#07090E] border border-[#1E2533] rounded-xl px-4 py-2.5 text-sm font-bold text-white focus:border-primary-orange outline-none font-mono" placeholder="UGX" maxLength={4} />
                    </div>
                    <div className="space-y-2 col-span-2">
                        <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest pl-1">Phone Prefix</label>
                        <input value={phonePrefix} onChange={e => setPhonePrefix(e.target.value)} className="w-full bg-[#07090E] border border-[#1E2533] rounded-xl px-4 py-2.5 text-sm font-bold text-white focus:border-primary-orange outline-none font-mono" placeholder="+256" />
                    </div>
                </div>
 
                <div className="flex gap-3 pt-4">
                    <button onClick={onClose} className="flex-1 py-3 text-slate-500 font-bold text-xs uppercase hover:text-white transition-colors">Cancel</button>
                    <button
                        onClick={handleSubmit}
                        disabled={saving}
                        className="flex-3 px-8 py-3 bg-primary-orange hover:bg-primary-orange-hover text-white font-black text-xs rounded-xl shadow-lg shadow-primary-orange/20 flex items-center justify-center gap-2 uppercase tracking-widest"
                    >
                        {saving ? <Loader2 className="animate-spin" size={14} /> : <Save size={14} />}
                        Add Region
                    </button>
                </div>
            </div>
        </div>
    );
}

// MODAL: Edit Regional Settings & Compliance
function EditRegionModal({ region, onClose, onSuccess }: any) {
    const [status, setStatus] = useState(region.status || 'ENABLED');
    const [operationalHealth, setOperationalHealth] = useState(region.operationalHealth || 'HEALTHY');
    const [currencyCode, setCurrencyCode] = useState(region.currencyCode || '');
    const [phonePrefix, setPhonePrefix] = useState(region.phonePrefix || '');
    const [paymentMethodsText, setPaymentMethodsText] = useState(region.paymentMethods?.join(', ') || 'Mobile Money, Bank Transfer');
    const [withdrawalMethodsText, setWithdrawalMethodsText] = useState(region.withdrawalMethods?.join(', ') || 'Mobile Money, Bank Transfer');
    const [kycRequirementsText, setKycRequirementsText] = useState(region.kycRequirements?.join(', ') || 'National ID');
    const [withholdingTaxPercent, setWithholdingTaxPercent] = useState(region.taxRules?.withholdingTaxPercent || 0);
    const [vatPercent, setVatPercent] = useState(region.taxRules?.vatPercent || 0);
    const [dailyMax, setDailyMax] = useState(region.limits?.dailyMax || 100000);
    const [lifetimeMax, setLifetimeMax] = useState(region.limits?.lifetimeMax || 1000000);

    const handleSave = () => {
        const paymentMethods = paymentMethodsText.split(',').map((s: string) => s.trim()).filter(Boolean);
        const withdrawalMethods = withdrawalMethodsText.split(',').map((s: string) => s.trim()).filter(Boolean);
        const kycRequirements = kycRequirementsText.split(',').map((s: string) => s.trim()).filter(Boolean);

        onSuccess({
            status,
            operationalHealth,
            currencyCode,
            phonePrefix,
            paymentMethods,
            withdrawalMethods,
            kycRequirements,
            taxRules: { withholdingTaxPercent, vatPercent },
            limits: { dailyMax, lifetimeMax }
        });
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[60] flex items-center justify-center p-6 animate-in fade-in duration-300 font-sans">
            <div className="bg-[#0D1017] border border-[#1E2533] rounded-3xl w-full max-w-lg p-8 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto custom-scrollbar text-xs">
                <h3 className="text-base font-bold text-white uppercase tracking-wider text-center">
                    Regional Settings: {region.countryName} ({region.countryCode})
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest pl-1">Country Status</label>
                        <select 
                            value={status}
                            onChange={(e) => setStatus(e.target.value)}
                            className="w-full bg-[#07090E] border border-[#1E2533] text-slate-300 rounded-xl px-3 py-2 text-xs outline-none focus:border-primary-orange"
                        >
                            <option value="ENABLED">ENABLED</option>
                            <option value="DISABLED">DISABLED</option>
                            <option value="MAINTENANCE">MAINTENANCE</option>
                            <option value="RESTRICTED">RESTRICTED</option>
                        </select>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest pl-1">Operational Health</label>
                        <select 
                            value={operationalHealth}
                            onChange={(e) => setOperationalHealth(e.target.value)}
                            className="w-full bg-[#07090E] border border-[#1E2533] text-slate-300 rounded-xl px-3 py-2 text-xs outline-none focus:border-primary-orange"
                        >
                            <option value="HEALTHY">HEALTHY</option>
                            <option value="DEGRADED">DEGRADED</option>
                            <option value="OUTAGE">OUTAGE</option>
                        </select>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest pl-1">Currency Code</label>
                        <input value={currencyCode} onChange={e => setCurrencyCode(e.target.value.toUpperCase())} className="w-full bg-[#07090E] border border-[#1E2533] rounded-xl px-3 py-2 text-slate-100 font-mono" />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest pl-1">Phone Prefix</label>
                        <input value={phonePrefix} onChange={e => setPhonePrefix(e.target.value)} className="w-full bg-[#07090E] border border-[#1E2533] rounded-xl px-3 py-2 text-slate-100 font-mono" />
                    </div>

                    <div className="space-y-1.5 col-span-2">
                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest pl-1">Payment Methods (Comma separated)</label>
                        <input value={paymentMethodsText} onChange={e => setPaymentMethodsText(e.target.value)} className="w-full bg-[#07090E] border border-[#1E2533] rounded-xl px-3 py-2 text-slate-100" />
                    </div>

                    <div className="space-y-1.5 col-span-2">
                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest pl-1">Withdrawal Methods (Comma separated)</label>
                        <input value={withdrawalMethodsText} onChange={e => setWithdrawalMethodsText(e.target.value)} className="w-full bg-[#07090E] border border-[#1E2533] rounded-xl px-3 py-2 text-slate-100" />
                    </div>

                    <div className="space-y-1.5 col-span-2">
                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest pl-1">KYC Requirements (Comma separated)</label>
                        <input value={kycRequirementsText} onChange={e => setKycRequirementsText(e.target.value)} className="w-full bg-[#07090E] border border-[#1E2533] rounded-xl px-3 py-2 text-slate-100" />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest pl-1">Withholding Tax Percent (%)</label>
                        <input type="number" value={withholdingTaxPercent} onChange={e => setWithholdingTaxPercent(parseFloat(e.target.value) || 0)} className="w-full bg-[#07090E] border border-[#1E2533] rounded-xl px-3 py-2 text-slate-100 font-mono" />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest pl-1">VAT Percent (%)</label>
                        <input type="number" value={vatPercent} onChange={e => setVatPercent(parseFloat(e.target.value) || 0)} className="w-full bg-[#07090E] border border-[#1E2533] rounded-xl px-3 py-2 text-slate-100 font-mono" />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest pl-1">Daily Max Limit ({currencyCode})</label>
                        <input type="number" value={dailyMax} onChange={e => setDailyMax(parseFloat(e.target.value) || 0)} className="w-full bg-[#07090E] border border-[#1E2533] rounded-xl px-3 py-2 text-slate-100 font-mono" />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest pl-1">Lifetime Max Limit ({currencyCode})</label>
                        <input type="number" value={lifetimeMax} onChange={e => setLifetimeMax(parseFloat(e.target.value) || 0)} className="w-full bg-[#07090E] border border-[#1E2533] rounded-xl px-3 py-2 text-slate-100 font-mono" />
                    </div>
                </div>

                <div className="flex gap-3 pt-4 border-t border-[#1E2533] pt-4 mt-2">
                    <button onClick={onClose} className="flex-1 py-3 text-slate-500 font-bold text-xs uppercase hover:text-white transition-colors">Cancel</button>
                    <button
                        onClick={handleSave}
                        className="flex-2 px-8 py-3 bg-primary-orange hover:bg-primary-orange-hover text-white font-black text-xs rounded-xl shadow-lg uppercase tracking-widest"
                    >
                        Save Settings
                    </button>
                </div>
            </div>
        </div>
    );
}
