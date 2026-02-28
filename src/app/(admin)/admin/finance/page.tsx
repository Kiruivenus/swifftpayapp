import React from 'react';
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
    Smartphone
} from 'lucide-react';

export default function FinancePage() {
    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h2 className="text-3xl font-bold text-white tracking-tight">Financial Center</h2>
                    <p className="text-slate-400 mt-1">Manage platform liquidity, approve withdrawals, and track transactions.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-xl border border-slate-700 transition-all">
                        <Download size={18} />
                        Export CSV
                    </button>
                    <button className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl transition-all shadow-lg shadow-indigo-600/20">
                        <RefreshCcw size={18} />
                        Recalculate Balances
                    </button>
                </div>
            </div>

            {/* Financial Health Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <FinanceStatCard
                    label="Total Deposits (KES)"
                    value="4,285,000.00"
                    change="+12% from last month"
                    icon={<ArrowDownRight size={24} className="text-emerald-400" />}
                />
                <FinanceStatCard
                    label="Total Withdrawals (KES)"
                    value="1,240,000.00"
                    change="+5% from last month"
                    icon={<ArrowUpRight size={24} className="text-indigo-400" />}
                />
                <FinanceStatCard
                    label="Pending Withdrawals"
                    value="854,200.00"
                    change="14 requests waiting"
                    icon={<Clock size={24} className="text-amber-400" />}
                    alert={true}
                />
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                {/* Transaction History - Main Area */}
                <div className="xl:col-span-2 space-y-6">
                    <div className="bg-slate-900/50 border border-slate-800 rounded-3xl overflow-hidden backdrop-blur-sm">
                        <div className="p-6 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="flex items-center gap-4">
                                <h3 className="text-lg font-bold text-white">Transactions</h3>
                                <div className="flex bg-slate-800/50 rounded-lg p-0.5 border border-slate-700">
                                    <button className="px-3 py-1 text-[10px] font-bold bg-slate-700 text-white rounded-md">All</button>
                                    <button className="px-3 py-1 text-[10px] font-bold text-slate-500 hover:text-white transition-colors">Deposits</button>
                                    <button className="px-3 py-1 text-[10px] font-bold text-slate-500 hover:text-white transition-colors">Withdrawals</button>
                                </div>
                            </div>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                                <input
                                    type="text"
                                    placeholder="TXID or Username"
                                    className="pl-9 pr-4 py-2 bg-slate-950/50 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500/50"
                                />
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="bg-slate-800/30 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                        <th className="px-6 py-4">Transaction Details</th>
                                        <th className="px-6 py-4">User</th>
                                        <th className="px-6 py-4">Amount</th>
                                        <th className="px-6 py-4">Method</th>
                                        <th className="px-6 py-4">Status</th>
                                        <th className="px-6 py-4"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800">
                                    <TransactionRow
                                        txid="TX_82940285"
                                        date="2 mins ago"
                                        type="DEPOSIT"
                                        user="John Doe"
                                        amount="KES 50,000"
                                        method="M-PESA"
                                        status="COMPLETED"
                                    />
                                    <TransactionRow
                                        txid="TX_82940284"
                                        date="15 mins ago"
                                        type="WITHDRAWAL"
                                        user="Jane Smith"
                                        amount="KES 12,500"
                                        method="BANK"
                                        status="PENDING"
                                    />
                                    <TransactionRow
                                        txid="TX_82940283"
                                        date="1 hour ago"
                                        type="CONVERSION"
                                        user="Alex Mercer"
                                        amount="KES 85,200"
                                        method="USDT"
                                        status="COMPLETED"
                                    />
                                    <TransactionRow
                                        txid="TX_82940282"
                                        date="3 hours ago"
                                        type="DEPOSIT"
                                        user="Sara Atieno"
                                        amount="KES 200,000"
                                        method="M-PESA"
                                        status="FAILED"
                                    />
                                </tbody>
                            </table>
                        </div>
                        <div className="p-4 border-t border-slate-800 flex justify-center">
                            <button className="text-xs font-bold text-slate-500 hover:text-white transition-colors uppercase tracking-widest px-4 py-2">Load More Transactions</button>
                        </div>
                    </div>
                </div>

                {/* Withdrawal Approval Queue */}
                <div className="space-y-6">
                    <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-6 backdrop-blur-sm">
                        <h3 className="text-lg font-bold text-white mb-6 flex items-center justify-between">
                            Approval Queue
                            <span className="text-[10px] bg-indigo-500 text-white px-2 py-0.5 rounded-full">14 Pending</span>
                        </h3>
                        <div className="space-y-4">
                            <WithdrawalItem
                                user="David Mwangi"
                                amount="KES 124,000"
                                bank="NCBA Bank"
                                account="...8291"
                                time="1h ago"
                            />
                            <WithdrawalItem
                                user="Beatrice W."
                                amount="KES 45,200"
                                bank="Equity Bank"
                                account="...1029"
                                time="4h ago"
                            />
                            <WithdrawalItem
                                user="Samuel Maina"
                                amount="KES 12,000"
                                bank="M-PESA"
                                account="...9200"
                                time="8h ago"
                            />
                        </div>
                        <button className="w-full mt-6 py-3 border border-dashed border-slate-700 hover:border-indigo-500/50 text-slate-500 hover:text-indigo-400 text-xs font-bold rounded-2xl transition-all uppercase tracking-widest">
                            View All Pending
                        </button>
                    </div>

                    <div className="bg-gradient-to-br from-indigo-900/20 to-blue-900/20 border border-indigo-500/20 rounded-3xl p-6 backdrop-blur-sm relative overflow-hidden">
                        <div className="relative z-10">
                            <h3 className="text-lg font-bold text-white mb-2">Live Rate Control</h3>
                            <p className="text-xs text-slate-400 mb-6">Set real-time conversion rates for KES ↔ USDT exchanges.</p>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between p-3 bg-slate-950/40 rounded-xl border border-slate-800">
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold text-xs font-mono">1</div>
                                        <span className="text-xs font-bold text-slate-300">USDT</span>
                                    </div>
                                    <span className="text-xs font-bold text-slate-500">=</span>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-bold text-white">134.50</span>
                                        <span className="text-[10px] font-bold text-slate-500 uppercase">KES</span>
                                    </div>
                                </div>
                            </div>
                            <button className="w-full mt-6 py-3 bg-white text-slate-950 hover:bg-slate-200 text-xs font-black rounded-2xl transition-all uppercase tracking-widest">
                                Update Rates
                            </button>
                        </div>
                        {/* Decorative background element */}
                        <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-indigo-500/10 blur-3xl rounded-full" />
                    </div>
                </div>
            </div>
        </div>
    );
}

