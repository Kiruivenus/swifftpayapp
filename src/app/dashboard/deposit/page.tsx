"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    ArrowLeft,
    Smartphone,
    CheckCircle2,
    XCircle,
    Loader2,
    Zap,
    HelpCircle
} from 'lucide-react';
import { useDashboard } from '@/components/layout/dashboard-context';

type DepositStep = 'FORM' | 'PROMPTED' | 'SUCCESS' | 'FAILED';

export default function DepositPage() {
    const { profile, refreshData } = useDashboard();
    const router = useRouter();

    const [amount, setAmount] = useState('');
    const [phone, setPhone] = useState(profile?.phone || '');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [step, setStep] = useState<DepositStep>('FORM');
    const [statusMessage, setStatusMessage] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        const numericAmount = parseFloat(amount);
        if (isNaN(numericAmount) || numericAmount < 10) {
            setError('Minimum deposit amount is 10 KES');
            return;
        }

        // M-Pesa phone validation (should be format 2547XXXXXXXX or 2541XXXXXXXX)
        let formattedPhone = phone.trim().replace(/\+/g, '');
        if (formattedPhone.startsWith('0')) {
            formattedPhone = '254' + formattedPhone.slice(1);
        }
        if (!/^254(7|1)\d{8}$/.test(formattedPhone)) {
            setError('Enter a valid M-Pesa phone number (e.g., 0712345678 or 254712345678)');
            return;
        }

        setLoading(true);

        try {
            const res = await fetch('/api/mpesa/stkpush', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    amount: numericAmount,
                    phoneNumber: formattedPhone,
                    userId: profile?.id
                })
            });

            const data = await res.json();

            if (data.success && data.CheckoutRequestID) {
                setStep('PROMPTED');
                pollTransactionStatus(data.CheckoutRequestID);
            } else {
                setError(data.message || 'M-Pesa STK Push initiation failed.');
            }
        } catch (err: any) {
            setError('M-Pesa service is temporarily unreachable. Try again.');
        } finally {
            setLoading(false);
        }
    };

    // Polling function
    const pollTransactionStatus = (checkoutRequestID: string) => {
        let attempts = 0;
        const maxAttempts = 24; // 24 * 2.5s = 60s total timeout
        
        const interval = setInterval(async () => {
            attempts++;
            if (attempts > maxAttempts) {
                clearInterval(interval);
                setStep('FAILED');
                setStatusMessage('Transaction verification timed out. If money was debited, it will reflect within 10 minutes.');
                return;
            }

            try {
                const res = await fetch(`/api/mpesa/status?checkoutRequestID=${checkoutRequestID}`);
                if (res.ok) {
                    const data = await res.json();
                    
                    if (data.status === 'SUCCESS') {
                        clearInterval(interval);
                        await refreshData(); // Refresh user balances
                        setStep('SUCCESS');
                        setStatusMessage(`Successfully deposited ${parseFloat(amount).toLocaleString()} KES into your wallet.`);
                    } else if (data.status === 'FAILED') {
                        clearInterval(interval);
                        setStep('FAILED');
                        setStatusMessage('M-Pesa prompt was rejected or failed. Please try again.');
                    }
                }
            } catch (err) {
                console.error("Error polling M-Pesa status:", err);
            }
        }, 2500);
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
                    <h1 className="text-xl font-black tracking-tight">Deposit Cash</h1>
                    <p className="text-xs text-slate-500">Fund your KES Wallet instantly via M-Pesa</p>
                </div>
            </div>

            {/* Error alerts */}
            {error && (
                <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-center gap-3 text-rose-400 text-xs font-bold animate-in fade-in zoom-in-95">
                    <XCircle size={18} />
                    {error}
                </div>
            )}

            {step === 'FORM' && (
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
                        {/* Amount */}
                        <div className="space-y-2">
                            <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider pl-1">Amount to Deposit (KES)</label>
                            <input
                                type="text"
                                placeholder="Min: 10 KES"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value.replace(/\D/g, ''))}
                                required
                                className="w-full px-4 py-4 bg-slate-950/50 border border-slate-800 rounded-2xl text-white placeholder:text-slate-600 focus:outline-none focus:border-orange-500 transition-all font-black text-2xl"
                            />
                        </div>

                        {/* Phone */}
                        <div className="space-y-2">
                            <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider pl-1">M-Pesa Phone Number</label>
                            <input
                                type="text"
                                placeholder="e.g. 0712345678"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value.replace(/[^\d+]/g, ''))}
                                required
                                className="w-full px-4 py-4 bg-slate-950/50 border border-slate-800 rounded-2xl text-white placeholder:text-slate-600 focus:outline-none focus:border-orange-500 transition-all font-bold text-sm"
                            />
                        </div>
                    </div>

                    {/* Guidelines */}
                    <div className="flex gap-3 p-4 bg-orange-600/5 border border-orange-500/10 rounded-2xl">
                        <Zap size={16} className="text-orange-500 shrink-0 mt-0.5 animate-pulse" />
                        <p className="text-[10px] text-slate-500 leading-relaxed">
                            Once triggered, you will receive an M-Pesa STK push prompt on your mobile phone requesting you to input your M-Pesa PIN to complete the transaction.
                        </p>
                    </div>

                    <button
                        type="submit"
                        disabled={loading || !amount || !phone}
                        className="w-full py-4 bg-orange-600 hover:bg-orange-500 disabled:bg-slate-850 disabled:text-slate-600 text-white font-black rounded-2xl flex items-center justify-center gap-2 transition-all shadow-xl shadow-orange-600/10 text-xs uppercase tracking-widest"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="animate-spin" size={16} />
                                <span>Sending STK Prompt...</span>
                            </>
                        ) : 'Initiate Deposit'}
                    </button>
                </form>
            )}

            {step === 'PROMPTED' && (
                <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8 text-center space-y-6 py-12 animate-in zoom-in-95">
                    <div className="relative w-20 h-20 mx-auto">
                        <div className="absolute inset-0 border-4 border-orange-600/20 rounded-full" />
                        <div className="absolute inset-0 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
                        <div className="absolute inset-0 flex items-center justify-center text-orange-400">
                            <Smartphone size={32} />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <h3 className="font-black text-base text-white">Prompt Sent to Mobile</h3>
                        <p className="text-xs text-slate-400 leading-relaxed max-w-xs mx-auto">
                            Please check your phone for the M-Pesa push popup. Enter your PIN to approve the KES {parseFloat(amount).toLocaleString()} deposit.
                        </p>
                        <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest pt-2">Waiting for confirmation...</p>
                    </div>
                </div>
            )}

            {step === 'SUCCESS' && (
                <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8 text-center space-y-6 py-12 animate-in zoom-in-95">
                    <div className="w-20 h-20 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/5">
                        <CheckCircle2 size={40} />
                    </div>
                    <div className="space-y-2">
                        <h3 className="font-black text-lg text-white">Payment Confirmed!</h3>
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

            {step === 'FAILED' && (
                <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8 text-center space-y-6 py-12 animate-in zoom-in-95">
                    <div className="w-20 h-20 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-rose-500/5">
                        <XCircle size={40} />
                    </div>
                    <div className="space-y-2">
                        <h3 className="font-black text-lg text-rose-500">Deposit Failed</h3>
                        <p className="text-xs text-slate-400 leading-relaxed max-w-xs mx-auto">{statusMessage}</p>
                    </div>
                    <div className="flex gap-4 justify-center pt-2">
                        <button
                            onClick={() => setStep('FORM')}
                            className="px-6 py-3 bg-orange-600 hover:bg-orange-500 text-white font-black text-xs rounded-xl shadow-md transition-all uppercase tracking-widest"
                        >
                            Try Again
                        </button>
                        <button
                            onClick={() => router.push('/dashboard')}
                            className="px-6 py-3 bg-slate-950 hover:bg-slate-850 text-slate-400 font-bold text-xs rounded-xl border border-slate-850 transition-all uppercase"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
