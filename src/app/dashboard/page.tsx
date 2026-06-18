"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import {
    Eye,
    EyeOff,
    ArrowUpRight,
    ArrowDownLeft,
    RefreshCw,
    Plus,
    Clock,
    ArrowRight,
    QrCode
} from 'lucide-react';
import { useDashboard } from '@/components/layout/dashboard-context';

export default function DashboardHome() {
    const { profile, balance } = useDashboard();
    const [hideBalance, setHideBalance] = useState(false);
    const [activeCard, setActiveCard] = useState<'KES' | 'USDT'>('KES');
    const [transactions, setTransactions] = useState<any[]>([]);
    const [loadingTx, setLoadingTx] = useState(true);

    // Fetch transactions
    React.useEffect(() => {
        const fetchTx = async () => {
            try {
                const res = await fetch('/api/user/transactions');
                if (res.ok) {
                    const data = await res.json();
                    setTransactions(data.slice(0, 5)); // Keep only latest 5
                }
            } catch (err) {
                console.error("Failed to fetch transactions", err);
            } finally {
                setLoadingTx(false);
            }
        };
        fetchTx();
    }, []);

    // Format helper for numbers
    const formatCurrency = (val: number | undefined, currency: string) => {
        if (hideBalance) return "••••••";
        if (val === undefined) return "0.00";
        return val.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " " + currency;
    };

    // Helper to get transaction details
    const getTxDetails = (tx: any) => {
        switch (tx.type) {
            case 'DEPOSIT':
                return {
                    label: 'Deposit M-Pesa',
                    icon: ArrowDownLeft,
                    color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/10',
                    desc: tx.phoneNumber ? `From ${tx.phoneNumber}` : 'M-Pesa Deposit'
                };
            case 'WITHDRAW':
                return {
                    label: 'Withdrawal',
                    icon: ArrowUpRight,
                    color: 'text-rose-400 bg-rose-500/10 border-rose-500/10',
                    desc: tx.phoneNumber ? `To ${tx.phoneNumber}` : 'M-Pesa Cashout'
                };
            case 'TRANSFER':
            case 'TRANSFER_SEND':
                return {
                    label: 'Transfer Sent',
                    icon: ArrowUpRight,
                    color: 'text-orange-400 bg-orange-500/10 border-orange-500/10',
                    desc: tx.recipient ? `To ${tx.recipient}` : 'Transfer Send'
                };
            case 'TRANSFER_RECEIVE':
                return {
                    label: 'Transfer Received',
                    icon: ArrowDownLeft,
                    color: 'text-teal-400 bg-teal-500/10 border-teal-500/10',
                    desc: tx.sender ? `From ${tx.sender}` : 'Transfer Receive'
                };
            case 'CONVERT':
                return {
                    label: 'Converted Fund',
                    icon: RefreshCw,
                    color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/10',
                    desc: `KES ⇄ USDT Exchange`
                };
            default:
                return {
                    label: 'Transaction',
                    icon: Clock,
                    color: 'text-slate-400 bg-slate-500/10 border-slate-500/10',
                    desc: 'Processed'
                };
        }
    };

    return (
        <div className="space-y-6">
            {/* 1. Welcome & Privacy Switch */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-black tracking-tight">
                        Hello, {profile?.fullName ? profile.fullName.split(' ')[0] : 'SwiftPay User'}!
                    </h1>
                    <p className="text-xs text-slate-500">Fast digital payments in Kenya</p>
                </div>
                <button
                    onClick={() => setHideBalance(!hideBalance)}
                    className="w-10 h-10 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-white transition-all shadow-sm"
                >
                    {hideBalance ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
            </div>

            {/* 2. Swappable Wallet Cards */}
            <div className="space-y-3">
                {/* Tabs */}
                <div className="flex bg-slate-900/60 p-1 rounded-2xl border border-slate-850 max-w-[200px]">
                    <button
                        onClick={() => setActiveCard('KES')}
                        className={`flex-1 py-1.5 text-xs font-black rounded-xl transition-all ${activeCard === 'KES' ? 'bg-orange-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                        KES Wallet
                    </button>
                    <button
                        onClick={() => setActiveCard('USDT')}
                        className={`flex-1 py-1.5 text-xs font-black rounded-xl transition-all ${activeCard === 'USDT' ? 'bg-orange-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                        USDT Wallet
                    </button>
                </div>

                {/* Card View */}
                {activeCard === 'KES' ? (
                    <div className="relative bg-slate-900 border border-slate-800 rounded-[2.5rem] p-6 overflow-hidden shadow-2xl min-h-[180px] flex flex-col justify-between group">
                        <div className="absolute top-0 right-0 w-48 h-48 bg-orange-600/5 blur-[50px] rounded-full pointer-events-none -z-10 group-hover:bg-orange-600/10 transition-all duration-500" />
                        
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-none mb-1">KES Balance</p>
                                <h3 className="text-3xl font-black tracking-tight text-white transition-all">
                                    {formatCurrency(balance?.availableKesBalance, 'KES')}
                                </h3>
                            </div>
                            <span className="text-[10px] font-black bg-slate-850 px-2 py-1 rounded text-orange-400">AVAILABLE</span>
                        </div>

                        <div className="flex justify-between items-end border-t border-slate-800/60 pt-4 mt-6">
                            <div className="space-y-0.5">
                                <p className="text-[9px] font-bold text-slate-500 uppercase">Pending Cashout</p>
                                <p className="text-xs font-bold text-slate-400">
                                    {formatCurrency(balance?.pendingKES, 'KES')}
                                </p>
                            </div>
                            <div className="text-right space-y-0.5">
                                <p className="text-[9px] font-bold text-slate-500 uppercase">Total Portfolio KES</p>
                                <p className="text-xs font-black text-white">
                                    {formatCurrency(balance?.totalBalanceKES, 'KES')}
                                </p>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="relative bg-slate-900 border border-slate-800 rounded-[2.5rem] p-6 overflow-hidden shadow-2xl min-h-[180px] flex flex-col justify-between group">
                        <div className="absolute top-0 right-0 w-48 h-48 bg-orange-600/10 blur-[50px] rounded-full pointer-events-none -z-10 group-hover:bg-orange-600/15 transition-all duration-500" />
                        
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-none mb-1">USDT Balance</p>
                                <h3 className="text-3xl font-black tracking-tight text-white transition-all">
                                    {formatCurrency(balance?.availableUsdtBalance, 'USDT')}
                                </h3>
                            </div>
                            <span className="text-[10px] font-black bg-slate-850 px-2 py-1 rounded text-orange-400">USDT (TRC20)</span>
                        </div>

                        <div className="flex justify-between items-end border-t border-slate-800/60 pt-4 mt-6">
                            <div className="space-y-0.5">
                                <p className="text-[9px] font-bold text-slate-500 uppercase">Pending Crypto</p>
                                <p className="text-xs font-bold text-slate-400">
                                    {formatCurrency(balance?.pendingUSDT, 'USDT')}
                                </p>
                            </div>
                            <div className="text-right space-y-0.5">
                                <p className="text-[9px] font-bold text-slate-500 uppercase">USDT Network</p>
                                <p className="text-xs font-black text-white">Tron TRC-20</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* 3. Action Cards Grid */}
            <div className="grid grid-cols-2 gap-4">
                <Link
                    href="/dashboard/deposit"
                    className="p-5 bg-slate-900/60 border border-slate-800 rounded-[2rem] flex flex-col justify-between hover:border-orange-500/30 hover:bg-slate-900 transition-all group min-h-[110px]"
                >
                    <div className="w-10 h-10 bg-orange-600/10 text-orange-400 rounded-2xl flex items-center justify-center group-hover:scale-105 transition-all">
                        <Plus size={20} />
                    </div>
                    <div className="space-y-0.5">
                        <h4 className="font-bold text-sm text-white">Add Money</h4>
                        <p className="text-[10px] text-slate-500">M-Pesa STK push deposit</p>
                    </div>
                </Link>

                <Link
                    href="/dashboard/receive"
                    className="p-5 bg-slate-900/60 border border-slate-800 rounded-[2rem] flex flex-col justify-between hover:border-orange-500/30 hover:bg-slate-900 transition-all group min-h-[110px]"
                >
                    <div className="w-10 h-10 bg-orange-600/10 text-orange-400 rounded-2xl flex items-center justify-center group-hover:scale-105 transition-all">
                        <QrCode size={18} />
                    </div>
                    <div className="space-y-0.5">
                        <h4 className="font-bold text-sm text-white">Receive USDT</h4>
                        <p className="text-[10px] text-slate-500">Show TRC20 QR Code</p>
                    </div>
                </Link>
            </div>

            {/* 4. Recent Transactions */}
            <div className="space-y-4">
                <div className="flex items-center justify-between px-1">
                    <h2 className="text-sm font-black uppercase tracking-wider text-slate-400">Recent Transactions</h2>
                    {transactions.length > 0 && (
                        <Link href="/dashboard/transactions" className="text-orange-400 hover:text-orange-300 text-xs font-bold flex items-center gap-1">
                            See All <ArrowRight size={14} />
                        </Link>
                    )}
                </div>

                {loadingTx ? (
                    <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-8 text-center text-xs text-slate-500">
                        Loading transaction history...
                    </div>
                ) : transactions.length === 0 ? (
                    <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-10 text-center space-y-2">
                        <p className="text-sm font-bold text-white">No transactions yet</p>
                        <p className="text-xs text-slate-500 max-w-xs mx-auto">Your transfer and M-Pesa deposit history will appear here once processed.</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {transactions.map((tx) => {
                            const details = getTxDetails(tx);
                            const Icon = details.icon;
                            const isNegative = tx.type === 'WITHDRAW' || tx.type === 'TRANSFER' || tx.type === 'TRANSFER_SEND';

                            return (
                                <div
                                    key={tx.id}
                                    className="p-4 bg-slate-900/50 border border-slate-800/80 rounded-2xl flex items-center justify-between gap-4"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${details.color}`}>
                                            <Icon size={18} />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-xs text-white leading-tight">{details.label}</h4>
                                            <p className="text-[10px] text-slate-500 mt-0.5 leading-none">{details.desc}</p>
                                        </div>
                                    </div>
                                    <div className="text-right shrink-0">
                                        <h5 className={`font-black text-xs ${isNegative ? 'text-rose-400' : 'text-emerald-400'}`}>
                                            {isNegative ? '-' : '+'}{tx.amount.toLocaleString()} {tx.currency}
                                        </h5>
                                        <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded ml-auto inline-block mt-1 ${
                                            tx.status === 'SUCCESS' ? 'bg-emerald-500/10 text-emerald-400' :
                                            tx.status === 'PENDING' ? 'bg-amber-500/10 text-amber-400' :
                                            'bg-rose-500/10 text-rose-400'
                                        }`}>
                                            {tx.status}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
