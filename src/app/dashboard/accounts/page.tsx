"use client";

import React, { useState, useEffect } from 'react';
import {
    CreditCard,
    Smartphone,
    Building2,
    Plus,
    CheckCircle2,
    AlertCircle,
    Trash2,
    X,
    Loader2
} from 'lucide-react';
import { useDashboard } from '@/components/layout/dashboard-context';

interface LinkedBank {
    id: string;
    bankName: string;
    accountNumber: string;
    accountName: string;
}

export default function MyAccountsPage() {
    const { profile, balance } = useDashboard();
    const [linkedBanks, setLinkedBanks] = useState<LinkedBank[]>([]);
    const [showAddBank, setShowAddBank] = useState(false);
    const [bankName, setBankName] = useState('');
    const [accountNumber, setAccountNumber] = useState('');
    const [accountName, setAccountName] = useState('');
    const [adding, setAdding] = useState(false);

    const kenyanBanks = [
        'NCBA Bank',
        'Equity Bank',
        'KCB Bank',
        'Co-operative Bank',
        'Absa Bank Kenya',
        'Standard Chartered'
    ];

    // Load user's saved bank accounts persistently
    useEffect(() => {
        if (profile?.id) {
            const saved = localStorage.getItem(`swiftpay_banks_${profile.id}`);
            if (saved) {
                setLinkedBanks(JSON.parse(saved));
            }
        }
    }, [profile]);

    const handleAddBank = (e: React.FormEvent) => {
        e.preventDefault();
        if (!bankName || !accountNumber || !accountName) return;

        setAdding(true);
        setTimeout(() => {
            const newBank: LinkedBank = {
                id: Math.random().toString(36).slice(2, 9),
                bankName,
                accountNumber,
                accountName
            };

            const updated = [...linkedBanks, newBank];
            setLinkedBanks(updated);
            if (profile?.id) {
                localStorage.setItem(`swiftpay_banks_${profile.id}`, JSON.stringify(updated));
            }

            // Reset Form
            setBankName('');
            setAccountNumber('');
            setAccountName('');
            setShowAddBank(false);
            setAdding(false);
        }, 800);
    };

    const handleDeleteBank = (id: string) => {
        const updated = linkedBanks.filter(b => b.id !== id);
        setLinkedBanks(updated);
        if (profile?.id) {
            localStorage.setItem(`swiftpay_banks_${profile.id}`, JSON.stringify(updated));
        }
    };

    return (
        <div className="space-y-6">
            {/* 1. Page Header */}
            <div>
                <h1 className="text-xl font-black tracking-tight">My Accounts</h1>
                <p className="text-xs text-slate-500">Manage your connected wallets and banks</p>
            </div>

            {/* 2. Wallet Balances */}
            <div className="space-y-3">
                <h2 className="text-xs font-black uppercase tracking-wider text-slate-400 px-1">Wallet Accounts</h2>
                
                <div className="grid grid-cols-1 gap-3">
                    {/* KES Wallet */}
                    <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-orange-600/10 rounded-xl flex items-center justify-center text-orange-400 font-bold text-sm">
                                KES
                            </div>
                            <div>
                                <h3 className="font-bold text-xs text-white">Kenya Shilling Wallet</h3>
                                <p className="text-[10px] text-slate-500 mt-0.5">Primary Local Currency</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <h4 className="font-black text-xs text-white">
                                {balance?.kesBalance.toLocaleString('en-KE', { minimumFractionDigits: 2 })} KES
                            </h4>
                            <span className="text-[8px] font-black uppercase bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded inline-block mt-1">
                                {profile?.status || 'ACTIVE'}
                            </span>
                        </div>
                    </div>

                    {/* USDT Wallet */}
                    <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-orange-600/10 rounded-xl flex items-center justify-center text-orange-400 font-bold text-xs">
                                USDT
                            </div>
                            <div>
                                <h3 className="font-bold text-xs text-white">Tether USDT Wallet</h3>
                                <p className="text-[10px] text-slate-500 mt-0.5">Decentralized Asset (TRC20)</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <h4 className="font-black text-xs text-white">
                                {balance?.usdtBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })} USDT
                            </h4>
                            <span className="text-[8px] font-black uppercase bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded inline-block mt-1">
                                {profile?.status || 'ACTIVE'}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* 3. Mobile Money Link (M-Pesa) */}
            <div className="space-y-3">
                <h2 className="text-xs font-black uppercase tracking-wider text-slate-400 px-1">Linked Mobile Money</h2>
                
                <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-emerald-500/10 text-emerald-400 rounded-xl flex items-center justify-center">
                            <Smartphone size={20} />
                        </div>
                        <div>
                            <h3 className="font-bold text-xs text-white">Safaricom M-Pesa</h3>
                            <p className="text-[10px] text-slate-500 mt-0.5">Active for deposits & withdrawals</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <h4 className="font-black text-xs text-white">{profile?.phone || 'No phone'}</h4>
                        <span className="text-[8px] font-black uppercase bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded inline-block mt-1">
                            VERIFIED
                        </span>
                    </div>
                </div>
            </div>

            {/* 4. Connected Banks */}
            <div className="space-y-3">
                <div className="flex items-center justify-between px-1">
                    <h2 className="text-xs font-black uppercase tracking-wider text-slate-400">Connected Bank Accounts</h2>
                    <button
                        onClick={() => setShowAddBank(true)}
                        className="text-orange-400 hover:text-orange-300 text-xs font-black flex items-center gap-1"
                    >
                        <Plus size={14} /> Add Bank
                    </button>
                </div>

                {linkedBanks.length === 0 ? (
                    <div className="p-6 bg-slate-900/40 border border-slate-800 rounded-2xl text-center space-y-3">
                        <div className="w-12 h-12 bg-slate-850 rounded-full flex items-center justify-center mx-auto text-slate-500">
                            <Building2 size={24} />
                        </div>
                        <div className="space-y-1">
                            <h3 className="font-bold text-xs text-white">No banks connected</h3>
                            <p className="text-[10px] text-slate-500 max-w-xs mx-auto">Link your Kenyan bank account (NCBA, Equity, KCB) for instant local payouts.</p>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {linkedBanks.map((bank) => (
                            <div
                                key={bank.id}
                                className="p-4 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-between gap-4 animate-in fade-in"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-slate-850 text-slate-400 rounded-xl flex items-center justify-center">
                                        <Building2 size={20} />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-xs text-white">{bank.bankName}</h3>
                                        <p className="text-[10px] text-slate-500 mt-0.5">Acc: •••• {bank.accountNumber.slice(-4)} | {bank.accountName}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleDeleteBank(bank.id)}
                                    className="p-2 hover:bg-rose-500/10 text-slate-500 hover:text-rose-400 rounded-xl transition-all"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Link Bank Modal Sheet */}
            {showAddBank && (
                <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-end justify-center p-4 animate-in fade-in duration-200">
                    <div className="w-full max-w-md bg-slate-900 border border-slate-850 rounded-[2.5rem] p-6 space-y-6 shadow-2xl animate-in slide-in-from-bottom-6 duration-300">
                        <div className="flex justify-between items-center">
                            <div>
                                <h3 className="font-black text-sm text-white">Link Bank Account</h3>
                                <p className="text-[10px] text-slate-500">Add a bank for settlement processing</p>
                            </div>
                            <button
                                onClick={() => setShowAddBank(false)}
                                className="w-8 h-8 rounded-full bg-slate-850 flex items-center justify-center text-slate-400 hover:text-white"
                            >
                                <X size={16} />
                            </button>
                        </div>

                        <form onSubmit={handleAddBank} className="space-y-4">
                            {/* Bank Select */}
                            <div className="space-y-2">
                                <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider pl-1">Bank Name</label>
                                <select
                                    value={bankName}
                                    onChange={(e) => setBankName(e.target.value)}
                                    required
                                    className="w-full px-4 py-3.5 bg-slate-950/50 border border-slate-800 rounded-2xl text-white placeholder:text-slate-600 focus:outline-none focus:border-orange-500 transition-all font-medium text-xs"
                                >
                                    <option value="" className="bg-slate-900 text-slate-500">Select Bank</option>
                                    {kenyanBanks.map(b => (
                                        <option key={b} value={b} className="bg-slate-900 text-white">{b}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Account Name */}
                            <div className="space-y-2">
                                <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider pl-1">Account Holder Name</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Patrick Kamau"
                                    value={accountName}
                                    onChange={(e) => setAccountName(e.target.value)}
                                    required
                                    className="w-full px-4 py-3.5 bg-slate-950/50 border border-slate-800 rounded-2xl text-white placeholder:text-slate-600 focus:outline-none focus:border-orange-500 transition-all font-medium text-xs"
                                />
                            </div>

                            {/* Account Number */}
                            <div className="space-y-2">
                                <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider pl-1">Account Number</label>
                                <input
                                    type="text"
                                    placeholder="e.g. 1002498244"
                                    value={accountNumber}
                                    onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, ''))}
                                    required
                                    className="w-full px-4 py-3.5 bg-slate-950/50 border border-slate-800 rounded-2xl text-white placeholder:text-slate-600 focus:outline-none focus:border-orange-500 transition-all font-medium text-xs"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={adding}
                                className="w-full py-4 bg-orange-600 hover:bg-orange-500 disabled:bg-slate-850 disabled:text-slate-600 text-white font-black rounded-2xl flex items-center justify-center gap-2 transition-all shadow-xl shadow-orange-600/10 text-xs uppercase tracking-widest mt-6"
                            >
                                {adding ? <Loader2 className="animate-spin" size={16} /> : 'Securely Link Account'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