function FinanceStatCard({ label, value, change, icon, alert }: any) {
    return (
        <div className={`p-6 rounded-3xl border backdrop-blur-sm transition-all group ${alert ? 'bg-amber-500/5 border-amber-500/20' : 'bg-slate-900/50 border-slate-800 hover:border-indigo-500/30'}`}>
            <div className="flex justify-between items-start mb-6">
                <div className="w-12 h-12 bg-slate-800 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    {icon}
                </div>
            </div>
            <div>
                <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-1">{label}</p>
                <p className="text-3xl font-bold text-white tracking-tight">{value}</p>
                <p className={`text-[11px] font-medium mt-2 ${alert ? 'text-amber-400' : 'text-slate-500'}`}>{change}</p>
            </div>
        </div>
    );
}

function TransactionRow({ txid, date, type, user, amount, method, status }: any) {
    const statusColor = status === 'COMPLETED' ? 'text-emerald-400 bg-emerald-500/10' :
        status === 'PENDING' ? 'text-amber-400 bg-amber-500/10' :
            'text-rose-400 bg-rose-500/10';

    const typeIcon = type === 'DEPOSIT' ? <ArrowDownRight className="text-emerald-400" size={14} /> :
        type === 'WITHDRAWAL' ? <ArrowUpRight className="text-indigo-400" size={14} /> :
            <RefreshCcw className="text-amber-400" size={14} />;

    return (
        <tr className="group hover:bg-slate-800/20 transition-all duration-300">
            <td className="px-6 py-5">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center">
                        {typeIcon}
                    </div>
                    <div>
                        <p className="text-sm font-bold text-white font-mono">{txid}</p>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wide">{date}</p>
                    </div>
                </div>
            </td>
            <td className="px-6 py-5">
                <span className="text-sm font-medium text-slate-300">{user}</span>
            </td>
            <td className="px-6 py-5">
                <span className="text-sm font-bold text-white">{amount}</span>
            </td>
            <td className="px-6 py-5">
                <div className="flex items-center gap-2 text-xs text-slate-400">
                    {method === 'M-PESA' ? <Smartphone size={14} className="text-slate-600" /> : <Banknote size={14} className="text-slate-600" />}
                    {method}
                </div>
            </td>
            <td className="px-6 py-5">
                <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-widest border border-current opacity-80 ${statusColor}`}>
                    {status}
                </div>
            </td>
            <td className="px-6 py-5 text-right">
                <button className="p-2 text-slate-500 hover:text-white transition-colors">
                    <MoreVertical size={18} />
                </button>
            </td>
        </tr>
    );
}

function WithdrawalItem({ user, amount, bank, account, time }: any) {
    return (
        <div className="p-4 bg-slate-950/40 border border-slate-800 rounded-2xl group hover:border-slate-700 transition-all">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h4 className="text-sm font-bold text-white leading-none">{user}</h4>
                    <p className="text-[10px] text-slate-500 font-medium mt-1">{time}</p>
                </div>
                <span className="text-sm font-black text-indigo-400">{amount}</span>
            </div>
            <div className="flex items-center justify-between text-[11px] mb-6">
                <div className="flex items-center gap-2 text-slate-400">
                    <Banknote size={12} className="text-slate-600" />
                    {bank}
                </div>
                <span className="text-slate-600 font-mono tracking-tighter">{account}</span>
            </div>
            <div className="flex gap-2">
                <button className="flex-1 py-2 bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-400 font-bold text-[10px] uppercase tracking-widest rounded-lg border border-emerald-500/20 transition-all">
                    Approve
                </button>
                <button className="flex-1 py-2 bg-rose-600/10 hover:bg-rose-600/20 text-rose-400 font-bold text-[10px] uppercase tracking-widest rounded-lg border border-rose-500/20 transition-all">
                    Reject
                </button>
            </div>
        </div>
    );
}

function Clock({ size, className }: any) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
        </svg>
    );
}
