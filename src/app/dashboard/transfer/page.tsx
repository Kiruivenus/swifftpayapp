"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    ArrowLeft,
    Send,
    CheckCircle2,
    XCircle,
    Loader2,
    Lock,
    HelpCircle,
    UserCheck
} from 'lucide-react';
import { useDashboard } from '@/components/layout/dashboard-context';

export default function TransferPage() {
    const { profile, balance, refreshData } = useDashboard();
    const router = useRouter();

    const [currency, setCurrency] = useState<'KES' | 'USDT'>('KES');
    const [recipientEmail, setRecipientEmail] = useState('');
    const [amount, setAmount] = useState('');
    const [pin, setPin] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    
    // States for screen phases
    const [step, setStep] = useState<'FORM' | 'PIN_PROMPT' | 'SUCCESS' | 'FAILED'>('FORM');
    const [statusMessage, setStatusMessage] = useState('');

    const maxAvailable = currency === 'KES' ? balance?.availableKesBalance || 0 : balance?.availableUsdtBalance || 0;

    const handleInitiate = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        const numericAmount = parseFloat(amount);
        if (isNaN(numericAmount) || numericAmount <= 0) {
            setError('Please enter a valid transfer amount');
            return;
        }

        if (numericAmount > maxAvailable) {
            setError(`Insufficient balance. Max available: ${maxAvailable.toLocaleString()} ${currency}`);
            return;
        }

        if (!recipientEmail.includes('@')) {
            setError('Please enter a valid recipient email address');
            return;
        }

        if (recipientEmail.trim().toLowerCase() === profile?.email.toLowerCase()) {
            setError('You cannot send assets to your own email address');
            return;
        }

        // If user has a PIN set in the backend, prompt for it
        if (profile?.isPinSet) {
            setStep('PIN_PROMPT');
        } else {
            // Otherwise, execute directly
            executeTransfer();
        }
    };

    const executeTransfer = async () => {
        setLoading(true);
        setError('');

        try {
            const res = await fetch('/api/user/transfer', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    recipient: recipientEmail.trim().toLowerCase(),
                    recipient_type: 'EMAIL',
                    amount: parseFloat(amount),
                    currency,
                    pin: profile?.isPinSet ? pin : undefined
                })
            });

            const data = await res.json();

            if (res.ok) {
                await refreshData();
                setStep('SUCCESS');
                setStatusMessage(`Successfully sent ${parseFloat(amount).toLocaleString()} ${currency} to ${recipientEmail}.`);
            } else {
                setStep('FORM');
                setError(data.message || 'Transfer failed. Check credentials.');
            }
        } catch (err: any) {
            setStep('FORM');
            setError('Failed to reach SwiftPay network. Try again.');
        } finally {
            setLoading(false);
            setPin(''); // Reset PIN input
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3">
                <button
                    onClick={() => router.back()}
                    className="p-2 hover:bg-slate-900 rounded-xl transition-all"
                >
                    <ArrowLeft size={20} />
                </button>
                <div>
                    <h1 className="text-xl font-black tracking-tight">Send Assets</h1>
                    <p className="text-xs text-slate-500">Transfer KES or USDT instantly to any email</p>
                </div>
            </div>

            {error && (
                <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-center gap-3 text-rose-400 text-xs font-bold animate-in fade-in zoom-in-95">
                    <XCircle size={18} />
                    {error}
                </div>
            )}

            {step === 'FORM' && (
                <form onSubmit={handleInitiate} className="space-y-6">
                    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
                        {/* Currency Selector */}
                        <div className="space-y-2">
                            <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider pl-1">Select Asset</label>
                            <div className="flex bg-slate-950/60 p-1 rounded-2xl border border-slate-850">
                                <button
                                    type="button"
                                    onClick={() => { setCurrency('KES'); setAmount(''); }}
                                    className={`flex-1 py-3 text-xs font-black rounded-xl transition-all ${currency === 'KES' ? 'bg-orange-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-300'}`}
                                >
                                    KES Shilling
                                </button>
                                <button
                                    type="button"
                                    onClick={() => { setCurrency('USDT'); setAmount(''); }}
                                    className={`flex-1 py-3 text-xs font-black rounded-xl transition-all ${currency === 'USDT' ? 'bg-orange-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-300'}`}
                                >
                                    USDT stablecoin
                                </button>
                            </div>
                        </div>

                        {/* Recipient Email */}
                        <div className="space-y-2">
                            <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider pl-1">Recipient Email Address</label>
                            <input
                                type="email"
                                placeholder="recipient@swiftpay.ke"
                                value={recipientEmail}
                                onChange={(e) => setRecipientEmail(e.target.value)}
                                required
                                className="w-full px-4 py-3.5 bg-slate-950/50 border border-slate-800 rounded-2xl text-white placeholder:text-slate-600 focus:outline-none focus:border-orange-500 transition-all font-bold text-sm"
                            />
                        </div>

                        {/* Amount */}
                        <div className="space-y-2">
                            <div className="flex justify-between items-center px-1">
                                <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Amount to Transfer</label>
                                <span className="text-[10px] font-bold text-orange-400">
                                    Available: {maxAvailable.toLocaleString()} {currency}
                                </span>
                            </div>
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="0.00"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, ''))}
                                    required
                                    className="w-full pl-4 pr-16 py-4 bg-slate-950/50 border border-slate-800 rounded-2xl text-white placeholder:text-slate-600 focus:outline-none focus:border-orange-500 transition-all font-black text-xl"
                                />
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 font-bold text-xs text-slate-500 uppercase">
                                    {currency}
                                </div>
                            </div>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={!amount || !recipientEmail}
                        className="w-full py-4 bg-orange-600 hover:bg-orange-500 disabled:bg-slate-850 disabled:text-slate-600 text-white font-black rounded-2xl flex items-center justify-center gap-2 transition-all shadow-xl shadow-orange-600/10 text-xs uppercase tracking-widest"
                    >
                        Review Transfer
                    </button>
                </form>
            )}

            {/* PIN Prompt Modal Sheet */}
            {step === 'PIN_PROMPT' && (
                <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="w-full max-w-sm bg-slate-900 border border-slate-850 rounded-[2.5rem] p-6 text-center space-y-6 shadow-2xl animate-in zoom-in-95">
                        <div className="w-14 h-14 bg-orange-600/10 text-orange-400 rounded-2xl flex items-center justify-center mx-auto">
                            <Lock size={24} />
                        </div>
                        <div className="space-y-1">
                            <h3 className="font-black text-sm text-white">Enter Transaction PIN</h3>
                            <p className="text-[10px] text-slate-500">Provide your 4-digit PIN to authorize this transfer</p>
                        </div>

                        <div className="space-y-4">
                            <input
                                type="password"
                                maxLength={4}
                                placeholder="••••"
                                value={pin}
                                onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                                className="w-full px-4 py-4 bg-slate-950/50 border border-slate-800 rounded-2xl text-white placeholder:text-slate-600 focus:outline-none focus:border-orange-500 transition-all font-black text-2xl tracking-[1em] text-center"
                                required
                            />

                            <button
                                onClick={executeTransfer}
                                disabled={loading || pin.length !== 4}
                                className="w-full py-4 bg-orange-600 hover:bg-orange-500 disabled:bg-slate-850 disabled:text-slate-600 text-white font-black rounded-2xl flex items-center justify-center gap-2 transition-all text-xs uppercase tracking-widest"
                            >
                                {loading ? <Loader2 className="animate-spin" size={16} /> : 'Authorize Payment'}
                            </button>

                            <button
                                onClick={() => setStep('FORM')}
                                className="w-full text-xs font-bold text-slate-500 hover:text-white transition-colors"
                            >
                                Cancel & Review
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Success screen */}
            {step === 'SUCCESS' && (
                <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8 text-center space-y-6 py-12 animate-in zoom-in-95">
                    <div className="w-20 h-20 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/5">
                        <CheckCircle2 size={40} />
                    </div>
                    <div className="space-y-2">
                        <h3 className="font-black text-lg text-white">Transfer Successful!</h3>
                        <p className="text-xs text-slate-400 leading-relaxed max-w-xs mx-auto">{statusMessage}</p>
                    </div>
                    <button
                        onClick={() => router.push('/dashboard')}
                        className="px-8 py-3 bg-slate-950 hover:bg-slate-850 text-white font-black text-xs rounded-xl shadow-md border border-slate-850 transition-all uppercase tracking-widest pt-4"
                    >
                        Back to Home
                    </button>
                </div>
            )}
        </div>
    );
}
