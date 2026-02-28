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
    Smartphone,
    Clock,
    Loader2
} from 'lucide-react';
import { adminService } from '@/services/admin.service';

export default function FinancePage() {
    const [stats, setStats] = useState<any>(null);
    const [transactions, setTransactions] = useState<any[]>([]);
    const [withdrawals, setWithdrawals] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [txLoading, setTxLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [rates, setRates] = useState<any[]>([]);
    const [processingId, setProcessingId] = useState<string | null>(null);

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const [s, w, r] = await Promise.all([
                adminService.getOverviewStats(),
                adminService.getWithdrawalQueue(),
                adminService.getRates()
            ]);
            setStats(s);
            setWithdrawals(w.withdrawals || []);
            setRates(r.rates || []);
        } catch (err: any) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchTransactions = useCallback(async () => {
        try {
            setTxLoading(true);
            const data = await adminService.getTransactions({ search, limit: 10 });
            setTransactions(data.transactions || []);
        } catch (err: any) {
            console.error(err);
        } finally {
            setTxLoading(false);
        }
    }, [search]);

    useEffect(() => {
        fetchData();
        const timer = setTimeout(() => fetchTransactions(), 500);
        return () => clearTimeout(timer);
    }, [fetchData, fetchTransactions]);

    const handleApproveWithdrawal = async (id: string) => {
        if (!confirm("Are you sure you want to approve this withdrawal? Funds will be deducted from the user's wallet.")) return;
        try {
            setProcessingId(id);
            await adminService.approveWithdrawal(id);
            alert("Withdrawal Approved");
            fetchData();
            fetchTransactions();
        } catch (err: any) {
            alert(err.message);
        } finally {
            setProcessingId(null);
        }
    };

    const handleRejectWithdrawal = async (id: string) => {
        const reason = prompt("Reason for rejection:");
        if (!reason) return;
        try {
            setProcessingId(id);
            await adminService.rejectWithdrawal(id, reason);
            alert("Withdrawal Rejected");
            fetchData();
            fetchTransactions();
        } catch (err: any) {
            alert(err.message);
        } finally {
            setProcessingId(null);
        }
    };

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
                        Refresh
                    </button>
                </div>
            </div>

            {/* Financial Health Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <FinanceStatCard
                    label="Total Deposits (KES)"
                    value={(stats?.finance.totalDepositsKES || 0).toLocaleString()}
                    change="Platform Inflow"
                    icon={<ArrowDownRight size={24} className="text-emerald-400" />}
                />
                <FinanceStatCard
                    label="Total Withdrawals (KES)"
                    value={(stats?.finance.totalWithdrawalsKES || 0).toLocaleString()}
                    change="Platform Outflow"
                    icon={<ArrowUpRight size={24} className="text-indigo-400" />}
                />
                <FinanceStatCard
                    label="Active Sessions"
                    value={stats?.activeSessions.toLocaleString() || "0"}
                    change="Currently Online"
                    icon={<Clock size={24} className="text-amber-400" />}
                />
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                {/* Transaction History - Main Area */}
                <div className="xl:col-span-2 space-y-6">
                    <div className="bg-slate-900/50 border border-slate-800 rounded-3xl overflow-hidden backdrop-blur-sm min-h-[500px] flex flex-col">
                        <div className="p-6 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <h3 className="text-lg font-bold text-white">Platform Transactions</h3>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                                <input
                                    type="text"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="TXID or Username"
                                    className="pl-9 pr-4 py-2 bg-slate-950/50 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500/50"
                                />
                            </div>
                        </div>
                        <div className="overflow-x-auto flex-1">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="bg-slate-800/30 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                        <th className="px-6 py-4">Transaction Details</th>
                                        <th className="px-6 py-4">User</th>
                                        <th className="px-6 py-4">Amount</th>
                                        <th className="px-6 py-4">Method/Ref</th>
                                        <th className="px-6 py-4">Status</th>
                                        <th className="px-6 py-4"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800">
                                    {txLoading ? (
                                        <tr>
                                            <td colSpan={6} className="py-20 text-center">
                                                <Loader2 className="animate-spin text-indigo-500 mx-auto" size={32} />
                                            </td>
                                        </tr>
                                    ) : transactions.map((tx) => (
                                        <TransactionRow key={tx._id} tx={tx} />
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Withdrawal Approval Queue */}
                <div className="space-y-6">
                    <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-6 backdrop-blur-sm">
                        <h3 className="text-lg font-bold text-white mb-6 flex items-center justify-between">
                            Approval Queue
                            <span className="text-[10px] bg-indigo-500 text-white px-2 py-0.5 rounded-full">{withdrawals.length} Pending</span>
                        </h3>
                        <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1 custom-scrollbar">
                            {withdrawals.length === 0 ? (
                                <div className="text-center py-10">
                                    <CheckCircle2 className="mx-auto text-slate-700 mb-2" size={32} />
                                    <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">Queue is clear</p>
                                </div>
                            ) : withdrawals.map((w) => (
                                <WithdrawalItem
                                    key={w._id}
                                    user={w.userId.username}
                                    amount={`${w.currency} ${w.amount.toLocaleString()}`}
                                    bank={w.metadata?.bankName || w.type}
                                    account={w.metadata?.accountNumber || w.phoneNumber}
                                    time={new Date(w.createdAt).toLocaleDateString()}
                                    onApprove={() => handleApproveWithdrawal(w._id)}
                                    onReject={() => handleRejectWithdrawal(w._id)}
                                    processing={processingId === w._id}
                                />
                            ))}
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-indigo-900/20 to-blue-900/20 border border-indigo-500/20 rounded-3xl p-6 backdrop-blur-sm relative overflow-hidden">
                        <div className="relative z-10">
                            <h3 className="text-lg font-bold text-white mb-2">Platform Rates</h3>
                            <p className="text-xs text-slate-400 mb-6">Current exchange rates for KES ↔ USDT exchanges.</p>
                            <div className="space-y-3">
                                {rates.map((rate) => (
                                    <div key={rate._id} className="flex items-center justify-between p-3 bg-slate-950/40 rounded-xl border border-slate-800">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold text-xs uppercase">{rate.pair.split('-')[1]}</div>
                                            <span className="text-xs font-bold text-slate-300">1 {rate.pair.split('-')[1]}</span>
                                        </div>
                                        <span className="text-xs font-bold text-slate-500">=</span>
                                        <div className="flex items-center gap-2 text-right">
                                            <span className="text-xs font-bold text-white">{rate.rate}</span>
                                            <span className="text-[10px] font-bold text-slate-500 uppercase">{rate.pair.split('-')[0]}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <button className="w-full mt-6 py-3 bg-white text-slate-950 hover:bg-slate-200 text-xs font-black rounded-2xl transition-all uppercase tracking-widest">
                                Manage Rates
                            </button>
                        </div>
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

function TransactionRow({ tx }: { tx: any }) {
    const statusColor = tx.status === 'COMPLETED' ? 'text-emerald-400 bg-emerald-500/10' :
        tx.status === 'PENDING' ? 'text-amber-400 bg-amber-500/10' :
            'text-rose-400 bg-rose-500/10';

    const typeIcon = tx.type === 'DEPOSIT' ? <ArrowDownRight className="text-emerald-400" size={14} /> :
        tx.type === 'WITHDRAWAL' ? <ArrowUpRight className="text-indigo-400" size={14} /> :
            <RefreshCcw className="text-amber-400" size={14} />;

    return (
        <tr className="group hover:bg-slate-800/20 transition-all duration-300">
            <td className="px-6 py-5">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center">
                        {typeIcon}
                    </div>
                    <div>
                        <p className="text-sm font-bold text-white font-mono">{tx.reference?.slice(-10) || tx._id.slice(-10)}</p>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wide">{new Date(tx.createdAt).toLocaleDateString()}</p>
                    </div>
                </div>
            </td>
            <td className="px-6 py-5">
                <span className="text-sm font-medium text-slate-300 capitalize">{tx.userId?.username || 'System'}</span>
            </td>
            <td className="px-6 py-5">
                <span className="text-sm font-bold text-white">{tx.currency} {tx.amount.toLocaleString()}</span>
            </td>
            <td className="px-6 py-5">
                <div className="flex items-center gap-2 text-xs text-slate-400">
                    <Smartphone size={14} className="text-slate-600" />
                    {tx.type} / {tx.reference || 'internal'}
                </div>
            </td>
            <td className="px-6 py-5">
                <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-widest border border-current opacity-80 ${statusColor}`}>
                    {tx.status}
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

function WithdrawalItem({ user, amount, bank, account, time, onApprove, onReject, processing }: any) {
    return (
        <div className="p-4 bg-slate-950/40 border border-slate-800 rounded-2xl group hover:border-slate-700 transition-all">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h4 className="text-sm font-bold text-white leading-none capitalize">{user}</h4>
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
                <button
                    onClick={onApprove}
                    disabled={processing}
                    className="flex-1 py-2 bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-400 font-bold text-[10px] uppercase tracking-widest rounded-lg border border-emerald-500/20 transition-all flex items-center justify-center"
                >
                    {processing ? <Loader2 className="animate-spin" size={14} /> : 'Approve'}
                </button>
                <button
                    onClick={onReject}
                    disabled={processing}
                    className="flex-1 py-2 bg-rose-600/10 hover:bg-rose-600/20 text-rose-400 font-bold text-[10px] uppercase tracking-widest rounded-lg border border-rose-500/20 transition-all"
                >
                    Reject
                </button>
            </div>
        </div>
    );
}

