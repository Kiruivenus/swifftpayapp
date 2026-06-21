'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Mail, ArrowRight, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const res = await fetch('/api/auth/forgot-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });

            const data = await res.json();
            if (data.ok) {
                setSuccess(true);
            } else {
                setError(data.message || 'Something went wrong');
            }
        } catch (err) {
            setError('Failed to request password reset. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#050816] text-[#F3F4F6] flex flex-col justify-center items-center px-4 sm:px-6 relative overflow-hidden font-sans selection:bg-[#FF6B00]/30">
            
            {/* Sticky Header */}
            <header className="fixed top-0 left-0 w-full h-[70px] md:h-[80px] z-50 bg-[#050816]/75 backdrop-blur-md border-b border-[#1E2533]/40 flex items-center justify-between px-6">
              <Link href="/" className="flex items-center gap-3 group cursor-pointer">
                <img src="/logo.png" alt="SwiftPay Logo" className="w-8 h-8 object-contain rounded-xl shadow-lg shadow-[#FF6B00]/10 group-hover:scale-105 transition-transform" />
                <span className="text-lg font-bold tracking-tight text-white">SwiftPay</span>
              </Link>
              
              <Link href="/login" className="flex items-center gap-1.5 text-xs font-bold text-[#FF6B00] hover:text-[#FF7A00] transition-colors bg-[#0D1017]/80 px-3.5 py-1.5 rounded-lg border border-[#1E2533]/50">
                Login
              </Link>
            </header>

            {/* Ambient Background Glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-[400px] bg-[radial-gradient(circle_at_center,rgba(255,107,0,0.04)_0%,transparent_70%)] rounded-full -z-10 pointer-events-none" />

            <div className="w-full max-w-md pt-24 pb-10 space-y-6 z-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
                
                <div className="text-center space-y-1.5">
                    <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Forgot Password?</h1>
                    <p className="text-slate-400 text-xs sm:text-sm">We will help you recover secure wallet access</p>
                </div>

                <div className="bg-[#0D1017] border border-[#1E2533] rounded-[24px] p-6 sm:p-8 shadow-2xl relative overflow-hidden shadow-[#FF6B00]/5 hover:border-[#FF6B00]/20 transition-all">
                    {error && (
                        <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-center gap-3 text-rose-400 text-xs font-bold animate-in fade-in zoom-in-95">
                            <AlertCircle size={18} className="shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}

                    {!success ? (
                        <form onSubmit={handleSubmit} className="space-y-5 text-left">
                            <div className="space-y-4">
                                <p className="text-slate-400 text-xs leading-relaxed px-1">
                                    Enter your registered email address and we'll send you a 6-digit code to reset your password.
                                </p>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Email Address</label>
                                    <div className="relative group">
                                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-[#FF6B00] transition-colors" size={18} />
                                        <input
                                            type="email"
                                            placeholder="name@company.com"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="w-full pl-11 pr-4 py-3.5 bg-[#050816] border border-[#1E2533] focus:border-[#FF6B00] focus:ring-1 focus:ring-[#FF6B00] rounded-xl text-white placeholder:text-slate-600 focus:outline-none transition-all font-medium text-sm"
                                            required
                                        />
                                    </div>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-4 mt-2 bg-gradient-to-r from-[#FF6B00] to-orange-500 hover:from-orange-500 hover:to-[#FF6B00] disabled:bg-slate-800 disabled:text-slate-600 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-[#FF6B00]/10 hover:shadow-[#FF6B00]/25 transition-all hover:scale-[1.01]"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="animate-spin" size={18} />
                                        <span>Requesting reset...</span>
                                    </>
                                ) : (
                                    <>
                                        <span>Reset Password</span>
                                        <ArrowRight size={18} />
                                    </>
                                )}
                            </button>
                        </form>
                    ) : (
                        <div className="text-center space-y-6 py-2 animate-in zoom-in-95">
                            <div className="w-14 h-14 bg-emerald-500/10 rounded-2xl flex items-center justify-center mx-auto mb-2 border border-emerald-500/20">
                                <CheckCircle2 size={28} className="text-emerald-400" />
                            </div>
                            <div className="space-y-2">
                                <h3 className="font-bold text-white text-base">Check your email</h3>
                                <p className="text-slate-400 text-xs leading-relaxed px-4">
                                    A 6-digit reset code has been sent to <br />
                                    <span className="text-white font-bold">{email}</span>
                                </p>
                            </div>
                            <Link 
                                href={`/verify-reset-code?email=${encodeURIComponent(email)}`} 
                                className="w-full py-4 bg-gradient-to-r from-[#FF6B00] to-orange-500 hover:from-orange-500 hover:to-[#FF6B00] text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-[#FF6B00]/10 hover:shadow-[#FF6B00]/25 transition-all hover:scale-[1.01]"
                            >
                                <span>Enter Reset Code</span>
                                <ArrowRight size={18} />
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
