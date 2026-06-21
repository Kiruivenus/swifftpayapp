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
        <div className="min-h-screen bg-[#050816] text-[#F3F4F6] flex flex-col justify-center items-center px-4 sm:px-6 relative overflow-hidden font-sans selection:bg-[#FF6B00]/30">
            
            {/* Sticky Header */}
            <header className="fixed top-0 left-0 w-full h-[70px] md:h-[80px] z-50 bg-[#050816]/75 backdrop-blur-md border-b border-[#1E2533]/40 flex items-center justify-between px-6">
              <div className="flex items-center gap-3">
                <Link href="/forgot-password" className="flex items-center justify-center text-slate-400 hover:text-white transition-colors bg-[#0D1017]/80 w-8 h-8 rounded-lg border border-[#1E2533]/50" title="Back">
                  <ArrowLeft size={16} />
                </Link>
                <Link href="/" className="flex items-center gap-3 group cursor-pointer">
                  <img src="/logo.png" alt="SwiftPay Logo" className="w-8 h-8 object-contain rounded-xl shadow-lg shadow-[#FF6B00]/10 group-hover:scale-105 transition-transform" />
                  <span className="text-lg font-bold tracking-tight text-white">SwiftPay</span>
                </Link>
              </div>
              
              <Link href="/login" className="flex items-center gap-1.5 text-xs font-bold text-[#FF6B00] hover:text-[#FF7A00] transition-colors bg-[#0D1017]/80 px-3.5 py-1.5 rounded-lg border border-[#1E2533]/50">
                Login
              </Link>
            </header>

            {/* Ambient Background Glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-[400px] bg-[radial-gradient(circle_at_center,rgba(255,107,0,0.04)_0%,transparent_70%)] rounded-full -z-10 pointer-events-none" />

            <div className="w-full max-w-md pt-24 pb-10 space-y-6 z-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
                
                <div className="text-center space-y-1.5">
                    <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Verify Reset Code</h1>
                    <p className="text-slate-400 text-xs sm:text-sm">Enter the 6-digit code sent to your email</p>
                </div>

                <div className="bg-[#0D1017] border border-[#1E2533] rounded-[24px] p-6 sm:p-8 shadow-2xl relative overflow-hidden shadow-[#FF6B00]/5 hover:border-[#FF6B00]/20 transition-all">
                    {error && (
                        <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-center gap-3 text-rose-400 text-xs font-bold animate-in fade-in zoom-in-95">
                            <AlertCircle size={18} className="shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6 text-left">
                        <div className="space-y-4 text-center">
                            <div className="w-14 h-14 bg-[#FF6B00]/10 rounded-2xl flex items-center justify-center mx-auto mb-2 border border-[#FF6B00]/20 animate-pulse">
                                <KeyRound size={28} className="text-[#FF6B00]" />
                            </div>
                            <p className="text-slate-500 text-xs font-bold">Verification for: <span className="text-white font-bold">{email}</span></p>

                            <input
                                type="text"
                                maxLength={6}
                                placeholder="000000"
                                value={code}
                                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                                className="w-full px-4 py-4 mt-2 bg-[#050816] border border-[#1E2533] focus:border-[#FF6B00] rounded-xl text-white placeholder:text-slate-600 focus:outline-none transition-all font-black text-2xl tracking-[0.5em] text-center"
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading || code.length !== 6}
                            className="w-full py-4 bg-gradient-to-r from-[#FF6B00] to-orange-500 hover:from-orange-500 hover:to-[#FF6B00] disabled:bg-slate-800 disabled:text-slate-600 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-[#FF6B00]/10 hover:shadow-[#FF6B00]/25 transition-all hover:scale-[1.01]"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="animate-spin" size={18} />
                                    <span>Verifying code...</span>
                                </>
                            ) : (
                                <>
                                    <span>Verify Code</span>
                                    <ArrowRight size={18} />
                                </>
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default function VerifyResetCodePage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-[#050816] flex items-center justify-center"><Loader2 className="animate-spin text-[#FF6B00]" size={48} /></div>}>
            <VerifyResetCodeContent />
        </Suspense>
    );
}
