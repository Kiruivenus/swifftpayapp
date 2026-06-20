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
import Link from 'next/link';

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
            setWithdrawals(w.items || []);
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
        <div className="space-y-8 animate-in fade-in duration-700 font-sans">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h2 className="text-3xl font-bold text-white tracking-tight">Financial Center</h2>
                    <p className="text-slate-400 mt-1">Manage platform liquidity, approve withdrawals, and track transactions.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button className="flex items-center gap-2 px-4 py-2.5 bg-[#0D1017] hover:bg-white/[0.03] text-white font-bold text-xs uppercase tracking-wider rounded-xl border border-[#1E2533] transition-all shadow-sm">
                        <Download size={16} />
                        Export CSV
                    </button>
                    <button onClick={fetchData} className="flex items-center gap-2 px-6 py-2.5 bg-primary-orange hover:bg-primary-orange-hover text-white font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-primary-orange/20">
                        <RefreshCcw size={16} />
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
                    icon={<ArrowDownRight size={22} className="text-emerald-400" />}
                />
                <FinanceStatCard
                    label="Total Withdrawals (KES)"
                    value={(metrics?.totalWithdrawalsKES || 0).toLocaleString()}
                    change="Platform Outflow (30d)"
                    icon={<ArrowUpRight size={22} className="text-primary-orange" />}
                />
                <FinanceStatCard
                    label="Active Sessions"
                    value={metrics?.activeSessions.toLocaleString() || "0"}
                    change="Currently Online"
                    icon={<Clock size={22} className="text-amber-400" />}
                />
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                {/* Transaction History - Main Area */}
                <div className="xl:col-span-2 space-y-6">
                    <div className="bg-[#0D1017]/80 border border-[#1E2533] rounded-3xl overflow-hidden backdrop-blur-md min-h-[500px] flex flex-col shadow-2xl">
                        <div className="p-6 border-b border-[#1E2533] flex flex-col xl:flex-row xl:items-center justify-between gap-4">
                            <h3 className="text-base font-bold text-white uppercase tracking-wider">Platform Transactions</h3>
                            <div className="flex flex-wrap items-center gap-3">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
                                    <input
                                        type="text"
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        placeholder="TXID, Email, Phone..."
                                        className="pl-9 pr-4 py-2 bg-[#07090E] border border-[#1E2533] rounded-xl text-[11px] text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-primary-orange min-w-[200px]"
                                    />
                                </div>
                                <select
                                    value={filters.type}
                                    onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value, page: 1 }))}
                                    className="px-4 py-2 bg-[#07090E] border border-[#1E2533] rounded-xl text-[11px] text-slate-400 font-bold uppercase tracking-wider cursor-pointer outline-none focus:border-primary-orange"
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
                                    className="px-4 py-2 bg-[#07090E] border border-[#1E2533] rounded-xl text-[11px] text-slate-400 font-bold uppercase tracking-wider cursor-pointer outline-none focus:border-primary-orange"
                                >
                                    <option value="">All Status</option>
                                    <option value="PENDING">Pending</option>
                                    <option value="SUCCESS">Success</option>
                                    <option value="FAILED">Failed</option>
                                </select>
                            </div>
                        </div>
                        <div className="overflow-x-auto flex-1">
                            <table className="w-full text-left font-sans">
                                <thead>
                                    <tr className="bg-white/[0.02] text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-[#1E2533]">
                                        <th className="px-6 py-4">Transaction Details</th>
                                        <th className="px-6 py-4">User</th>
                                        <th className="px-6 py-4">Amount</th>
                                        <th className="px-6 py-4">Method/Ref</th>
                                        <th className="px-6 py-4">Status</th>
                                        <th className="px-6 py-4"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#1E2533]">
                                    {txLoading ? (
                                        <tr>
                                            <td colSpan={6} className="py-20 text-center">
                                                <Loader2 className="animate-spin text-primary-orange mx-auto" size={32} />
                                            </td>
                                        </tr>
                                    ) : transactions.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="py-20 text-center text-slate-500 text-xs font-bold uppercase tracking-widest">
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
                    <div className="bg-[#0D1017]/80 border border-[#1E2533] rounded-3xl p-6 backdrop-blur-md shadow-2xl">
                        <h3 className="text-base font-bold text-white mb-6 flex items-center justify-between uppercase tracking-wider">
                            Approval Queue
                            <span className="text-[10px] bg-primary-orange text-white px-2.5 py-0.5 rounded-full font-black tracking-widest">{withdrawals.length} Pending</span>
                        </h3>
                        <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1 custom-scrollbar">
                            {withdrawals.length === 0 ? (
                                <div className="text-center py-10">
                                    <CheckCircle2 className="mx-auto text-slate-700 mb-2" size={32} />
                                    <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Queue is clear</p>
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

                    <div className="bg-[#0D1017]/80 border border-[#1E2533] rounded-3xl p-6 backdrop-blur-md relative overflow-hidden shadow-2xl">
                        <div className="relative z-10">
                            <h3 className="text-base font-bold text-white mb-2 uppercase tracking-wider">Platform Rates</h3>
                            <p className="text-xs text-slate-400 mb-6 font-medium">Current exchange rates for KES ↔ USDT exchanges.</p>
                            <div className="space-y-3 font-mono">
                                {rates.map((rate) => (
                                    <div key={rate._id} className="flex items-center justify-between p-3 bg-[#07090E]/40 rounded-xl border border-[#1E2533]">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold text-xs uppercase">{rate.quoteCurrency}</div>
                                            <span className="text-xs font-bold text-slate-300">1 {rate.quoteCurrency}</span>
                                        </div>
                                        <span className="text-xs font-bold text-slate-600">=</span>
                                        <div className="flex items-center gap-2 text-right">
                                            <span className="text-xs font-bold text-white">{rate.rate}</span>
                                            <span className="text-[10px] font-bold text-slate-500 uppercase">{rate.baseCurrency}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <Link href="/admin/rates" className="block text-center w-full mt-6 py-3.5 bg-white text-[#07090E] hover:bg-slate-200 text-[10px] font-black rounded-2xl transition-all uppercase tracking-[0.2em] shadow-sm">
                                Manage Rates
                            </Link>
                        </div>
                        <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-primary-orange/5 blur-3xl rounded-full" />
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
        <div className={`p-6 rounded-3xl border backdrop-blur-md transition-all group ${alert ? 'bg-primary-orange-light border-primary-orange-border/30' : 'bg-[#0D1017]/80 border-[#1E2533] hover:border-primary-orange/20 hover:shadow-[0_4px_25px_rgba(255,122,0,0.05)]'}`}>
            <div className="flex justify-between items-start mb-6">
                <div className="w-12 h-12 bg-[#07090E]/80 border border-[#1E2533] rounded-2xl flex items-center justify-center group-hover:scale-105 transition-transform shadow-inner">
                    {icon}
                </div>
            </div>
            <div>
                <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1.5">{label}</p>
                <p className="text-3xl font-black text-white tracking-tight leading-none">{value}</p>
                <p className={`text-[10px] font-bold uppercase tracking-wider mt-3 ${alert ? 'text-primary-orange' : 'text-slate-500'}`}>{change}</p>
            </div>
        </div>
    );
}

function TransactionRow({ tx, onViewDetails, onViewUser }: { tx: any, onViewDetails: () => void, onViewUser: () => void }) {
    const [showMenu, setShowMenu] = useState(false);

    const statusColor = tx.status === 'SUCCESS' ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' :
        tx.status === 'PENDING' ? 'text-amber-400 bg-amber-500/10 border-amber-500/20' :
            'text-rose-400 bg-rose-500/10 border-rose-500/20';

    const typeIcon = tx.type === 'DEPOSIT' ? <ArrowDownRight className="text-emerald-400" size={14} /> :
        tx.type === 'WITHDRAW' ? <ArrowUpRight className="text-primary-orange" size={14} /> :
            tx.type === 'CONVERT' ? <RefreshCcw className="text-amber-400" size={14} /> :
                <RefreshCcw className="text-slate-400" size={14} />;

    return (
        <tr className="group hover:bg-white/[0.01] transition-all duration-300 font-sans">
            <td className="px-6 py-5">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-[#07090E] border border-[#1E2533] flex items-center justify-center shadow-inner">
                        {typeIcon}
                    </div>
                    <div>
                        <p className="text-xs font-bold text-white font-mono">{tx._id.slice(-10)}</p>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wide mt-0.5">{new Date(tx.createdAt).toLocaleString()}</p>
                    </div>
                </div>
            </td>
            <td className="px-6 py-5">
                <button
                    onClick={onViewUser}
                    className="text-xs font-bold text-slate-300 hover:text-primary-orange transition-colors capitalize text-left outline-none leading-normal"
                >
                    {tx.userId?.username || 'System'}
                    <p className="text-[10px] text-slate-500 font-normal lowercase font-mono">{tx.userId?.email}</p>
                </button>
            </td>
            <td className="px-6 py-5 font-mono">
                <span className="text-xs font-bold text-white">{tx.currency} {tx.amount.toLocaleString()}</span>
            </td>
            <td className="px-6 py-5">
                <div className="flex flex-col gap-0.5 text-[11px] text-slate-400">
                    <span className="font-bold text-slate-500 uppercase text-[9px] tracking-wider">{tx.type}</span>
                    {tx.mpesaReceiptNumber && <span className="text-[10px] font-mono text-emerald-400 font-bold">{tx.mpesaReceiptNumber}</span>}
                    {tx.toAddress && <span className="text-[10px] font-mono text-slate-600">{tx.toAddress.slice(0, 10)}...</span>}
                </div>
            </td>
            <td className="px-6 py-5">
                <div className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest border ${statusColor}`}>
                    {tx.status}
                </div>
            </td>
            <td className="px-6 py-5 text-right relative">
                <div className="flex justify-end">
                    <button
                        onClick={() => setShowMenu(!showMenu)}
                        className="p-2 text-slate-500 hover:text-white transition-colors hover:bg-white/[0.04] border border-transparent hover:border-white/5 rounded-lg"
                    >
                        <MoreVertical size={16} />
                    </button>

                    {showMenu && (
                        <>
                            <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
                            <div className="absolute right-6 top-12 w-48 bg-[#0D1017] border border-[#1E2533] rounded-xl shadow-2xl py-2 z-20 animate-in fade-in zoom-in duration-200 backdrop-blur-md">
                                <button
                                    onClick={() => { onViewDetails(); setShowMenu(false); }}
                                    className="w-full px-4 py-2 text-left text-xs font-bold text-slate-300 hover:bg-[#07090E] hover:text-white flex items-center gap-2"
                                >
                                    <Search size={14} /> View Details
                                </button>
                                <button
                                    onClick={() => { onViewUser(); setShowMenu(false); }}
                                    className="w-full px-4 py-2 text-left text-xs font-bold text-slate-300 hover:bg-[#07090E] hover:text-white flex items-center gap-2"
                                >
                                    <Wallet size={14} /> User Profile
                                </button>
                                <div className="h-px bg-[#1E2533] my-1" />
                                <button
                                    onClick={() => { navigator.clipboard.writeText(tx._id); setShowMenu(false); }}
                                    className="w-full px-4 py-2 text-left text-[10px] font-black text-slate-500 hover:bg-[#07090E] hover:text-white uppercase tracking-widest"
                                >
                                    Copy Transaction ID
                                </button>
                                {tx.mpesaReceiptNumber && (
                                    <button
                                        onClick={() => { navigator.clipboard.writeText(tx.mpesaReceiptNumber); setShowMenu(false); }}
                                        className="w-full px-4 py-2 text-left text-[10px] font-black text-slate-500 hover:bg-[#07090E] hover:text-white uppercase tracking-widest"
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
        <div className="p-4 bg-[#07090E]/40 border border-[#1E2533] rounded-2xl group hover:border-white/10 transition-all duration-300">
            <div className="flex justify-between items-start mb-4">
                <button onClick={onUserClick} className="text-left group/user outline-none">
                    <h4 className="text-sm font-bold text-white leading-none capitalize group-hover/user:text-primary-orange transition-colors">{user?.username || 'Unknown'}</h4>
                    <p className="text-[10px] text-slate-500 font-bold mt-1.5">{new Date(withdrawal.createdAt).toLocaleString()}</p>
                </button>
                <span className="text-sm font-black text-primary-orange font-mono">{withdrawal.currency} {withdrawal.amount.toLocaleString()}</span>
            </div>

            <div className="space-y-2 mb-5 font-mono text-[11px]">
                <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-sans font-medium">Method</span>
                    <span className="text-slate-300 font-bold uppercase tracking-wider">{withdrawal.phoneNumber ? 'MPESA' : 'CRYPTO'}</span>
                </div>
                {withdrawal.phoneNumber && (
                    <div className="flex items-center justify-between">
                        <span className="text-slate-500 font-sans font-medium">Number</span>
                        <span className="text-slate-300 font-bold">{withdrawal.phoneNumber}</span>
                    </div>
                )}
                {withdrawal.toAddress && (
                    <div className="flex flex-col gap-1.5">
                        <span className="text-slate-500 font-sans font-medium">Address</span>
                        <span className="text-slate-400 break-all bg-[#07090E] p-2 rounded-lg border border-[#1E2533] text-[10px]">{withdrawal.toAddress}</span>
                    </div>
                )}
            </div>

            <div className="flex gap-2">
                <button
                    onClick={onApprove}
                    disabled={processing}
                    className="flex-1 py-2 bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-400 font-black text-[9px] uppercase tracking-[0.15em] rounded-lg border border-emerald-500/20 transition-all flex items-center justify-center gap-1.5"
                >
                    {processing ? <Loader2 className="animate-spin" size={12} /> : null}
                    Approve
                </button>
                <button
                    onClick={onReject}
                    disabled={processing}
                    className="flex-1 py-2 bg-rose-600/10 hover:bg-rose-600/20 text-rose-400 font-black text-[9px] uppercase tracking-[0.15em] rounded-lg border border-rose-500/20 transition-all"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-300 font-sans">
            <div className="bg-[#0D1017] border border-[#1E2533] rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl animate-in slide-in-from-bottom-4 duration-500">
                <div className="p-6 border-b border-[#1E2533] flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-bold text-white uppercase tracking-wider">Transaction Details</h3>
                        <p className="text-xs text-slate-500 mt-1 font-mono">{tx._id}</p>
                    </div>
                    <button onClick={onClose} className="p-2 text-slate-500 hover:text-white transition-colors text-xl font-bold">&times;</button>
                </div>
                <div className="p-6 overflow-y-auto max-h-[70vh] space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-1.5">Status</p>
                            <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${tx.status === 'SUCCESS' ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' :
                                tx.status === 'PENDING' ? 'text-amber-400 bg-amber-500/10 border-amber-500/20' : 'text-rose-400 bg-rose-500/10 border-rose-500/20'
                                }`}>
                                {tx.status}
                            </div>
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-1.5">Created At</p>
                            <p className="text-sm font-bold text-white">{new Date(tx.createdAt).toLocaleString()}</p>
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-1.5">Amount</p>
                            <p className="text-2xl font-black text-primary-orange font-mono">{tx.currency} {tx.amount.toLocaleString()}</p>
                            {tx.fee && <p className="text-[10px] text-slate-500 font-bold font-mono mt-1">Fee: {tx.currency} {tx.fee}</p>}
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-1.5">Transaction Type</p>
                            <p className="text-sm font-black text-slate-300 uppercase tracking-wider">{tx.type}</p>
                        </div>
                    </div>

                    <div className="bg-[#07090E]/40 rounded-2xl p-5 border border-[#1E2533] shadow-inner">
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Technical Information</p>
                        <div className="space-y-3 font-mono text-[11px]">
                            <div className="flex justify-between py-1 border-b border-[#1E2533]">
                                <span className="text-slate-500 font-sans">User Details</span>
                                <span className="text-slate-300 font-sans font-bold capitalize">{tx.userId?.username || 'System'}</span>
                            </div>
                            {tx.mpesaReceiptNumber && (
                                <div className="flex justify-between py-1 border-b border-[#1E2533]">
                                    <span className="text-slate-500 font-sans">M-Pesa Receipt Code</span>
                                    <span className="text-emerald-400 font-bold">{tx.mpesaReceiptNumber}</span>
                                </div>
                            )}
                            {tx.phoneNumber && (
                                <div className="flex justify-between py-1 border-b border-[#1E2533]">
                                    <span className="text-slate-500 font-sans">Phone Number</span>
                                    <span className="text-slate-300 font-bold">{tx.phoneNumber}</span>
                                </div>
                            )}
                            {tx.toAddress && (
                                <div className="flex flex-col gap-1.5 py-1 border-b border-[#1E2533]">
                                    <span className="text-slate-500 font-sans">Crypto Address</span>
                                    <span className="text-primary-orange break-all bg-[#07090E] p-2 rounded-lg border border-[#1E2533]">{tx.toAddress}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
                <div className="p-6 border-t border-[#1E2533] flex justify-end gap-3 bg-[#07090E]">
                    <button onClick={onClose} className="px-6 py-2.5 bg-primary-orange hover:bg-primary-orange-hover text-white text-xs font-black rounded-xl transition-all shadow-lg shadow-primary-orange/20 uppercase tracking-widest">Close</button>
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
        <div className="fixed inset-0 z-50 overflow-hidden flex justify-end animate-in fade-in duration-300 font-sans">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={onClose} />
            <div className="relative w-full max-w-xl bg-[#0D1017] shadow-2xl border-l border-[#1E2533] flex flex-col h-full animate-in slide-in-from-right duration-500">
                <div className="p-6 border-b border-[#1E2533] flex items-center justify-between">
                    <h3 className="text-base font-bold text-white uppercase tracking-wider">User Financial Profile</h3>
                    <button onClick={onClose} className="p-2 text-slate-500 hover:text-white transition-colors text-xl font-bold">&times;</button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
                    {loading ? (
                        <div className="h-full flex items-center justify-center"><Loader2 className="animate-spin text-primary-orange" size={36} /></div>
                    ) : (
                        <>
                            <div className="flex items-center gap-4">
                                <div className="w-16 h-16 rounded-2xl bg-[#07090E] border border-[#1E2533] flex items-center justify-center text-2xl font-black text-primary-orange capitalize shadow-inner">
                                    {(userData?.user?.username || initialUser.username)?.charAt(0)}
                                </div>
                                <div>
                                    <h4 className="text-xl font-black text-white capitalize leading-tight">{userData?.user?.username || initialUser.username}</h4>
                                    <p className="text-slate-500 font-medium mt-0.5">{userData?.user?.email || initialUser.email}</p>
                                </div>
                            </div>
 
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 bg-[#07090E]/40 border border-[#1E2533] rounded-2xl shadow-inner font-mono">
                                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1 font-sans">KES Balance</p>
                                    <p className="text-lg font-black text-white">{(userData?.wallet?.kesBalance || 0).toLocaleString()} KES</p>
                                </div>
                                <div className="p-4 bg-[#07090E]/40 border border-[#1E2533] rounded-2xl shadow-inner font-mono">
                                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1 font-sans">USDT Balance</p>
                                    <p className="text-lg font-black text-primary-orange">{(userData?.wallet?.usdtBalance || 0).toLocaleString()} USDT</p>
                                </div>
                            </div>

                            <div>
                                <h5 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Recent Transactions</h5>
                                <div className="space-y-2 font-mono">
                                    {userTxs.map((tx: any) => (
                                        <div key={tx._id} className="p-3 bg-[#07090E]/20 border border-[#1E2533] rounded-xl flex items-center justify-between shadow-sm">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${tx.type === 'DEPOSIT' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-primary-orange-light text-primary-orange'
                                                    }`}>
                                                    {tx.type === 'DEPOSIT' ? <ArrowDownRight size={14} /> : <ArrowUpRight size={14} />}
                                                </div>
                                                <div>
                                                    <p className="text-xs font-bold text-white leading-none mb-1 font-sans">{tx.type}</p>
                                                    <p className="text-[9px] text-slate-500">{new Date(tx.createdAt).toLocaleDateString()}</p>
                                                </div>
                                            </div>
                                            <span className={`text-xs font-black ${tx.type === 'DEPOSIT' ? 'text-emerald-400' : 'text-primary-orange'}`}>
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
