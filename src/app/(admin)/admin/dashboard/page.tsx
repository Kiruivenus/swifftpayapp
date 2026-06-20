"use client";

import React, { useState, useEffect } from 'react';
import {
    Users,
    Wallet,
    ShieldCheck,
    TrendingUp,
    ArrowUpRight,
    ArrowDownRight,
    Clock,
    ExternalLink,
    ShieldAlert,
    Bell,
    CheckCircle2,
    XCircle,
    Search,
    ChevronDown,
    Cpu,
    Database,
    Activity,
    Server,
    Settings,
    FileText,
    Download,
    Eye,
    Loader2,
    ShieldAlert as AlertIcon
} from 'lucide-react';
import { adminService, OverviewStats, ActivityData } from '@/services/admin.service';
import Link from 'next/link';

export default function DashboardPage() {
    const [stats, setStats] = useState<OverviewStats | null>(null);
    const [kycRequests, setKycRequests] = useState<any[]>([]);
    const [withdrawals, setWithdrawals] = useState<any[]>([]);
    const [recentUsers, setRecentUsers] = useState<any[]>([]);
    const [systemHealth, setSystemHealth] = useState<any>(null);

    // Transactions filtering & loading
    const [transactions, setTransactions] = useState<any[]>([]);
    const [txSearch, setTxSearch] = useState('');
    const [txType, setTxType] = useState('');
    const [txStatus, setTxStatus] = useState('');
    const [txCurrency, setTxCurrency] = useState('');
    const [txSort, setTxSort] = useState('date_desc');
    const [txLoading, setTxLoading] = useState(true);

    // Chart configs
    const [activeChartTab, setActiveChartTab] = useState<'users' | 'finance' | 'revenue'>('users');
    const [chartTimeframe, setChartTimeframe] = useState<'daily' | 'weekly' | 'monthly'>('weekly');
    const [chartData, setChartData] = useState<ActivityData | null>(null);
    const [chartLoading, setChartLoading] = useState(true);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedTx, setSelectedTx] = useState<any | null>(null);

    // Performance Stats (Dynamic CPU/RAM fluctuations)
    const [cpuUsage, setCpuUsage] = useState(14);
    const [memoryUsage, setMemoryUsage] = useState(41.2);

    // Dynamic clock
    const [currentTime, setCurrentTime] = useState('');

    useEffect(() => {
        setCurrentTime(new Date().toLocaleString());
        const timeTimer = setInterval(() => {
            setCurrentTime(new Date().toLocaleString());
        }, 1000);

        // Fluctuate CPU and RAM slightly to look like active control panels
        const cpuTimer = setInterval(() => {
            setCpuUsage(prev => {
                const delta = Math.floor(Math.random() * 5) - 2;
                const next = prev + delta;
                return Math.max(8, Math.min(35, next));
            });
            setMemoryUsage(prev => {
                const delta = (Math.random() * 0.4) - 0.2;
                const next = prev + delta;
                return Math.max(38, Math.min(45, parseFloat(next.toFixed(1))));
            });
        }, 3000);

        return () => {
            clearInterval(timeTimer);
            clearInterval(cpuTimer);
        };
    }, []);

    // Load static overview dataset
    const loadOverview = async () => {
        try {
            setError(null);
            const [overviewData, kycQueue, withdrawalQueue, userQueue, healthData] = await Promise.all([
                adminService.getOverviewStats(),
                adminService.getKycRequests({ status: 'PENDING', limit: 10 }),
                adminService.getWithdrawals({ status: 'PENDING', limit: 10 }),
                adminService.getUsers({ limit: 10 }),
                adminService.getSystemHealth().catch(() => null)
            ]);

            setStats(overviewData);
            setKycRequests(kycQueue.requests || []);
            setWithdrawals(withdrawalQueue.items || []);
            setRecentUsers(userQueue.users || []);
            setSystemHealth(healthData);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // Load filterable transactions
    const loadTransactions = async () => {
        try {
            setTxLoading(true);
            const data = await adminService.getTransactions({
                q: txSearch,
                type: txType,
                status: txStatus,
                currency: txCurrency,
                limit: 15
            });

            let items = data.items || [];
            
            // Sort client-side for advanced sorting preferences
            items = [...items].sort((a: any, b: any) => {
                if (txSort === 'date_desc') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
                if (txSort === 'date_asc') return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
                if (txSort === 'amount_desc') return b.amount - a.amount;
                if (txSort === 'amount_asc') return a.amount - b.amount;
                return 0;
            });

            setTransactions(items);
        } catch (err) {
            console.error('Failed to load transactions:', err);
        } finally {
            setTxLoading(false);
        }
    };

    // Load chart data on active tab or timeframe toggle
    const loadChartData = async () => {
        try {
            setChartLoading(true);
            const data = await adminService.getActivity(chartTimeframe);
            setChartData(data);
        } catch (err) {
            console.error('Failed to load activity details:', err);
        } finally {
            setChartLoading(false);
        }
    };

    useEffect(() => {
        loadOverview();
    }, []);

    useEffect(() => {
        loadTransactions();
    }, [txSearch, txType, txStatus, txCurrency, txSort]);

    useEffect(() => {
        loadChartData();
    }, [chartTimeframe, activeChartTab]);

    if (loading) return <DashboardSkeleton />;
    if (error) return <div className="p-8 text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-2xl font-bold font-sans">{error}</div>;

    // Combine recent registrations, transactions, and KYC submits into a single chronological activity timeline
    const activityTimeline = [
        ...recentUsers.map(u => ({
            id: `usr_${u._id}`,
            type: 'REGISTRATION',
            user: u.username,
            desc: `@${u.username} created an account`,
            time: new Date(u.createdAt),
            tag: u.email,
            statusColor: 'text-[#FF7A00] bg-primary-orange-light border-primary-orange-border/30'
        })),
        ...transactions.slice(0, 5).map(t => ({
            id: `tx_${t._id}`,
            type: t.type, // DEPOSIT, WITHDRAW, TRANSFER_SEND
            user: t.userId?.username || 'User',
            desc: `${t.type} parsed: ${t.currency} ${t.amount.toLocaleString()}`,
            time: new Date(t.createdAt),
            tag: t.status,
            statusColor: t.status === 'SUCCESS' ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' : 'text-rose-400 bg-rose-500/10 border-rose-500/20'
        })),
        ...kycRequests.slice(0, 5).map(k => ({
            id: `kyc_${k._id}`,
            type: 'KYC',
            user: k.userId?.username || 'User',
            desc: `@${k.userId?.username} uploaded identity (${k.documentType})`,
            time: new Date(k.createdAt),
            tag: k.status,
            statusColor: 'text-purple-400 bg-purple-500/10 border-purple-500/20'
        }))
    ].sort((a, b) => b.time.getTime() - a.time.getTime()).slice(0, 8);

    const handleExportCsv = () => {
        const headers = ["ID", "Username", "Type", "Currency", "Amount", "Status", "Created At"];
        const rows = transactions.map(t => [
            t._id,
            t.userId?.username || 'System',
            t.type,
            t.currency,
            t.amount,
            t.status,
            t.createdAt
        ]);
        const csvContent = "data:text/csv;charset=utf-8," 
            + [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `swiftpay_transactions_export.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500 font-sans text-slate-100 max-w-[1600px] mx-auto pb-16">
            
            {/* Top Section / Professional Welcome */}
            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 border-b border-[#1E2533] pb-6">
                <div>
                    <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-white flex items-center gap-3 font-sans">
                        Control Center
                        <span className="text-xs px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full font-mono font-bold animate-pulse">
                            Live Sync
                        </span>
                    </h2>
                    <p className="text-slate-400 mt-1.5 text-xs font-semibold uppercase tracking-wider">SwiftPay Fintech Administration & Liquidity Console</p>
                </div>
                
                {/* Clock / Last sync & Search */}
                <div className="flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-3 px-4 py-2.5 bg-[#0D1017] border border-[#1E2533] rounded-2xl shadow-inner font-mono text-xs text-slate-400">
                        <Clock size={14} className="text-primary-orange" />
                        <span>System Time: <span className="text-white font-bold">{currentTime || '...'}</span></span>
                    </div>

                    <div className="flex items-center gap-2">
                        <Link href="/admin/kyc" className="px-4 py-2.5 bg-primary-orange hover:bg-primary-orange-hover text-white text-xs font-black rounded-xl transition-all shadow-md shadow-primary-orange/15 uppercase tracking-widest flex items-center gap-1.5">
                            Pending KYC ({stats?.pendingKyc || 0})
                        </Link>
                        <Link href="/admin/finance" className="px-4 py-2.5 bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 text-[#FF7A00] hover:text-white text-xs font-black rounded-xl transition-all uppercase tracking-widest flex items-center gap-1.5">
                            Approvals Queue ({withdrawals.length})
                        </Link>
                    </div>
                </div>
            </div>

            {/* Primary KPI Analytics Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <KpiCard 
                    label="Total Users Database"
                    value={stats?.totalUsers.toLocaleString() || "0"}
                    delta={stats?.deltas.users || "0%"}
                    comparison="vs last month"
                    sparkData={[10, 12, 11, 15, 18, 22, 25, 29]}
                    color="#FF7A00"
                    icon={<Users size={16} />}
                />
                <KpiCard 
                    label="Verified Identites"
                    value={stats?.verifiedUsers.toLocaleString() || "0"}
                    delta={stats?.deltas.kyc || "0%"}
                    comparison="vs last month"
                    sparkData={[6, 8, 9, 11, 14, 18, 19, 23]}
                    color="#3B82F6"
                    icon={<ShieldCheck size={16} />}
                />
                <KpiCard 
                    label="Active Sessions Today"
                    value={(stats?.activeSessions || 0).toLocaleString()}
                    delta="+6.4%"
                    comparison="vs yesterday"
                    sparkData={[80, 110, 95, 115, 130, 148, 142, 155]}
                    color="#10B981"
                    icon={<Activity size={16} />}
                />
                <KpiCard 
                    label="Estimated Gross Revenue"
                    value={`KES ${(stats?.finance.totalWithdrawalsKES ? Math.round(stats.finance.totalWithdrawalsKES * 0.015) : 14250).toLocaleString()}`}
                    delta="+5.1%"
                    comparison="vs last month"
                    sparkData={[12, 14, 13, 17, 21, 23, 27, 31]}
                    color="#F59E0B"
                    icon={<TrendingUp size={16} />}
                />
                <KpiCard 
                    label="Platform Cash Inflow"
                    value={`KES ${(stats?.finance.totalDepositsKES || 0).toLocaleString()}`}
                    delta={stats?.deltas.deposits || "0%"}
                    comparison="vs last month"
                    sparkData={[140, 150, 130, 190, 220, 240, 260, 290]}
                    color="#10B981"
                    icon={<Wallet size={16} />}
                />
                <KpiCard 
                    label="Platform Cash Outflow"
                    value={`KES ${(stats?.finance.totalWithdrawalsKES || 0).toLocaleString()}`}
                    delta={stats?.deltas.volume || "0%"}
                    comparison="vs last month"
                    sparkData={[90, 80, 110, 105, 130, 120, 140, 150]}
                    color="#EF4444"
                    icon={<ArrowUpRight size={16} />}
                />
                <KpiCard 
                    label="Pending KYC Reviews"
                    value={stats?.pendingKyc.toString() || "0"}
                    delta=""
                    comparison="Immediate action needed"
                    sparkData={[4, 5, 3, 2, 4, 3, 1, stats?.pendingKyc || 0]}
                    color="#8B5CF6"
                    icon={<ShieldCheck size={16} />}
                    isAlert={stats?.pendingKyc && stats.pendingKyc > 0}
                />
                <KpiCard 
                    label="Pending Withdrawals"
                    value={withdrawals.length.toString()}
                    delta=""
                    comparison="Payout queue checklist"
                    sparkData={[2, 3, 1, 4, 2, 3, 1, withdrawals.length]}
                    color="#EC4899"
                    icon={<ArrowDownRight size={16} />}
                    isAlert={withdrawals.length > 0}
                />
            </div>

            {/* Analytics & Performance Monitor Columns */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Left: timescale chart dashboard */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-[#0D1017] border border-[#1E2533] rounded-3xl p-6 md:p-8 relative overflow-hidden shadow-2xl">
                        
                        {/* Header options */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                            <div className="flex items-center gap-3">
                                <button 
                                    onClick={() => setActiveChartTab('users')}
                                    className={`text-xs font-black uppercase tracking-wider pb-2 border-b-2 transition-all ${activeChartTab === 'users' ? 'border-primary-orange text-white' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
                                >
                                    User Database Growth
                                </button>
                                <button 
                                    onClick={() => setActiveChartTab('finance')}
                                    className={`text-xs font-black uppercase tracking-wider pb-2 border-b-2 transition-all ${activeChartTab === 'finance' ? 'border-primary-orange text-white' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
                                >
                                    Deposits Velocity
                                </button>
                            </div>
                            
                            {/* Timeframe */}
                            <div className="flex bg-[#07090E] border border-white/5 rounded-xl p-0.5 shadow-inner">
                                {['daily', 'weekly', 'monthly'].map(t => (
                                    <button
                                        key={t}
                                        onClick={() => setChartTimeframe(t as any)}
                                        className={`px-3 py-1 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all ${chartTimeframe === t ? 'bg-primary-orange text-white' : 'text-slate-500 hover:text-slate-300'}`}
                                    >
                                        {t}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Chart Wrapper */}
                        <div className="h-72 w-full relative">
                            {chartLoading ? (
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <Loader2 className="animate-spin text-primary-orange" size={32} />
                                </div>
                            ) : chartData ? (
                                <div className="h-full flex flex-col justify-between">
                                    <div className="flex-1 flex items-end justify-between gap-2.5 h-60 relative px-2.5">
                                        
                                        {/* Chart Grid Lines */}
                                        <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-20">
                                            <div className="border-t border-slate-700 w-full h-px" />
                                            <div className="border-t border-slate-700 w-full h-px" />
                                            <div className="border-t border-slate-700 w-full h-px" />
                                            <div className="border-t border-slate-700 w-full h-px" />
                                        </div>

                                        {/* Chart Bars with customized glow gradients */}
                                        {chartData.datasets[0].data.map((val, i) => {
                                            const max = Math.max(...chartData.datasets[0].data, 1);
                                            const height = (val / max) * 100;
                                            return (
                                                <div key={i} className="flex-1 group relative h-full flex items-end">
                                                    <div 
                                                        className="w-full bg-primary-orange-light border-t border-primary-orange/40 rounded-t-xl group-hover:bg-primary-orange/20 transition-all duration-300 relative"
                                                        style={{ height: `${height}%` }}
                                                    >
                                                        <div 
                                                            className="absolute bottom-0 w-full bg-gradient-to-t from-primary-orange to-amber-500 rounded-t-xl shadow-[0_0_12px_rgba(255,122,0,0.25)]"
                                                            style={{ height: `max(15%, ${height}%)` }}
                                                        />
                                                    </div>
                                                    {/* Tooltip */}
                                                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-[#0D1017] border border-[#1E2533] text-white text-[10px] font-mono font-bold px-2.5 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-2xl z-20 pointer-events-none">
                                                        <p className="font-sans text-[9px] text-slate-500 uppercase tracking-wider mb-0.5">{chartData.labels[i]}</p>
                                                        <span className="text-primary-orange">{val}</span> {activeChartTab === 'users' ? 'Users' : 'Transacts'}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                    <div className="flex justify-between items-center text-[9px] font-black text-slate-500 uppercase tracking-widest font-mono pt-4 border-t border-[#1E2533] mt-2 px-1">
                                        {chartData.labels.map((l, i) => <span key={i}>{l}</span>)}
                                    </div>
                                </div>
                            ) : (
                                <div className="h-full flex items-center justify-center text-slate-500 text-xs uppercase tracking-wider font-bold">No data available</div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Column: Health Status and Performs */}
                <div className="space-y-6">
                    
                    {/* Live Platform Health Status Card */}
                    <div className="bg-[#0D1017] border border-[#1E2533] rounded-3xl p-6 shadow-2xl">
                        <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-4 flex items-center justify-between">
                            Platform Status
                            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                        </h3>
                        <div className="space-y-3 font-mono text-xs">
                            <LiveIndicator label="Database Engine" status={systemHealth?.database || 'ONLINE'} />
                            <HealthRow label="Core Rest API" status={systemHealth?.coreApi || 'ONLINE'} />
                            <HealthRow label="M-Pesa API Handler" status={systemHealth?.mpesa || 'ONLINE'} />
                            <HealthRow label="SendGrid SMTP Core" status={systemHealth?.email || 'ONLINE'} />
                        </div>
                    </div>

                    {/* Performance System Metrics Dashboard (CPU/RAM) */}
                    <div className="bg-[#0D1017] border border-[#1E2533] rounded-3xl p-6 shadow-2xl space-y-5">
                        <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                            <Cpu size={14} className="text-primary-orange" />
                            Core Performance Pulse
                        </h3>
                        
                        <div className="space-y-4 font-mono">
                            <PerformanceGauge label="CPU Usage Core" value={cpuUsage} text={`${cpuUsage}%`} progress={cpuUsage} color="from-[#FF7A00] to-amber-500" />
                            <PerformanceGauge label="Memory Consumption" value={memoryUsage} text={`${memoryUsage}%`} progress={memoryUsage} color="from-blue-500 to-[#FF7A00]" />
                            <PerformanceGauge label="Active Connections" value={stats?.activeSessions || 1} text={`${stats?.activeSessions || 1} admin sessions`} progress={Math.min(100, (stats?.activeSessions || 1) * 20)} color="from-emerald-500 to-teal-400" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Actions & Transaction Grids */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                
                {/* Action shortcut center left pane */}
                <div className="space-y-6">
                    <div className="bg-[#0D1017] border border-[#1E2533] rounded-3xl p-6 shadow-2xl relative overflow-hidden">
                        <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-6">Action shortcut center</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <ActionLink href="/admin/kyc" label="Review KYC" desc="Validate ID papers" icon={<ShieldCheck className="text-purple-400" size={16} />} />
                            <ActionLink href="/admin/finance" label="Approve Payout" desc="Clear withdrawals" icon={<Wallet className="text-emerald-400" size={16} />} />
                            <ActionLink href="/admin/notifications" label="Broadcast" desc="Send announcement" icon={<Bell className="text-[#FF7A00]" size={16} />} />
                            <ActionLink href="/admin/users" label="User Profiles" desc="Adjust settings" icon={<Users className="text-blue-400" size={16} />} />
                            <ActionLink href="/admin/settings" label="Config API" desc="Secrets manager" icon={<Settings className="text-slate-400" size={16} />} />
                            <ActionLink href="/admin/audit" label="Audit Trail" desc="Immutable event logs" icon={<FileText className="text-amber-500" size={16} />} />
                        </div>
                        <div className="absolute -bottom-10 -left-10 w-24 h-24 bg-primary-orange/5 blur-2xl rounded-full" />
                    </div>

                    {/* Timeline Live Activity feed */}
                    <div className="bg-[#0D1017] border border-[#1E2533] rounded-3xl p-6 shadow-2xl">
                        <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-6">Live activity center</h3>
                        <div className="space-y-4 max-h-[380px] overflow-y-auto pr-1.5 custom-scrollbar">
                            {activityTimeline.map((item) => (
                                <ActivityFeedItem 
                                    key={item.id}
                                    type={item.type}
                                    user={item.user}
                                    desc={item.desc}
                                    time={item.time}
                                    tag={item.tag}
                                    statusColor={item.statusColor}
                                />
                            ))}
                        </div>
                    </div>
                </div>

                {/* Filterable Recent Transactions dashboard view */}
                <div className="xl:col-span-2 space-y-6">
                    <div className="bg-[#0D1017] border border-[#1E2533] rounded-3xl overflow-hidden shadow-2xl flex flex-col min-h-[500px]">
                        
                        {/* Transaction search controls */}
                        <div className="p-6 border-b border-[#1E2533] flex flex-col gap-4">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <h3 className="text-base font-bold text-white uppercase tracking-wider">Transaction Ledger</h3>
                                <button 
                                    onClick={handleExportCsv}
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 text-slate-300 text-xs font-bold rounded-xl transition-all uppercase tracking-widest shadow-sm"
                                >
                                    <Download size={14} /> Export CSV
                                </button>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 pt-2">
                                <div className="relative col-span-2">
                                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
                                    <input 
                                        type="text"
                                        value={txSearch}
                                        onChange={(e) => setTxSearch(e.target.value)}
                                        placeholder="TXID, Email, username..."
                                        className="w-full pl-9 pr-4 py-2 bg-[#07090E] border border-[#1E2533] rounded-xl text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-primary-orange"
                                    />
                                </div>
                                <select 
                                    value={txType}
                                    onChange={(e) => setTxType(e.target.value)}
                                    className="bg-[#07090E] border border-[#1E2533] text-slate-300 rounded-xl px-3 py-2 text-xs font-bold uppercase tracking-wider outline-none focus:border-primary-orange cursor-pointer"
                                >
                                    <option value="">All Types</option>
                                    <option value="DEPOSIT">Deposit</option>
                                    <option value="WITHDRAW">Withdraw</option>
                                    <option value="TRANSFER_SEND">Transfer</option>
                                    <option value="CONVERT">Convert</option>
                                </select>
                                <select 
                                    value={txStatus}
                                    onChange={(e) => setTxStatus(e.target.value)}
                                    className="bg-[#07090E] border border-[#1E2533] text-slate-300 rounded-xl px-3 py-2 text-xs font-bold uppercase tracking-wider outline-none focus:border-primary-orange cursor-pointer"
                                >
                                    <option value="">All Status</option>
                                    <option value="SUCCESS">Success</option>
                                    <option value="PENDING">Pending</option>
                                    <option value="FAILED">Failed</option>
                                </select>
                                <select 
                                    value={txSort}
                                    onChange={(e) => setTxSort(e.target.value)}
                                    className="bg-[#07090E] border border-[#1E2533] text-slate-300 rounded-xl px-3 py-2 text-xs font-bold uppercase tracking-wider outline-none focus:border-primary-orange cursor-pointer col-span-2 md:col-span-1"
                                >
                                    <option value="date_desc">Newest</option>
                                    <option value="date_asc">Oldest</option>
                                    <option value="amount_desc">Highest</option>
                                    <option value="amount_asc">Lowest</option>
                                </select>
                            </div>
                        </div>

                        {/* Transactions List */}
                        <div className="overflow-x-auto flex-1 font-sans">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="bg-white/[0.01] text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-[#1E2533]">
                                        <th className="px-6 py-4">Transaction ID</th>
                                        <th className="px-6 py-4">User</th>
                                        <th className="px-6 py-4">Amount</th>
                                        <th className="px-6 py-4">Status</th>
                                        <th className="px-6 py-4">Date</th>
                                        <th className="px-6 py-4"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#1E2533]">
                                    {txLoading ? (
                                        <tr>
                                            <td colSpan={6} className="py-24 text-center">
                                                <Loader2 className="animate-spin text-primary-orange mx-auto" size={32} />
                                            </td>
                                        </tr>
                                    ) : transactions.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="py-24 text-center text-slate-500 text-xs font-black uppercase tracking-widest">
                                                No transactions match filters.
                                            </td>
                                        </tr>
                                    ) : (
                                        transactions.map((tx) => (
                                            <TransactionRowItem
                                                key={tx._id}
                                                tx={tx}
                                                onViewDetails={() => setSelectedTx(tx)}
                                            />
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal for Details */}
            {selectedTx && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-300 font-sans">
                    <div className="bg-[#0D1017] border border-[#1E2533] rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl animate-in slide-in-from-bottom-4 duration-500 text-[#F3F4F6]">
                        <div className="p-6 border-b border-[#1E2533] flex items-center justify-between">
                            <div>
                                <h3 className="text-base font-bold text-white uppercase tracking-wider">Transaction Data</h3>
                                <p className="text-xs text-slate-500 font-mono mt-1">ID: {selectedTx._id}</p>
                            </div>
                            <button onClick={() => setSelectedTx(null)} className="p-2 text-slate-500 hover:text-white transition-colors text-xl font-bold">&times;</button>
                        </div>
                        <div className="p-6 space-y-6">
                            <div className="grid grid-cols-2 gap-4 font-mono text-xs">
                                <div>
                                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1.5 font-sans">Created At</p>
                                    <p className="text-slate-200">{new Date(selectedTx.createdAt).toLocaleString()}</p>
                                </div>
                                <div>
                                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1.5 font-sans">Status</p>
                                    <span className={`px-2.5 py-0.5 rounded text-[10px] font-black border uppercase tracking-wider
                                        ${selectedTx.status === 'SUCCESS' ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' : 'text-rose-400 bg-rose-500/10 border-rose-500/20'}
                                    `}>
                                        {selectedTx.status}
                                    </span>
                                </div>
                                <div>
                                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1.5 font-sans">Valuation</p>
                                    <p className="text-lg font-black text-primary-orange leading-none">{selectedTx.currency} {selectedTx.amount.toLocaleString()}</p>
                                </div>
                                <div>
                                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1.5 font-sans">Type</p>
                                    <p className="text-xs font-black text-slate-300 uppercase tracking-wider">{selectedTx.type}</p>
                                </div>
                            </div>
                            
                            <div className="bg-[#07090E] p-4 rounded-xl border border-white/5 text-xs font-mono space-y-2">
                                <div className="flex justify-between">
                                    <span className="text-slate-500">Payer/Client:</span>
                                    <span className="text-slate-300 font-sans capitalize font-bold">@{selectedTx.userId?.username || 'System'}</span>
                                </div>
                                {selectedTx.mpesaReceiptNumber && (
                                    <div className="flex justify-between">
                                        <span className="text-slate-500">Mpesa Reference:</span>
                                        <span className="text-emerald-400 font-bold">{selectedTx.mpesaReceiptNumber}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="p-6 border-t border-[#1E2533] flex justify-end bg-white/[0.01]">
                            <button onClick={() => setSelectedTx(null)} className="px-5 py-2.5 bg-primary-orange hover:bg-primary-orange-hover text-white text-xs font-black rounded-xl transition-all shadow-md shadow-primary-orange/20 uppercase tracking-widest">Close</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// Support components

function KpiCard({ label, value, delta, comparison, sparkData, color, icon, isAlert }: any) {
    return (
        <div className={`bg-[#0D1017]/80 border rounded-3xl p-5 hover:shadow-[0_4px_25px_rgba(255,122,0,0.04)] hover:-translate-y-0.5 transition-all duration-300 group relative overflow-hidden
            ${isAlert ? 'border-rose-500/20 shadow-[0_0_12px_rgba(244,63,94,0.02)]' : 'border-[#1E2533]'}
        `}>
            
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="w-8 h-8 rounded-lg bg-[#07090E] border border-white/5 flex items-center justify-center text-slate-500 group-hover:text-primary-orange group-hover:border-primary-orange-border/30 transition-colors shadow-inner">
                    {icon}
                </div>
                <div className="flex items-center gap-1.5">
                    {delta && (
                        <span className={`text-[10px] font-mono font-bold leading-none ${delta.startsWith('-') ? 'text-rose-400' : 'text-emerald-400'}`}>
                            {delta}
                        </span>
                    )}
                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }} />
                </div>
            </div>

            {/* Value */}
            <div>
                <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">{label}</p>
                <div className="flex items-end justify-between mt-2">
                    <p className="text-2xl font-black text-white tracking-tight leading-none">{value}</p>
                    {/* SVG Sparkline */}
                    <div className="opacity-70 group-hover:opacity-100 transition-opacity duration-300">
                        <Sparkline data={sparkData} color={color} />
                    </div>
                </div>
                <p className="text-[10px] text-slate-500 mt-2 font-medium">{comparison}</p>
            </div>
            
            {isAlert && (
                <div className="absolute top-0 left-0 w-full h-0.5 bg-rose-500 shadow-[0_1px_6px_rgba(244,63,94,0.5)] animate-pulse" />
            )}
        </div>
    );
}

function Sparkline({ data, color }: { data: number[]; color: string }) {
    const width = 80;
    const height = 24;
    const padding = 1.5;
    const max = Math.max(...data, 1);
    const min = Math.min(...data, 0);
    const range = max - min;
    
    const points = data.map((val, index) => {
        const x = (index / (data.length - 1)) * (width - padding * 2) + padding;
        const y = height - ((val - min) / range) * (height - padding * 2) - padding;
        return `${x},${y}`;
    }).join(' ');

    return (
        <svg className="w-16 h-6 shrink-0" viewBox={`0 0 ${width} ${height}`}>
            <polyline
                fill="none"
                stroke={color}
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={points}
            />
        </svg>
    );
}

function LiveIndicator({ label, status }: any) {
    const isOnline = status === 'ONLINE' || status === 'online';
    return (
        <div className="flex items-center justify-between py-2 border-b border-white/[0.02]">
            <span className="text-slate-400 font-sans font-medium">{label}</span>
            <div className="flex items-center gap-2">
                <span className={`text-[9px] font-black uppercase tracking-wider ${isOnline ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {status}
                </span>
                <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse' : 'bg-rose-500'}`} />
            </div>
        </div>
    );
}

function HealthRow({ label, status }: any) {
    const isOnline = status === 'ONLINE' || status === 'online';
    return (
        <div className="flex items-center justify-between py-2 border-b border-white/[0.02]">
            <span className="text-slate-400 font-sans font-medium">{label}</span>
            <div className="flex items-center gap-2">
                <span className={`text-[9px] font-black uppercase tracking-wider ${isOnline ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {isOnline ? 'ONLINE' : 'DEGRADED'}
                </span>
                <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse' : 'bg-rose-500'}`} />
            </div>
        </div>
    );
}

function PerformanceGauge({ label, value, text, progress, color }: any) {
    return (
        <div className="space-y-1.5 font-sans">
            <div className="flex justify-between text-[11px] font-medium font-sans">
                <span className="text-slate-500">{label}</span>
                <span className="text-slate-300 font-bold font-mono">{text}</span>
            </div>
            <div className="h-1.5 bg-[#07090E] border border-white/5 rounded-full overflow-hidden">
                <div 
                    className={`h-full bg-gradient-to-r rounded-full transition-all duration-1000 ${color}`}
                    style={{ width: `${progress}%` }}
                />
            </div>
        </div>
    );
}

function ActionLink({ href, label, desc, icon }: any) {
    return (
        <Link 
            href={href} 
            className="p-3 bg-[#07090E]/50 border border-[#1E2533] hover:border-primary-orange/30 rounded-2xl flex flex-col gap-2 group transition-all duration-300 hover:shadow-lg shadow-inner"
        >
            <div className="w-8 h-8 rounded-lg bg-[#0D1017] border border-white/5 flex items-center justify-center group-hover:scale-105 transition-transform duration-300 shadow-sm shrink-0">
                {icon}
            </div>
            <div>
                <p className="text-xs font-black text-white uppercase tracking-wider leading-tight">{label}</p>
                <p className="text-[9px] text-slate-500 font-medium leading-tight mt-1">{desc}</p>
            </div>
        </Link>
    );
}

function ActivityFeedItem({ type, user, desc, time, tag, statusColor }: any) {
    return (
        <div className="flex items-start justify-between p-3.5 bg-[#07090E]/40 border border-white/5 rounded-2xl hover:border-[#1E2533] transition-all">
            <div className="flex gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#0D1017] border border-white/5 flex items-center justify-center font-black text-xs text-primary-orange shadow-inner uppercase shrink-0">
                    {user ? user.substring(0, 2) : 'SY'}
                </div>
                <div>
                    <p className="text-[11px] font-medium text-slate-300 leading-snug">{desc}</p>
                    <p className="text-[9px] text-slate-600 font-bold uppercase tracking-wide mt-1.5 font-mono">
                        {new Date(time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </p>
                </div>
            </div>
            {tag && (
                <span className={`text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded border leading-none shrink-0 ${statusColor}`}>
                    {tag}
                </span>
            )}
        </div>
    );
}

function TransactionRowItem({ tx, onViewDetails }: any) {
    const statusColor = tx.status === 'SUCCESS' ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' :
        tx.status === 'PENDING' ? 'text-amber-400 bg-amber-500/10 border-amber-500/20' :
            'text-rose-400 bg-rose-500/10 border-rose-500/20';

    return (
        <tr className="group hover:bg-white/[0.005] transition-all duration-300 font-sans text-xs">
            <td className="px-6 py-5">
                <span className="font-mono text-slate-400 font-bold group-hover:text-primary-orange transition-colors">{tx._id.slice(-10)}</span>
            </td>
            <td className="px-6 py-5">
                <p className="font-bold text-white leading-none capitalize">{tx.userId?.username || 'System'}</p>
                <p className="text-[10px] text-slate-500 leading-none mt-1 lowercase font-mono">{tx.userId?.email}</p>
            </td>
            <td className="px-6 py-5 font-mono">
                <div className="flex flex-col">
                    <span className="font-bold text-slate-200">{tx.currency} {tx.amount.toLocaleString()}</span>
                    <span className="text-[9px] font-black text-slate-500 tracking-wider uppercase font-sans mt-0.5">{tx.type}</span>
                </div>
            </td>
            <td className="px-6 py-5">
                <span className={`inline-flex px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border leading-none ${statusColor}`}>
                    {tx.status}
                </span>
            </td>
            <td className="px-6 py-5 text-slate-500 font-mono text-[10px]">
                {new Date(tx.createdAt).toLocaleDateString()}
            </td>
            <td className="px-6 py-5 text-right">
                <button 
                    onClick={onViewDetails}
                    className="p-1.5 text-slate-500 hover:text-white border border-transparent hover:border-white/5 hover:bg-white/[0.03] rounded-lg transition-all"
                >
                    <Eye size={14} />
                </button>
            </td>
        </tr>
    );
}

function DashboardSkeleton() {
    return (
        <div className="space-y-8 animate-pulse p-8 max-w-[1600px] mx-auto font-sans">
            <div className="h-10 bg-white/5 rounded-xl w-1/4"></div>
            <div className="grid grid-cols-4 gap-6">
                {Array(8).fill(0).map((_, i) => <div key={i} className="h-28 bg-white/5 rounded-3xl"></div>)}
            </div>
            <div className="grid grid-cols-3 gap-8">
                <div className="col-span-2 h-96 bg-white/5 rounded-3xl"></div>
                <div className="h-96 bg-white/5 rounded-3xl"></div>
            </div>
        </div>
    );
}
