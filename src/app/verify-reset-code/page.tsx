'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { KeyRound, ArrowRight, Loader2, ArrowLeft, AlertCircle } from 'lucide-react';

function VerifyResetCodeContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const email = searchParams.get('email') || '';

    const [code, setCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!email) {
            router.push('/forgot-password');
        }
    }, [email, router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const res = await fetch('/api/auth/verify-reset-code', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, code }),
            });

            const data = await res.json();
            if (data.ok && data.resetToken) {
                router.push(`/new-password?email=${encodeURIComponent(email)}&token=${data.resetToken}`);
            } else {
                setError(data.message || 'Invalid or expired code');
            }
        } catch (err) {
            setError('Verification failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 selection:bg-rose-500/30">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-[400px] bg-rose-600/10 blur-[100px] rounded-full -z-10" />

            <div className="w-full max-w-md space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className="text-center space-y-4">
                    <Link href="/forgot-password" className="inline-flex items-center gap-2 text-slate-500 hover:text-white transition-colors text-sm font-bold mb-4">
                        <ArrowLeft size={16} /> Back
                    </Link>
                    <h1 className="text-2xl font-bold tracking-tight">Verify Reset Code</h1>
                    <p className="text-slate-500 text-sm italic">Enter the 6-digit code sent to your email.</p>
                </div>

                <div className="bg-slate-900/50 border border-slate-800 rounded-[2rem] p-8 backdrop-blur-xl shadow-2xl relative overflow-hidden">
                    {error && (
                        <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-center gap-3 text-rose-400 text-sm font-bold animate-in fade-in zoom-in-95">
                            <AlertCircle size={18} />
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-4 text-center">
                            <div className="w-16 h-16 bg-rose-500/10 rounded-2xl flex items-center justify-center mx-auto mb-2 border border-rose-500/20">
                                <KeyRound size={32} className="text-rose-400" />
                            </div>
                            <p className="text-slate-500 text-xs">Verification for: <span className="text-white font-bold">{email}</span></p>

                            <input
                                type="text"
                                maxLength={6}
                                placeholder="000000"
                                value={code}
                                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                                className="w-full px-4 py-4 bg-slate-950/50 border border-slate-800 rounded-2xl text-white placeholder:text-slate-600 focus:outline-none focus:border-rose-500 transition-all font-black text-3xl tracking-[0.5em] text-center"
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading || code.length !== 6}
                            className="w-full py-4 bg-rose-600 hover:bg-rose-500 disabled:bg-slate-800 disabled:text-slate-600 text-white font-black rounded-2xl flex items-center justify-center gap-3 transition-all shadow-xl shadow-rose-600/20"
                        >
                            {loading ? <Loader2 className="animate-spin" size={20} /> : <>Verify Code <ArrowRight size={20} /></>}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default function VerifyResetCodePage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-slate-950 flex items-center justify-center"><Loader2 className="animate-spin text-rose-500" size={48} /></div>}>
            <VerifyResetCodeContent />
        </Suspense>
    );
}
