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
    const [filters, setFilters] = useState({
        type: '',
        status: '',
        currency: '',
        page: 1
    });
    const [rates, setRates] = useState<any[]>([]);
    const [processingId, setProcessingId] = useState<string | null>(null);
    const [selectedTx, setSelectedTx] = useState<any | null>(null);
    const [selectedUser, setSelectedUser] = useState<any | null>(null);
    const [metrics, setMetrics] = useState<any>(null);

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const [m, w, r] = await Promise.all([
                adminService.getFinanceMetrics(),
                adminService.getWithdrawals({ status: 'PENDING' }),
                adminService.getRatesConfig()
            ]);
            setMetrics(m);
            setWithdrawals(w.items || []); // API returns 'items' now
            setRates(r.fxRates || []);
        } catch (err: any) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchTransactions = useCallback(async () => {
        try {
            setTxLoading(true);
            const data = await adminService.getTransactions({
                q: search,
                ...filters,
                limit: 20
            });
            setTransactions(data.items || []);
        } catch (err: any) {
            console.error(err);
        } finally {
            setTxLoading(false);
        }
    }, [search, filters]);

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
                    value={(metrics?.totalDepositsKES || 0).toLocaleString()}
                    change="Platform Inflow (30d)"
                    icon={<ArrowDownRight size={24} className="text-emerald-400" />}
                />
                <FinanceStatCard
                    label="Total Withdrawals (KES)"
                    value={(metrics?.totalWithdrawalsKES || 0).toLocaleString()}
                    change="Platform Outflow (30d)"
                    icon={<ArrowUpRight size={24} className="text-indigo-400" />}
                />
                <FinanceStatCard
                    label="Active Sessions"
                    value={metrics?.activeSessions.toLocaleString() || "0"}
                    change="Currently Online"
                    icon={<Clock size={24} className="text-amber-400" />}
                />
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                {/* Transaction History - Main Area */}
                <div className="xl:col-span-2 space-y-6">
                    <div className="bg-slate-900/50 border border-slate-800 rounded-3xl overflow-hidden backdrop-blur-sm min-h-[500px] flex flex-col">
                        <div className="p-6 border-b border-slate-800 flex flex-col xl:flex-row xl:items-center justify-between gap-4">
                            <h3 className="text-lg font-bold text-white">Platform Transactions</h3>
                            <div className="flex flex-wrap items-center gap-3">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                                    <input
                                        type="text"
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        placeholder="TXID, Email, Phone..."
                                        className="pl-9 pr-4 py-2 bg-slate-950/50 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500/50 min-w-[200px]"
                                    />
                                </div>
                                <select
                                    value={filters.type}
                                    onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value, page: 1 }))}
                                    className="px-4 py-2 bg-slate-950/50 border border-slate-800 rounded-xl text-xs text-slate-400 focus:outline-none"
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
                                    className="px-4 py-2 bg-slate-950/50 border border-slate-800 rounded-xl text-xs text-slate-400 focus:outline-none"
                                >
                                    <option value="">All Status</option>
                                    <option value="PENDING">Pending</option>
                                    <option value="SUCCESS">Success</option>
                                    <option value="FAILED">Failed</option>
                                </select>
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
                                    ) : transactions.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="py-20 text-center text-slate-500 text-sm">
                                                No transactions match your search.
                                            </td>
                                        </tr>
                                    ) : transactions.map((tx) => (
                                        <TransactionRow
                                            key={tx._id}
                                            tx={tx}
                                            onViewDetails={() => setSelectedTx(tx)}
                                            onViewUser={() => setSelectedUser(tx.userId)}
                                        />
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
                                    withdrawal={w}
                                    onApprove={() => handleApproveWithdrawal(w._id)}
                                    onReject={() => handleRejectWithdrawal(w._id)}
                                    onUserClick={() => setSelectedUser(w.userId)}
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
                                            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold text-xs uppercase">{rate.quoteCurrency}</div>
                                            <span className="text-xs font-bold text-slate-300">1 {rate.quoteCurrency}</span>
                                        </div>
                                        <span className="text-xs font-bold text-slate-500">=</span>
                                        <div className="flex items-center gap-2 text-right">
                                            <span className="text-xs font-bold text-white">{rate.rate}</span>
                                            <span className="text-[10px] font-bold text-slate-500 uppercase">{rate.baseCurrency}</span>
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

            {/* Modals & Drawers */}
            {selectedTx && (
                <TransactionDetailsModal
                    tx={selectedTx}
                    onClose={() => setSelectedTx(null)}
                />
            )}
            {selectedUser && (
                <UserDrilldownDrawer
                    user={selectedUser}
                    onClose={() => setSelectedUser(null)}
                />
            )}
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

function TransactionRow({ tx, onViewDetails, onViewUser }: { tx: any, onViewDetails: () => void, onViewUser: () => void }) {
    const [showMenu, setShowMenu] = useState(false);

    const statusColor = tx.status === 'SUCCESS' ? 'text-emerald-400 bg-emerald-500/10' :
        tx.status === 'PENDING' ? 'text-amber-400 bg-amber-500/10' :
            'text-rose-400 bg-rose-500/10';

    const typeIcon = tx.type === 'DEPOSIT' ? <ArrowDownRight className="text-emerald-400" size={14} /> :
        tx.type === 'WITHDRAW' ? <ArrowUpRight className="text-indigo-400" size={14} /> :
            tx.type === 'CONVERT' ? <RefreshCcw className="text-amber-400" size={14} /> :
                <RefreshCcw className="text-slate-400" size={14} />;

    return (
        <tr className="group hover:bg-slate-800/20 transition-all duration-300">
            <td className="px-6 py-5">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center">
                        {typeIcon}
                    </div>
                    <div>
                        <p className="text-sm font-bold text-white font-mono">{tx._id.slice(-10)}</p>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wide">{new Date(tx.createdAt).toLocaleString()}</p>
                    </div>
                </div>
            </td>
            <td className="px-6 py-5">
                <button
                    onClick={onViewUser}
                    className="text-sm font-medium text-slate-300 hover:text-indigo-400 transition-colors capitalize text-left"
                >
                    {tx.userId?.username || 'System'}
                    <p className="text-[10px] text-slate-500 font-normal lowercase">{tx.userId?.email}</p>
                </button>
            </td>
            <td className="px-6 py-5">
                <span className="text-sm font-bold text-white">{tx.currency} {tx.amount.toLocaleString()}</span>
            </td>
            <td className="px-6 py-5">
                <div className="flex flex-col gap-0.5 text-[11px] text-slate-400">
                    <span className="font-bold text-slate-500">{tx.type}</span>
                    {tx.mpesaReceiptNumber && <span className="text-[10px] font-mono">{tx.mpesaReceiptNumber}</span>}
                    {tx.toAddress && <span className="text-[10px] font-mono text-slate-600">{tx.toAddress.slice(0, 10)}...</span>}
                </div>
            </td>
            <td className="px-6 py-5">
                <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-widest border border-current opacity-80 ${statusColor}`}>
                    {tx.status}
                </div>
            </td>
            <td className="px-6 py-5 text-right relative">
                <div className="flex justify-end">
                    <button
                        onClick={() => setShowMenu(!showMenu)}
                        className="p-2 text-slate-500 hover:text-white transition-colors hover:bg-slate-700 rounded-lg"
                    >
                        <MoreVertical size={18} />
                    </button>

                    {showMenu && (
                        <>
                            <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
                            <div className="absolute right-6 top-12 w-48 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl py-2 z-20 animate-in fade-in zoom-in duration-200">
                                <button
                                    onClick={() => { onViewDetails(); setShowMenu(false); }}
                                    className="w-full px-4 py-2 text-left text-xs font-bold text-slate-300 hover:bg-slate-800 hover:text-white flex items-center gap-2"
                                >
                                    <Search size={14} /> View Details
                                </button>
                                <button
                                    onClick={() => { onViewUser(); setShowMenu(false); }}
                                    className="w-full px-4 py-2 text-left text-xs font-bold text-slate-300 hover:bg-slate-800 hover:text-white flex items-center gap-2"
                                >
                                    <Wallet size={14} /> User Profile
                                </button>
                                <div className="h-px bg-slate-800 my-1" />
                                <button
                                    onClick={() => { navigator.clipboard.writeText(tx._id); setShowMenu(false); }}
                                    className="w-full px-4 py-2 text-left text-xs font-medium text-slate-500 hover:bg-slate-800 hover:text-white"
                                >
                                    Copy Transaction ID
                                </button>
                                {tx.mpesaReceiptNumber && (
                                    <button
                                        onClick={() => { navigator.clipboard.writeText(tx.mpesaReceiptNumber); setShowMenu(false); }}
                                        className="w-full px-4 py-2 text-left text-xs font-medium text-slate-500 hover:bg-slate-800 hover:text-white"
                                    >
                                        Copy M-Pesa Code
                                    </button>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </td>
        </tr>
    );
}

function WithdrawalItem({ withdrawal, onApprove, onReject, onUserClick, processing }: any) {
    const user = withdrawal.userId;
    return (
        <div className="p-4 bg-slate-950/40 border border-slate-800 rounded-2xl group hover:border-slate-700 transition-all">
            <div className="flex justify-between items-start mb-4">
                <button onClick={onUserClick} className="text-left group/user">
                    <h4 className="text-sm font-bold text-white leading-none capitalize group-hover/user:text-indigo-400">{user?.username || 'Unknown'}</h4>
                    <p className="text-[10px] text-slate-500 font-medium mt-1">{new Date(withdrawal.createdAt).toLocaleString()}</p>
                </button>
                <span className="text-sm font-black text-indigo-400">{withdrawal.currency} {withdrawal.amount.toLocaleString()}</span>
            </div>

            <div className="space-y-2 mb-6">
                <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-500">Method</span>
                    <span className="text-slate-300 font-bold">{withdrawal.phoneNumber ? 'MPESA' : 'CRYPTO'}</span>
                </div>
                {withdrawal.phoneNumber && (
                    <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-500">Number</span>
                        <span className="text-slate-300 font-mono">{withdrawal.phoneNumber}</span>
                    </div>
                )}
                {withdrawal.toAddress && (
                    <div className="flex flex-col gap-1 text-[11px]">
                        <span className="text-slate-500">Address</span>
                        <span className="text-slate-400 font-mono break-all bg-slate-900 p-1.5 rounded border border-slate-800">{withdrawal.toAddress}</span>
                    </div>
                )}
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

function TransactionDetailsModal({ tx, onClose }: { tx: any, onClose: () => void }) {
    if (!tx) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl animate-in slide-in-from-bottom-4 duration-500">
                <div className="p-6 border-b border-slate-800 flex items-center justify-between">
                    <div>
                        <h3 className="text-xl font-bold text-white">Transaction Details</h3>
                        <p className="text-xs text-slate-500 mt-1 font-mono">{tx._id}</p>
                    </div>
                    <button onClick={onClose} className="p-2 text-slate-500 hover:text-white transition-colors">&times;</button>
                </div>
                <div className="p-6 overflow-y-auto max-h-[70vh] space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Status</p>
                            <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest border border-current ${tx.status === 'SUCCESS' ? 'text-emerald-400 bg-emerald-500/10' :
                                tx.status === 'PENDING' ? 'text-amber-400 bg-amber-500/10' : 'text-rose-400 bg-rose-500/10'
                                }`}>
                                {tx.status}
                            </div>
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Created At</p>
                            <p className="text-sm font-medium text-white">{new Date(tx.createdAt).toLocaleString()}</p>
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Amount</p>
                            <p className="text-2xl font-black text-indigo-400 font-mono">{tx.currency} {tx.amount.toLocaleString()}</p>
                            {tx.fee && <p className="text-[10px] text-slate-500 font-medium">Fee: {tx.currency} {tx.fee}</p>}
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Transaction Type</p>
                            <p className="text-sm font-bold text-slate-300">{tx.type}</p>
                        </div>
                    </div>

                    <div className="bg-slate-950/50 rounded-2xl p-4 border border-slate-800">
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Technical Information</p>
                        <div className="space-y-3 font-mono text-[11px]">
                            <div className="flex justify-between py-1 border-b border-slate-800/50">
                                <span className="text-slate-500">User Details</span>
                                <span className="text-slate-400">{tx.userId?.username || 'System'} ({tx.userId?._id || tx.userId})</span>
                            </div>
                            {tx.mpesaReceiptNumber && (
                                <div className="flex justify-between py-1 border-b border-slate-800/50">
                                    <span className="text-slate-500">M-Pesa Receipt Code</span>
                                    <span className="text-emerald-400 font-bold">{tx.mpesaReceiptNumber}</span>
                                </div>
                            )}
                            {tx.phoneNumber && (
                                <div className="flex justify-between py-1 border-b border-slate-800/50">
                                    <span className="text-slate-500">Phone Number</span>
                                    <span className="text-slate-300 font-bold">{tx.phoneNumber}</span>
                                </div>
                            )}
                            {tx.toAddress && (
                                <div className="flex flex-col gap-1 py-1 border-b border-slate-800/50">
                                    <span className="text-slate-500">Crypto Address</span>
                                    <span className="text-indigo-400 break-all bg-slate-900/80 p-2 rounded">{tx.toAddress}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
                <div className="p-6 border-t border-slate-800 flex justify-end gap-3">
                    <button onClick={onClose} className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition-all">Close</button>
                </div>
            </div>
        </div>
    );
}

function UserDrilldownDrawer({ user: initialUser, onClose }: { user: any, onClose: () => void }) {
    const [userData, setUserData] = useState<any>(null);
    const [userTxs, setUserTxs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            try {
                setLoading(true);
                const [summary, txs] = await Promise.all([
                    adminService.getUserSummary(initialUser?._id || initialUser),
                    adminService.getUserTransactions(initialUser?._id || initialUser, { limit: 20 })
                ]);
                setUserData(summary);
                setUserTxs(txs.items || []);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        if (initialUser) load();
    }, [initialUser]);

    if (!initialUser) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-hidden flex justify-end animate-in fade-in duration-300">
            <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative w-full max-w-xl bg-slate-900 shadow-2xl border-l border-slate-800 flex flex-col h-full animate-in slide-in-from-right duration-500">
                <div className="p-6 border-b border-slate-800 flex items-center justify-between">
                    <h3 className="text-xl font-bold text-white">User Financial Profile</h3>
                    <button onClick={onClose} className="p-2 text-slate-500 hover:text-white transition-colors">&times;</button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-8">
                    {loading ? (
                        <div className="h-full flex items-center justify-center"><Loader2 className="animate-spin text-indigo-500" size={40} /></div>
                    ) : (
                        <>
                            <div className="flex items-center gap-4">
                                <div className="w-16 h-16 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center text-2xl font-black text-indigo-500 capitalize">
                                    {(userData?.user?.username || initialUser.username)?.charAt(0)}
                                </div>
                                <div>
                                    <h4 className="text-2xl font-black text-white capitalize">{userData?.user?.username || initialUser.username}</h4>
                                    <p className="text-slate-500 font-medium">{userData?.user?.email || initialUser.email}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 bg-slate-950/50 rounded-2xl border border-slate-800">
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">KES Balance</p>
                                    <p className="text-xl font-black text-white">{(userData?.wallet?.kesBalance || 0).toLocaleString()} KES</p>
                                </div>
                                <div className="p-4 bg-slate-950/50 rounded-2xl border border-slate-800">
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">USDT Balance</p>
                                    <p className="text-xl font-black text-indigo-400">{(userData?.wallet?.usdtBalance || 0).toLocaleString()} USDT</p>
                                </div>
                            </div>

                            <div>
                                <h5 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-4">Recent Transactions</h5>
                                <div className="space-y-2">
                                    {userTxs.map((tx: any) => (
                                        <div key={tx._id} className="p-3 bg-slate-950/30 rounded-xl border border-slate-800/50 flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${tx.type === 'DEPOSIT' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-indigo-500/10 text-indigo-400'
                                                    }`}>
                                                    {tx.type === 'DEPOSIT' ? <ArrowDownRight size={14} /> : <ArrowUpRight size={14} />}
                                                </div>
                                                <div>
                                                    <p className="text-[11px] font-bold text-white">{tx.type}</p>
                                                    <p className="text-[9px] text-slate-500">{new Date(tx.createdAt).toLocaleDateString()}</p>
                                                </div>
                                            </div>
                                            <span className={`text-[11px] font-black ${tx.type === 'DEPOSIT' ? 'text-emerald-400' : 'text-indigo-400'}`}>
                                                {tx.currency} {tx.amount.toLocaleString()}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
