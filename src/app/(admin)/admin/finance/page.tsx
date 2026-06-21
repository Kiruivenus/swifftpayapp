"use client";

import React, { useState, useEffect, useCallback } from 'react';
import {
    ArrowUpRight,
    ArrowDownRight,
    RefreshCcw,
    Wallet,
    Search,
    Filter,
    Download,
    CheckCircle2,
    XCircle,
    MoreVertical,
    ChevronLeft,
    ChevronRight,
    TrendingUp,
    Banknote,
    Clock,
    Loader2,
    ShieldAlert,
    AlertTriangle,
    Layers,
    Calendar,
    ChevronDown,
    Check,
    X,
    Ban,
    ShieldCheck,
    Briefcase
} from 'lucide-react';
import { adminService } from '@/services/admin.service';
import Link from 'next/link';

export default function RedesignedFinancePage() {
    // States
    const [loading, setLoading] = useState(true);
    const [txLoading, setTxLoading] = useState(true);
    const [metrics, setMetrics] = useState<any>(null);
    const [transactions, setTransactions] = useState<any[]>([]);
    const [withdrawals, setWithdrawals] = useState<any[]>([]);
    const [rates, setRates] = useState<any[]>([]);
    const [rateHistory, setRateHistory] = useState<any[]>([]);
    
    // Filters & Queries
    const [search, setSearch] = useState('');
    const [filters, setFilters] = useState({
        type: '',
        status: '',
        currency: '',
        from: '',
        to: '',
        page: 1,
        limit: 10
    });
    
    // Analytics Charts timeframe & metric toggle
    const [chartTimeframe, setChartTimeframe] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('weekly');
    const [activeChartMetric, setActiveChartMetric] = useState<'deposits' | 'withdrawals' | 'revenue' | 'activity' | 'cashflow'>('deposits');
    
    // Interactive Overlays & Modals
    const [selectedTx, setSelectedTx] = useState<any | null>(null);
    const [selectedUser, setSelectedUser] = useState<any | null>(null);
    const [showExportModal, setShowExportModal] = useState(false);
    const [showRateModal, setShowRateModal] = useState(false);
    const [confirmModal, setConfirmModal] = useState<{
        show: boolean;
        action: 'APPROVE' | 'REJECT' | 'HOLD' | 'ESCALATE' | 'REVERSE' | 'RESOLVE_FAVOR_RECEIVER';
        txId: string;
        userName: string;
        amount: string;
        currency: string;
        type?: string;
    } | null>(null);

    // Form inputs
    const [actionReason, setActionReason] = useState('');
    const [ratePairForm, setRatePairForm] = useState({
        baseCurrency: 'USDT',
        quoteCurrency: 'KES',
        rate: 128.5
    });
    const [exportForm, setExportForm] = useState({
        reportType: 'financial',
        format: 'pdf',
        from: '',
        to: ''
    });

    const [processingId, setProcessingId] = useState<string | null>(null);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    // Load Overview & Analytics
    const fetchCoreMetrics = useCallback(async () => {
        try {
            setLoading(true);
            const [m, w, r, rh] = await Promise.all([
                adminService.getFinanceMetrics({ range: chartTimeframe }),
                adminService.getWithdrawals({ limit: 50 }),
                adminService.getRatesConfig(),
                adminService.getRatesHistory({ limit: 10 }).catch(() => ({ history: [] }))
            ]);
            setMetrics(m);
            setWithdrawals(w.items || []);
            setRates(r.fxRates || []);
            setRateHistory(rh.history || []);
        } catch (err: any) {
            console.error('Failed to load metrics:', err);
            setErrorMsg(err.message || 'Error occurred while loading data.');
        } finally {
            setLoading(false);
        }
    }, [chartTimeframe]);

    // Load filterable ledger
    const fetchLedger = useCallback(async () => {
        try {
            setTxLoading(true);
            const data = await adminService.getTransactions({
                q: search,
                ...filters
            });
            setTransactions(data.items || []);
        } catch (err) {
            console.error('Failed to load transactions:', err);
        } finally {
            setTxLoading(false);
        }
    }, [search, filters]);

    useEffect(() => {
        fetchCoreMetrics();
    }, [fetchCoreMetrics]);

    useEffect(() => {
        const timer = setTimeout(() => fetchLedger(), 400);
        return () => clearTimeout(timer);
    }, [fetchLedger]);

    // Handlers
    const triggerConfirmModal = (action: 'APPROVE' | 'REJECT' | 'HOLD' | 'ESCALATE' | 'REVERSE' | 'RESOLVE_FAVOR_RECEIVER', tx: any) => {
        setConfirmModal({
            show: true,
            action,
            txId: tx._id,
            userName: tx.userId?.username || 'System',
            amount: tx.amount.toLocaleString(),
            currency: tx.currency,
            type: tx.type
        });
        setActionReason('');
    };

    const processAction = async () => {
        if (!confirmModal) return;
        const { action, txId } = confirmModal;

        if (['REJECT', 'HOLD', 'ESCALATE', 'REVERSE', 'RESOLVE_FAVOR_RECEIVER'].includes(action) && !actionReason.trim()) {
            alert('A reason is required to process this operation.');
            return;
        }

        try {
            setProcessingId(txId);
            let res;
            if (selectedTx && (selectedTx.type === 'TRANSFER_SEND' || selectedTx.type === 'TRANSFER_RECEIVE')) {
                res = await adminService.submitTransactionAction(txId, action as any, actionReason);
            } else {
                res = await adminService.submitWithdrawalAction(txId, action as any, { reason: actionReason });
            }
            alert(res.message || 'Operation successful');
            
            // Clean state & reload
            setConfirmModal(null);
            if (selectedTx && selectedTx._id === txId) {
                setSelectedTx(null);
            }
            fetchCoreMetrics();
            fetchLedger();
        } catch (err: any) {
            alert(err.message || 'Operation failed.');
        } finally {
            setProcessingId(null);
        }
    };

    const handleRateOverride = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const data = {
                baseCurrency: ratePairForm.baseCurrency,
                quoteCurrency: ratePairForm.quoteCurrency,
                rate: Number(ratePairForm.rate)
            };
            if (isNaN(data.rate) || data.rate <= 0) {
                alert('Please enter a valid numeric exchange rate.');
                return;
            }
            await adminService.overrideRatePair(data);
            alert('Rate pair overridden successfully.');
            setShowRateModal(false);
            fetchCoreMetrics();
        } catch (err: any) {
            alert(err.message || 'Failed to override exchange rate.');
        }
    };

    const handleReportExport = () => {
        const url = adminService.getFinanceExportUrl(exportForm);
        window.open(url, '_blank');
        setShowExportModal(false);
    };

    // Calculate dynamic coordinates for chart plotting
    const renderChart = () => {
        if (!metrics || !metrics.charts) return <div className="h-full flex items-center justify-center text-slate-500">No chart data found</div>;

        const dataPoints: number[] = metrics.charts[activeChartMetric] || [];
        const labels: string[] = metrics.charts.labels || [];
        
        if (dataPoints.length === 0) return <div className="h-full flex items-center justify-center text-slate-500 font-bold uppercase tracking-wider text-xs">No entries for timeframe</div>;

        const width = 800;
        const height = 240;
        const padding = 20;

        const maxVal = Math.max(...dataPoints, 1);
        const minVal = Math.min(...dataPoints, 0);
        const range = maxVal - minVal;

        const points = dataPoints.map((val, i) => {
            const x = padding + (i / (dataPoints.length - 1)) * (width - padding * 2);
            const y = height - padding - ((val - minVal) / range) * (height - padding * 2);
            return { x, y, value: val, label: labels[i] };
        });

        const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
        const areaPath = points.length > 0 
            ? `${linePath} L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z` 
            : '';

        const strokeColor = activeChartMetric === 'withdrawals' ? '#FF6B00' : (activeChartMetric === 'revenue' ? '#10B981' : '#FF6B00');
        const fillGradient = activeChartMetric === 'withdrawals' ? 'url(#orangeGlow)' : (activeChartMetric === 'revenue' ? 'url(#greenGlow)' : 'url(#orangeGlow)');

        return (
            <div className="w-full space-y-4">
                <svg className="w-full h-64 overflow-visible" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
                    <defs>
                        <linearGradient id="orangeGlow" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#FF6B00" stopOpacity="0.3"/>
                            <stop offset="100%" stopColor="#FF6B00" stopOpacity="0.0"/>
                        </linearGradient>
                        <linearGradient id="greenGlow" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#10B981" stopOpacity="0.3"/>
                            <stop offset="100%" stopColor="#10B981" stopOpacity="0.0"/>
                        </linearGradient>
                    </defs>
                    
                    {/* Gridlines */}
                    <line x1={padding} y1={padding} x2={width - padding} y2={padding} stroke="#1E2533" strokeDasharray="3,3"/>
                    <line x1={padding} y1={height / 2} x2={width - padding} y2={height / 2} stroke="#1E2533" strokeDasharray="3,3"/>
                    <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#1E2533" strokeDasharray="3,3"/>

                    {/* Area path */}
                    {areaPath && <path d={areaPath} fill={fillGradient} />}

                    {/* Line path */}
                    {linePath && <path d={linePath} fill="none" stroke={strokeColor} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>}

                    {/* Interactive dots */}
                    {points.map((p, i) => (
                        <g key={i} className="group/dot cursor-pointer">
                            <circle cx={p.x} cy={p.y} r="5" fill="#0D1017" stroke={strokeColor} strokeWidth="2"/>
                            <circle cx={p.x} cy={p.y} r="8" fill={strokeColor} opacity="0" className="hover:opacity-30 transition-opacity" />
                            
                            {/* Hover label */}
                            <foreignObject x={p.x - 50} y={p.y - 45} width="100" height="38" className="pointer-events-none opacity-0 group-hover/dot:opacity-100 transition-opacity duration-200">
                                <div className="bg-[#07090E] border border-[#1E2533] rounded px-2 py-1 text-center shadow-lg">
                                    <p className="text-[8px] font-sans text-slate-500 uppercase tracking-widest leading-none mb-0.5">{p.label}</p>
                                    <p className="text-[10px] font-mono font-bold text-white leading-none">{p.value.toLocaleString()}</p>
                                </div>
                            </foreignObject>
                        </g>
                    ))}
                </svg>
                
                {/* SVG Chart X-axis Labels */}
                <div className="flex justify-between items-center text-[9px] font-bold text-slate-500 uppercase tracking-widest font-mono pt-2 border-t border-[#1E2533] px-2.5">
                    {points.map((p, idx) => (
                        <span key={idx} style={{ position: 'relative', left: `${(idx / (points.length - 1)) * 2}%` }}>
                            {p.label}
                        </span>
                    ))}
                </div>
            </div>
        );
    };

    // Filter dynamic counts for highlighted security issues
    const flaggedTransactions = transactions.filter(t => t.isFlagged);

    return (
        <div className="space-y-8 animate-in fade-in duration-500 text-slate-100 font-sans max-w-[1600px] mx-auto pb-20">
            {/* Header Desk */}
            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 border-b border-[#1E2533] pb-6">
                <div>
                    <h2 className="text-3xl font-black text-white tracking-tight uppercase">Financial Command Center</h2>
                    <p className="text-slate-400 mt-1 text-xs font-semibold uppercase tracking-widest">Enterprise liquidity logs, treasury calculations, and payouts supervision.</p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    <button 
                        onClick={() => setShowExportModal(true)}
                        className="flex items-center gap-2 px-4 py-2.5 bg-[#0D1017] hover:bg-white/[0.02] text-white font-bold text-xs uppercase tracking-wider rounded-xl border border-[#1E2533] transition-all shadow-sm"
                    >
                        <Download size={14} />
                        Export Console
                    </button>
                    <button 
                        onClick={() => setShowRateModal(true)}
                        className="flex items-center gap-2 px-4 py-2.5 bg-[#0D1017] hover:bg-white/[0.02] text-white font-bold text-xs uppercase tracking-wider rounded-xl border border-[#1E2533] transition-all shadow-sm"
                    >
                        <Layers size={14} />
                        Rates Overrides
                    </button>
                    <button 
                        onClick={fetchCoreMetrics}
                        className="flex items-center gap-2 px-6 py-2.5 bg-[#FF6B00] hover:bg-[#E05E00] text-white font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-[#FF6B00]/20"
                    >
                        <RefreshCcw size={14} />
                        Refresh
                    </button>
                </div>
            </div>

            {/* Suspicious Activities Flag Banner */}
            {flaggedTransactions.length > 0 && (
                <div className="bg-rose-500/10 border border-rose-500/20 rounded-3xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 animate-pulse">
                    <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-xl bg-rose-500/15 border border-rose-500/20 flex items-center justify-center text-rose-400 shrink-0 shadow-inner">
                            <ShieldAlert size={18} />
                        </div>
                        <div>
                            <h4 className="text-sm font-black text-white uppercase tracking-wider">Compliance Risk Alert</h4>
                            <p className="text-xs text-rose-400/90 mt-1 font-medium">The automated fraud engine has auto-flagged {flaggedTransactions.length} transaction(s) matching velocity, volume, or duplicate signature patterns.</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button 
                            onClick={() => setFilters(prev => ({ ...prev, status: '', type: '', page: 1 }))}
                            className="px-4 py-2 bg-rose-600/10 hover:bg-rose-600/20 text-rose-400 border border-rose-500/20 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all"
                        >
                            Inspect compliance queue
                        </button>
                    </div>
                </div>
            )}

            {/* Executive KPIs Ribbon */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <KpiTile 
                    label="Aggregate Deposits"
                    value={`KES ${Math.round(metrics?.overview?.totalDepositsKES || 0).toLocaleString()}`}
                    subtext="Consolidated cash inflow"
                    icon={<ArrowDownRight size={16} className="text-emerald-400" />}
                />
                <KpiTile 
                    label="Aggregate Withdrawals"
                    value={`KES ${Math.round(metrics?.overview?.totalWithdrawalsKES || 0).toLocaleString()}`}
                    subtext="Consolidated cash outflow"
                    icon={<ArrowUpRight size={16} className="text-[#FF6B00]" />}
                />
                <KpiTile 
                    label="Estimated Gross Revenue"
                    value={`KES ${Math.round(metrics?.overview?.platformRevenue || 0).toLocaleString()}`}
                    subtext="Accumulated system fees"
                    icon={<TrendingUp size={16} className="text-amber-400" />}
                />
                <KpiTile 
                    label="Active User Wallet Balance"
                    value={`KES ${Math.round(metrics?.overview?.activeWalletBalance || 0).toLocaleString()}`}
                    subtext="Liability backing total"
                    icon={<Wallet size={16} className="text-blue-400" />}
                />
            </div>

            {/* Treasury & Charts Panel Split */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                {/* Left: Interactive Graph Widget */}
                <div className="xl:col-span-2 bg-[#0D1017]/80 border border-[#1E2533] rounded-3xl p-6 md:p-8 backdrop-blur-md shadow-2xl flex flex-col justify-between">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                        {/* Selector Tabs */}
                        <div className="flex flex-wrap items-center gap-2 border-b border-[#1E2533]/40 pb-2 sm:pb-0">
                            {[
                                { key: 'deposits', label: 'Deposits' },
                                { key: 'withdrawals', label: 'Withdrawals' },
                                { key: 'revenue', label: 'Revenue' },
                                { key: 'activity', label: 'Active Users' },
                                { key: 'cashflow', label: 'Cash Flow' }
                            ].map(item => (
                                <button
                                    key={item.key}
                                    onClick={() => setActiveChartMetric(item.key as any)}
                                    className={`text-[10px] font-black uppercase tracking-wider pb-2 px-1 transition-all border-b-2 ${activeChartMetric === item.key ? 'border-[#FF6B00] text-white' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
                                >
                                    {item.label}
                                </button>
                            ))}
                        </div>

                        {/* Chart Timeframe controls */}
                        <div className="flex bg-[#07090E] border border-[#1E2533] rounded-xl p-0.5 shadow-inner shrink-0">
                            {['daily', 'weekly', 'monthly', 'yearly'].map(t => (
                                <button
                                    key={t}
                                    onClick={() => setChartTimeframe(t as any)}
                                    className={`px-3 py-1.5 text-[9px] font-black uppercase tracking-wider rounded-lg transition-all ${chartTimeframe === t ? 'bg-[#FF6B00] text-white' : 'text-slate-500 hover:text-slate-300'}`}
                                >
                                    {t}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex-1 relative flex items-center justify-center min-h-[220px]">
                        {loading ? (
                            <Loader2 className="animate-spin text-[#FF6B00]" size={32} />
                        ) : (
                            renderChart()
                        )}
                    </div>
                </div>

                {/* Right: Treasury Details & Forecast card */}
                <div className="bg-[#0D1017]/80 border border-[#1E2533] rounded-3xl p-6 backdrop-blur-md shadow-2xl flex flex-col justify-between">
                    <div>
                        <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-6 flex items-center gap-2">
                            <Briefcase size={14} className="text-[#FF6B00]" />
                            Treasury Ledger Details
                        </h3>
                        
                        <div className="space-y-4 font-mono text-xs mb-8">
                            <TreasuryRow label="Available Cash Liquidity" value={`KES ${Math.round(metrics?.treasury?.availableLiquidity || 0).toLocaleString()}`} highlight />
                            <TreasuryRow label="Payout Reserve Obligations" value={`KES ${Math.round(metrics?.treasury?.reservedFunds || 0).toLocaleString()}`} />
                            <TreasuryRow label="In-flight Settlements" value={`KES ${Math.round(metrics?.treasury?.pendingSettlements || 0).toLocaleString()}`} />
                            <TreasuryRow label="KES Fees Volume" value={`KES ${Math.round(metrics?.treasury?.revenueBreakdown?.kesFees || 0).toLocaleString()}`} sub />
                            <TreasuryRow label="USDT Fees Volume" value={`KES ${Math.round(metrics?.treasury?.revenueBreakdown?.usdtFees || 0).toLocaleString()}`} sub />
                        </div>
                    </div>

                    <div className="border-t border-[#1E2533] pt-6 bg-gradient-to-t from-white/[0.01] to-transparent rounded-b-3xl">
                        <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">7-Day Cash Flow Forecast</h4>
                        <div className="space-y-2.5 font-mono text-[11px]">
                            <div className="flex justify-between py-1">
                                <span className="text-slate-500 font-sans">Projected Cash Inflow</span>
                                <span className="text-emerald-400 font-bold">KES {Math.round(metrics?.treasury?.cashFlowForecast?.projectedInflow || 0).toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between py-1">
                                <span className="text-slate-500 font-sans">Projected Cash Outflow</span>
                                <span className="text-[#FF6B00] font-bold">KES {Math.round(metrics?.treasury?.cashFlowForecast?.projectedOutflow || 0).toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between py-1 border-t border-[#1E2533]/60 pt-2 font-bold text-xs">
                                <span className="text-slate-300 font-sans">Net Cash Projection</span>
                                <span className={metrics?.treasury?.cashFlowForecast?.netProjection >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                                    KES {Math.round(metrics?.treasury?.cashFlowForecast?.netProjection || 0).toLocaleString()}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Payout Desk & Rate Configurations split */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                {/* Left: Withdrawal Approval Queue */}
                <div className="bg-[#0D1017]/80 border border-[#1E2533] rounded-3xl p-6 backdrop-blur-md shadow-2xl flex flex-col min-h-[480px]">
                    <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-6 flex items-center justify-between">
                        Payout Approvals Queue
                        <span className="text-[9px] bg-[#FF6B00] text-white px-2.5 py-0.5 rounded-full font-black tracking-widest">{withdrawals.length} Active</span>
                    </h3>

                    <div className="flex-1 overflow-y-auto pr-1.5 custom-scrollbar space-y-4 max-h-[400px]">
                        {withdrawals.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-center py-20">
                                <CheckCircle2 className="text-slate-700 mb-2" size={32} />
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Queue is clear</p>
                            </div>
                        ) : withdrawals.map(w => (
                            <div key={w._id} className="p-4 bg-[#07090E]/40 border border-[#1E2533] rounded-2xl space-y-3 hover:border-[#FF6B00]/20 transition-all duration-300">
                                <div className="flex justify-between items-start">
                                    <div className="text-left">
                                        <h4 className="text-xs font-bold text-white capitalize leading-none">{w.userId?.username || 'Unknown'}</h4>
                                        <p className="text-[9px] text-slate-500 font-bold mt-1.5 font-mono">{new Date(w.createdAt).toLocaleString()}</p>
                                    </div>
                                    <span className="text-xs font-black text-[#FF6B00] font-mono">{w.currency} {w.amount.toLocaleString()}</span>
                                </div>
                                <div className="space-y-1.5 font-mono text-[10px] text-slate-400 bg-[#07090E]/50 p-2.5 rounded-xl border border-white/[0.02]">
                                    <div className="flex justify-between">
                                        <span className="text-slate-600 font-sans">Payout Type</span>
                                        <span className="font-bold">{w.phoneNumber ? 'MPESA' : 'CRYPTO'}</span>
                                    </div>
                                    {w.phoneNumber && (
                                        <div className="flex justify-between">
                                            <span className="text-slate-600 font-sans">Phone Number</span>
                                            <span className="font-bold">{w.phoneNumber}</span>
                                        </div>
                                    )}
                                    {w.toAddress && (
                                        <div className="flex flex-col gap-1 pt-1 border-t border-white/[0.02]">
                                            <span className="text-slate-600 font-sans">Destination Address</span>
                                            <span className="text-[9px] break-all select-all text-slate-400 font-bold">{w.toAddress}</span>
                                        </div>
                                    )}
                                </div>
                                <div className="flex gap-2">
                                    <button 
                                        onClick={() => triggerConfirmModal('APPROVE', w)}
                                        className="flex-1 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-[9px] font-black uppercase tracking-widest border border-emerald-500/20 rounded-lg transition-all"
                                    >
                                        Approve
                                    </button>
                                    <button 
                                        onClick={() => triggerConfirmModal('REJECT', w)}
                                        className="flex-1 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-[9px] font-black uppercase tracking-widest border border-rose-500/20 rounded-lg transition-all"
                                    >
                                        Reject
                                    </button>
                                    <button 
                                        onClick={() => triggerConfirmModal('HOLD', w)}
                                        className="flex-1 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 text-[9px] font-black uppercase tracking-widest border border-amber-500/20 rounded-lg transition-all"
                                    >
                                        Hold
                                    </button>
                                    <button 
                                        onClick={() => triggerConfirmModal('ESCALATE', w)}
                                        className="flex-1 py-1.5 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 text-[9px] font-black uppercase tracking-widest border border-purple-500/20 rounded-lg transition-all"
                                    >
                                        Escalate
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right: Exchange Rate Overrides */}
                <div className="xl:col-span-2 bg-[#0D1017]/80 border border-[#1E2533] rounded-3xl p-6 backdrop-blur-md shadow-2xl flex flex-col justify-between">
                    <div>
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                <Layers size={14} className="text-[#FF6B00]" />
                                Active Exchange Rates
                            </h3>
                            <button 
                                onClick={() => setShowRateModal(true)}
                                className="px-3 py-1.5 bg-white text-[#07090E] hover:bg-slate-200 text-[9px] font-black rounded-lg transition-all uppercase tracking-widest shadow-sm"
                            >
                                Overrides override
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                            {rates.map(rate => (
                                <div key={rate._id} className="flex items-center justify-between p-4 bg-[#07090E]/50 rounded-2xl border border-[#1E2533] font-mono">
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center font-bold text-xs uppercase">
                                            {rate.quoteCurrency}
                                        </div>
                                        <div>
                                            <span className="text-[11px] font-bold text-slate-300">1 {rate.quoteCurrency}</span>
                                            <p className="text-[9px] text-slate-500 font-sans font-bold capitalize mt-0.5">Source: {rate.source}</p>
                                        </div>
                                    </div>
                                    <span className="text-xs text-slate-500 font-bold">=</span>
                                    <div className="text-right">
                                        <span className="text-sm font-black text-white">{rate.rate}</span>
                                        <span className="text-[10px] text-slate-500 font-black uppercase tracking-wider ml-1">{rate.baseCurrency}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="border-t border-[#1E2533] pt-6">
                        <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Rates Audit History</h4>
                        <div className="space-y-2.5 max-h-[160px] overflow-y-auto pr-1.5 custom-scrollbar font-mono text-[10px]">
                            {rateHistory.length === 0 ? (
                                <p className="text-slate-600 text-center py-6 font-sans">No rate modifications logged</p>
                            ) : rateHistory.map((h, i) => (
                                <div key={i} className="flex justify-between py-2 border-b border-white/[0.02]">
                                    <div>
                                        <span className="text-slate-300 font-bold uppercase">{h.type.replace('_', ' ')}</span>
                                        <p className="text-[8px] text-slate-500 mt-0.5">By: {h.changedBy?.username || 'Admin'} • {new Date(h.timestamp).toLocaleDateString()}</p>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-slate-300 font-bold">{h.after?.rate || h.before?.rate || 'N/A'}</span>
                                        <p className="text-[8px] text-slate-500 mt-0.5">{h.after?.quoteCurrency} ↔ {h.after?.baseCurrency}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Advanced Transactions Ledger Grid */}
            <div className="bg-[#0D1017]/80 border border-[#1E2533] rounded-3xl overflow-hidden shadow-2xl flex flex-col min-h-[500px]">
                {/* Search Header Panel */}
                <div className="p-6 border-b border-[#1E2533] flex flex-col gap-4 bg-gradient-to-r from-white/[0.005] to-transparent">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <h3 className="text-base font-bold text-white uppercase tracking-wider">Transaction Ledger Book</h3>
                        <div className="flex items-center gap-2">
                            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">
                                Loaded: {transactions.length} entries
                            </span>
                        </div>
                    </div>

                    {/* Filter fields */}
                    <div className="grid grid-cols-2 md:grid-cols-6 gap-3 pt-2">
                        <div className="relative col-span-2">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
                            <input 
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search by TxID, Username, Email, Address..."
                                className="w-full pl-9 pr-4 py-2.5 bg-[#07090E] border border-[#1E2533] rounded-xl text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-[#FF6B00]"
                            />
                        </div>
                        
                        <select 
                            value={filters.type}
                            onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value, page: 1 }))}
                            className="bg-[#07090E] border border-[#1E2533] text-slate-300 rounded-xl px-3 py-2.5 text-xs font-bold uppercase tracking-wider outline-none focus:border-[#FF6B00] cursor-pointer"
                        >
                            <option value="">All Types</option>
                            <option value="DEPOSIT">Deposit</option>
                            <option value="WITHDRAW">Withdraw</option>
                            <option value="TRANSFER_SEND">Transfer</option>
                            <option value="CONVERT">Convert</option>
                        </select>

                        <select 
                            value={filters.status}
                            onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value, page: 1 }))}
                            className="bg-[#07090E] border border-[#1E2533] text-slate-300 rounded-xl px-3 py-2.5 text-xs font-bold uppercase tracking-wider outline-none focus:border-[#FF6B00] cursor-pointer"
                        >
                            <option value="">All Statuses</option>
                            <option value="SUCCESS">Success</option>
                            <option value="PENDING">Pending</option>
                            <option value="FAILED">Failed</option>
                            <option value="HOLD">Hold</option>
                            <option value="ESCALATED">Escalated</option>
                            <option value="REVERSED">Reversed</option>
                        </select>

                        <select 
                            value={filters.currency}
                            onChange={(e) => setFilters(prev => ({ ...prev, currency: e.target.value, page: 1 }))}
                            className="bg-[#07090E] border border-[#1E2533] text-slate-300 rounded-xl px-3 py-2.5 text-xs font-bold uppercase tracking-wider outline-none focus:border-[#FF6B00] cursor-pointer"
                        >
                            <option value="">All Currencies</option>
                            <option value="KES">KES</option>
                            <option value="USDT">USDT</option>
                        </select>

                        <div className="flex gap-2">
                            <input 
                                type="date"
                                value={filters.from}
                                onChange={(e) => setFilters(prev => ({ ...prev, from: e.target.value, page: 1 }))}
                                className="bg-[#07090E] border border-[#1E2533] text-slate-500 focus:text-white rounded-xl px-3 py-2.5 text-xs outline-none focus:border-[#FF6B00] w-full"
                            />
                        </div>
                    </div>
                </div>

                {/* Table Data list */}
                <div className="overflow-x-auto flex-1 font-sans">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-white/[0.01] text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-[#1E2533]">
                                <th className="px-6 py-4">Transaction details</th>
                                <th className="px-6 py-4">Account Owner</th>
                                <th className="px-6 py-4">Currency amount</th>
                                <th className="px-6 py-4">Fee / Net Amount</th>
                                <th className="px-6 py-4">Verification status</th>
                                <th className="px-6 py-4"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#1E2533]">
                            {txLoading ? (
                                <tr>
                                    <td colSpan={6} className="py-28 text-center">
                                        <Loader2 className="animate-spin text-[#FF6B00] mx-auto" size={32} />
                                    </td>
                                </tr>
                            ) : transactions.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="py-28 text-center text-slate-500 text-xs font-black uppercase tracking-widest">
                                        No ledger records matched selection
                                    </td>
                                </tr>
                            ) : transactions.map(tx => (
                                <tr key={tx._id} className={`group hover:bg-white/[0.01] transition-all duration-300 font-sans ${tx.isFlagged ? 'bg-rose-500/[0.02]' : ''}`}>
                                    <td className="px-6 py-4.5">
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-xl bg-[#07090E] border border-[#1E2533] flex items-center justify-center shadow-inner shrink-0">
                                                {tx.type === 'DEPOSIT' ? <ArrowDownRight className="text-emerald-400" size={14} /> :
                                                 tx.type === 'WITHDRAW' ? <ArrowUpRight className="text-[#FF6B00]" size={14} /> :
                                                 <RefreshCcw className="text-slate-400" size={14} />}
                                            </div>
                                            <div>
                                                <p className="text-xs font-bold text-white font-mono">{tx._id.slice(-10)}</p>
                                                <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wide mt-1">{new Date(tx.createdAt).toLocaleString()}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4.5">
                                        <div className="text-xs font-bold text-slate-300 capitalize">
                                            {tx.userId?.username || 'System'}
                                            <p className="text-[9px] text-slate-500 font-normal lowercase font-mono mt-0.5">{tx.userId?.email}</p>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4.5 font-mono text-xs font-bold text-white">
                                        {tx.currency} {tx.amount.toLocaleString()}
                                    </td>
                                    <td className="px-6 py-4.5 font-mono text-xs">
                                        <span className="text-slate-400">{tx.currency} {tx.fee || 0}</span>
                                        <p className="text-[10px] text-slate-500 mt-0.5">Net: {tx.currency} {tx.netAmount || tx.amount}</p>
                                    </td>
                                    <td className="px-6 py-4.5">
                                        <div className="flex items-center gap-2">
                                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest border
                                                ${tx.status === 'SUCCESS' ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' :
                                                  tx.status === 'PENDING' ? 'text-amber-400 bg-amber-500/10 border-amber-500/20' :
                                                  tx.status === 'HOLD' ? 'text-rose-400 bg-rose-500/10 border-rose-500/20' :
                                                  tx.status === 'ESCALATED' ? 'text-purple-400 bg-purple-500/10 border-purple-500/20' :
                                                  tx.status === 'REVERSED' ? 'text-blue-400 bg-blue-500/10 border-blue-500/20' :
                                                  'text-slate-400 bg-slate-500/10 border-slate-500/20'}
                                            `}>
                                                {tx.status}
                                            </span>
                                            {tx.isFlagged && (
                                                <span className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-pulse shadow-[0_0_6px_rgba(244,63,94,0.5)]" title={tx.flagReason} />
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4.5 text-right">
                                        <button 
                                            onClick={() => setSelectedTx(tx)}
                                            className="px-3 py-1.5 bg-[#0D1017] hover:bg-white/[0.04] text-slate-400 hover:text-white border border-[#1E2533] text-[9px] font-black uppercase tracking-widest rounded-lg transition-all"
                                        >
                                            View Audit
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* MODAL: Audit Trail Details slider drawer */}
            {selectedTx && (
                <div className="fixed inset-0 z-50 flex justify-end animate-in fade-in duration-300 font-sans">
                    <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={() => setSelectedTx(null)} />
                    <div className="relative w-full max-w-xl bg-[#0D1017] shadow-2xl border-l border-[#1E2533] flex flex-col h-full animate-in slide-in-from-right duration-500 text-slate-100">
                        <div className="p-6 border-b border-[#1E2533] flex items-center justify-between">
                            <div>
                                <h3 className="text-base font-bold text-white uppercase tracking-wider">Audit Investigation Desk</h3>
                                <p className="text-[10px] text-slate-500 font-mono mt-1">TxID: {selectedTx._id}</p>
                            </div>
                            <button onClick={() => setSelectedTx(null)} className="p-2 text-slate-500 hover:text-white transition-colors text-xl font-bold">&times;</button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar text-xs">
                            {/* Security / Compliance Alert Alert */}
                            {selectedTx.isFlagged && (
                                <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl space-y-1">
                                    <div className="flex items-center gap-2 text-rose-400 font-black text-[10px] uppercase tracking-wider">
                                        <ShieldAlert size={14} /> Security Alert Block
                                    </div>
                                    <p className="text-rose-300 font-medium">{selectedTx.flagReason}</p>
                                </div>
                            )}

                            {/* Aggregated details grid */}
                            <div className="grid grid-cols-2 gap-4 bg-[#07090E]/60 p-4.5 rounded-2xl border border-white/[0.02] font-mono">
                                <div>
                                    <span className="text-[8px] font-sans text-slate-500 uppercase tracking-widest block mb-1">Status Code</span>
                                    <span className="text-white font-bold">{selectedTx.status}</span>
                                </div>
                                <div>
                                    <span className="text-[8px] font-sans text-slate-500 uppercase tracking-widest block mb-1">Creation Date</span>
                                    <span className="text-white font-bold">{new Date(selectedTx.createdAt).toLocaleString()}</span>
                                </div>
                                <div>
                                    <span className="text-[8px] font-sans text-slate-500 uppercase tracking-widest block mb-1">Value Transacted</span>
                                    <span className="text-[#FF6B00] font-black">{selectedTx.currency} {selectedTx.amount.toLocaleString()}</span>
                                </div>
                                <div>
                                    <span className="text-[8px] font-sans text-slate-500 uppercase tracking-widest block mb-1">Category Type</span>
                                    <span className="text-white font-bold uppercase">{selectedTx.type}</span>
                                </div>
                            </div>

                            {/* Tech logs info */}
                            <div className="space-y-3 font-mono">
                                <h4 className="text-[9px] font-sans font-black text-slate-500 uppercase tracking-widest">Metadata Processing Logs</h4>
                                <div className="bg-[#07090E] p-4 rounded-xl border border-white/5 space-y-2">
                                    <div className="flex justify-between">
                                        <span className="text-slate-500">Client Holder:</span>
                                        <span className="text-slate-300 capitalize font-sans font-bold">@{selectedTx.userId?.username || 'System'}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-500">Client Email:</span>
                                        <span className="text-slate-300 lowercase">{selectedTx.userId?.email || 'N/A'}</span>
                                    </div>
                                    {selectedTx.mpesaReceiptNumber && (
                                        <div className="flex justify-between">
                                            <span className="text-slate-500">M-Pesa Reference:</span>
                                            <span className="text-emerald-400 font-bold">{selectedTx.mpesaReceiptNumber}</span>
                                        </div>
                                    )}
                                    {selectedTx.phoneNumber && (
                                        <div className="flex justify-between">
                                            <span className="text-slate-500">Phone Reference:</span>
                                            <span className="text-slate-300">{selectedTx.phoneNumber}</span>
                                        </div>
                                    )}
                                    {selectedTx.toAddress && (
                                        <div className="flex flex-col gap-1 border-t border-white/[0.02] pt-2 mt-1">
                                            <span className="text-slate-500">Crypto Wallet Destination:</span>
                                            <span className="text-[9px] text-slate-400 break-all select-all font-bold">{selectedTx.toAddress}</span>
                                        </div>
                                    )}
                                    {selectedTx.rejectionReason && (
                                        <div className="flex flex-col gap-1 border-t border-rose-500/10 pt-2 mt-1">
                                            <span className="text-rose-400">Processing Logs Note:</span>
                                            <span className="text-slate-300 font-sans font-medium">{selectedTx.rejectionReason}</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Timeline audit trail logs */}
                            <div className="space-y-4">
                                <h4 className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Audit Event Timeline</h4>
                                <div className="relative border-l border-[#1E2533] ml-3 pl-4 space-y-4">
                                    <div className="relative">
                                        <span className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-4 ring-[#0D1017]" />
                                        <p className="font-bold text-slate-300 font-mono text-[10px]">{new Date(selectedTx.createdAt).toLocaleString()}</p>
                                        <p className="text-slate-500 font-medium mt-0.5">Transaction parsing completed. Balance allocation queued.</p>
                                    </div>
                                    
                                    {selectedTx.processedAt && (
                                        <div className="relative">
                                            <span className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-blue-500 ring-4 ring-[#0D1017]" />
                                            <p className="font-bold text-slate-300 font-mono text-[10px]">{new Date(selectedTx.processedAt).toLocaleString()}</p>
                                            <p className="text-slate-500 font-medium mt-0.5">Administrative decision processed as status: <span className="font-bold text-white">{selectedTx.status}</span></p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Audit operations desk (Rollback option for successful withdrawals) */}
                        <div className="p-6 border-t border-[#1E2533] bg-[#07090E] flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                                {selectedTx.type === 'WITHDRAW' && selectedTx.status === 'SUCCESS' ? (
                                    <button 
                                        onClick={() => triggerConfirmModal('REVERSE', selectedTx)}
                                        className="px-5 py-2.5 bg-rose-600/10 hover:bg-rose-600/20 text-rose-400 border border-rose-500/20 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all"
                                    >
                                        Reverse transaction
                                    </button>
                                ) : (selectedTx.type === 'TRANSFER_SEND' || selectedTx.type === 'TRANSFER_RECEIVE') && selectedTx.status === 'SUCCESS' ? (
                                    <div className="flex gap-2">
                                        <button 
                                            onClick={() => triggerConfirmModal('HOLD', selectedTx)}
                                            className="px-5 py-2.5 bg-[#FF6B00]/10 hover:bg-[#FF6B00]/20 text-[#FF6B00] border border-[#FF6B00]/20 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all"
                                        >
                                            Place on hold
                                        </button>
                                        <button 
                                            onClick={() => triggerConfirmModal('REVERSE', selectedTx)}
                                            className="px-5 py-2.5 bg-rose-600/10 hover:bg-rose-600/20 text-rose-400 border border-rose-500/20 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all"
                                        >
                                            Reverse transfer
                                        </button>
                                    </div>
                                ) : (selectedTx.type === 'TRANSFER_SEND' || selectedTx.type === 'TRANSFER_RECEIVE') && selectedTx.status === 'HOLD' ? (
                                    <div className="flex gap-2">
                                        <button 
                                            onClick={() => triggerConfirmModal('RESOLVE_FAVOR_RECEIVER', selectedTx)}
                                            className="px-5 py-2.5 bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-400 border border-emerald-500/20 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all"
                                        >
                                            Favour Receiver
                                        </button>
                                        <button 
                                            onClick={() => triggerConfirmModal('REVERSE', selectedTx)}
                                            className="px-5 py-2.5 bg-rose-600/10 hover:bg-rose-600/20 text-rose-400 border border-rose-500/20 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all"
                                        >
                                            Reverse transfer
                                        </button>
                                    </div>
                                ) : (
                                    <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest">No action required</span>
                                )}
                            </div>
                            <button 
                                onClick={() => setSelectedTx(null)}
                                className="px-5 py-2.5 bg-white text-[#07090E] hover:bg-slate-200 text-[10px] font-black rounded-xl transition-all uppercase tracking-widest"
                            >
                                Close drawer
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL: Confirmation overlay for withdrawal operations */}
            {confirmModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
                    <div className="bg-[#0D1017] border border-[#1E2533] rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 text-slate-100">
                        <div className="p-6 border-b border-[#1E2533] flex items-center justify-between">
                            <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                                <AlertTriangle className="text-amber-500" size={16} />
                                Security Supervisor Authorization
                            </h3>
                            <button onClick={() => setConfirmModal(null)} className="text-slate-500 hover:text-white text-xl font-bold">&times;</button>
                        </div>
                        
                        <div className="p-6 space-y-4">
                            <p className="text-xs text-slate-400 font-medium">
                                You are requesting to trigger action <span className="font-black text-[#FF6B00]">{confirmModal.action.replace(/_/g, ' ')}</span> for user <span className="font-bold text-white">@{confirmModal.userName}</span> {confirmModal.type?.includes('TRANSFER') ? 'P2P transfer:' : 'withdrawal payout:'}
                            </p>

                            <div className="p-4 bg-[#07090E] rounded-2xl border border-white/[0.02] font-mono text-center space-y-1">
                                <span className="text-[9px] text-slate-500 font-sans uppercase tracking-widest block">Authorized Amount</span>
                                <span className="text-xl font-black text-white">{confirmModal.currency} {confirmModal.amount}</span>
                            </div>

                            {/* Prompt for reason */}
                            {['REJECT', 'HOLD', 'ESCALATE', 'REVERSE', 'RESOLVE_FAVOR_RECEIVER'].includes(confirmModal.action) && (
                                <div className="space-y-1.5">
                                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Operation Reason (Required)</label>
                                    <textarea 
                                        value={actionReason}
                                        onChange={(e) => setActionReason(e.target.value)}
                                        placeholder="Write reasons details..."
                                        className="w-full h-20 p-3 bg-[#07090E] border border-[#1E2533] rounded-xl text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-[#FF6B00] resize-none"
                                    />
                                </div>
                            )}
                        </div>

                        <div className="p-6 border-t border-[#1E2533] bg-[#07090E]/60 flex gap-2 justify-end">
                            <button 
                                onClick={() => setConfirmModal(null)}
                                className="px-4 py-2 bg-[#0D1017] hover:bg-white/[0.02] text-slate-400 border border-[#1E2533] text-[9px] font-black uppercase tracking-widest rounded-lg transition-all"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={processAction}
                                disabled={processingId !== null}
                                className="px-5 py-2 bg-[#FF6B00] hover:bg-[#E05E00] text-white text-[9px] font-black uppercase tracking-widest rounded-lg transition-all shadow-md shadow-[#FF6B00]/15 flex items-center gap-1"
                            >
                                {processingId ? <Loader2 className="animate-spin" size={10} /> : null}
                                Confirm action
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL: Manual Exchange Rates Editor */}
            {showRateModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
                    <div className="bg-[#0D1017] border border-[#1E2533] rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 text-slate-100">
                        <div className="p-6 border-b border-[#1E2533] flex items-center justify-between">
                            <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                                <Layers size={14} className="text-[#FF6B00]" />
                                Override Exchange Pairs
                            </h3>
                            <button onClick={() => setShowRateModal(false)} className="text-slate-500 hover:text-white text-xl font-bold">&times;</button>
                        </div>

                        <form onSubmit={handleRateOverride}>
                            <div className="p-6 space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Base Currency</label>
                                        <select 
                                            value={ratePairForm.baseCurrency}
                                            onChange={(e) => setRatePairForm(prev => ({ ...prev, baseCurrency: e.target.value }))}
                                            className="w-full bg-[#07090E] border border-[#1E2533] text-slate-300 rounded-xl px-3 py-2.5 text-xs font-bold uppercase tracking-wider outline-none focus:border-[#FF6B00] cursor-pointer"
                                        >
                                            <option value="KES">KES</option>
                                            <option value="USDT">USDT</option>
                                        </select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Quote Currency</label>
                                        <select 
                                            value={ratePairForm.quoteCurrency}
                                            onChange={(e) => setRatePairForm(prev => ({ ...prev, quoteCurrency: e.target.value }))}
                                            className="w-full bg-[#07090E] border border-[#1E2533] text-slate-300 rounded-xl px-3 py-2.5 text-xs font-bold uppercase tracking-wider outline-none focus:border-[#FF6B00] cursor-pointer"
                                        >
                                            <option value="KES">KES</option>
                                            <option value="USDT">USDT</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Manual Exchange Rate</label>
                                    <input 
                                        type="number"
                                        step="0.0001"
                                        value={ratePairForm.rate}
                                        onChange={(e) => setRatePairForm(prev => ({ ...prev, rate: parseFloat(e.target.value) || 0 }))}
                                        className="w-full p-3 bg-[#07090E] border border-[#1E2533] rounded-xl text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-[#FF6B00]"
                                        placeholder="e.g. 128.5"
                                    />
                                </div>
                            </div>

                            <div className="p-6 border-t border-[#1E2533] bg-[#07090E]/60 flex gap-2 justify-end">
                                <button 
                                    type="button"
                                    onClick={() => setShowRateModal(false)}
                                    className="px-4 py-2 bg-[#0D1017] hover:bg-white/[0.02] text-slate-400 border border-[#1E2533] text-[9px] font-black uppercase tracking-widest rounded-lg transition-all"
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit"
                                    className="px-5 py-2 bg-[#FF6B00] hover:bg-[#E05E00] text-white text-[9px] font-black uppercase tracking-widest rounded-lg transition-all shadow-md shadow-[#FF6B00]/15"
                                >
                                    Apply Override
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL: Report Export Wizard */}
            {showExportModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
                    <div className="bg-[#0D1017] border border-[#1E2533] rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 text-slate-100">
                        <div className="p-6 border-b border-[#1E2533] flex items-center justify-between">
                            <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                                <Download size={14} className="text-[#FF6B00]" />
                                Report Export Wizard
                            </h3>
                            <button onClick={() => setShowExportModal(false)} className="text-slate-500 hover:text-white text-xl font-bold">&times;</button>
                        </div>

                        <div className="p-6 space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Report Subject</label>
                                <select 
                                    value={exportForm.reportType}
                                    onChange={(e) => setExportForm(prev => ({ ...prev, reportType: e.target.value }))}
                                    className="w-full bg-[#07090E] border border-[#1E2533] text-slate-300 rounded-xl px-3 py-2.5 text-xs font-bold uppercase tracking-wider outline-none focus:border-[#FF6B00] cursor-pointer"
                                >
                                    <option value="financial">Financial Performance Summary</option>
                                    <option value="revenue">Accumulated Revenue Ledger</option>
                                    <option value="transaction">Complete Transactions History</option>
                                    <option value="withdrawal">Payout Queue History</option>
                                </select>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">File Format</label>
                                <select 
                                    value={exportForm.format}
                                    onChange={(e) => setExportForm(prev => ({ ...prev, format: e.target.value }))}
                                    className="w-full bg-[#07090E] border border-[#1E2533] text-slate-300 rounded-xl px-3 py-2.5 text-xs font-bold uppercase tracking-wider outline-none focus:border-[#FF6B00] cursor-pointer"
                                >
                                    <option value="pdf">Document Portable File (.PDF)</option>
                                    <option value="csv">Standard CSV File (.CSV)</option>
                                    <option value="excel">Microsoft Excel Workbook (.XLS)</option>
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Start Date</label>
                                    <input 
                                        type="date"
                                        value={exportForm.from}
                                        onChange={(e) => setExportForm(prev => ({ ...prev, from: e.target.value }))}
                                        className="bg-[#07090E] border border-[#1E2533] text-slate-500 focus:text-white rounded-xl px-3 py-2.5 text-xs outline-none focus:border-[#FF6B00] w-full cursor-pointer"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">End Date</label>
                                    <input 
                                        type="date"
                                        value={exportForm.to}
                                        onChange={(e) => setExportForm(prev => ({ ...prev, to: e.target.value }))}
                                        className="bg-[#07090E] border border-[#1E2533] text-slate-500 focus:text-white rounded-xl px-3 py-2.5 text-xs outline-none focus:border-[#FF6B00] w-full cursor-pointer"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="p-6 border-t border-[#1E2533] bg-[#07090E]/60 flex gap-2 justify-end">
                            <button 
                                onClick={() => setShowExportModal(false)}
                                className="px-4 py-2 bg-[#0D1017] hover:bg-white/[0.02] text-slate-400 border border-[#1E2533] text-[9px] font-black uppercase tracking-widest rounded-lg transition-all"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={handleReportExport}
                                className="px-5 py-2 bg-[#FF6B00] hover:bg-[#E05E00] text-white text-[9px] font-black uppercase tracking-widest rounded-lg transition-all shadow-md shadow-[#FF6B00]/15"
                            >
                                Compile & Download
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// Subcomponents

function KpiTile({ label, value, subtext, icon }: { label: string; value: string; subtext: string; icon: React.ReactNode }) {
    return (
        <div className="p-6 bg-[#0D1017]/85 border border-[#1E2533] rounded-3xl backdrop-blur-md hover:border-[#FF6B00]/30 hover:shadow-[0_4px_25px_rgba(255,107,0,0.04)] transition-all duration-300 group">
            <div className="flex justify-between items-start mb-6">
                <div className="w-11 h-11 bg-[#07090E] border border-white/5 rounded-xl flex items-center justify-center shadow-inner group-hover:scale-105 transition-transform">
                    {icon}
                </div>
            </div>
            <div>
                <p className="text-slate-500 text-[9px] font-black uppercase tracking-widest mb-1.5">{label}</p>
                <p className="text-2xl font-black text-white tracking-tight leading-none">{value}</p>
                <p className="text-[10px] text-slate-500 font-bold uppercase mt-3 tracking-wider">{subtext}</p>
            </div>
        </div>
    );
}

function TreasuryRow({ label, value, highlight, sub }: { label: string; value: string; highlight?: boolean; sub?: boolean }) {
    return (
        <div className={`flex justify-between items-center py-2.5 border-b border-[#1E2533]/40 ${sub ? 'pl-4 border-l border-[#1E2533]/60' : ''}`}>
            <span className={`font-sans font-medium ${highlight ? 'text-slate-300 font-bold' : 'text-slate-500'}`}>{label}</span>
            <span className={`font-bold ${highlight ? 'text-white text-sm font-black' : 'text-slate-300'}`}>{value}</span>
        </div>
    );
}
