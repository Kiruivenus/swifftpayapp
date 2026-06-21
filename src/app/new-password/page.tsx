'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Lock, ArrowRight, Loader2, AlertCircle, ShieldCheck, Eye, EyeOff } from 'lucide-react';

function NewPasswordContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const email = searchParams.get('email') || '';
    const resetToken = searchParams.get('token') || '';

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!email || !resetToken) {
            router.push('/forgot-password');
        }
    }, [email, resetToken, router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (password.length < 8) {
            setError('Password must be at least 8 characters');
            return;
        }

        setLoading(true);

        try {
            const res = await fetch('/api/auth/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, resetToken, newPassword: password }),
            });

            const data = await res.json();
            if (data.ok) {
                // Success - redirect to login
                window.location.href = '/login?reset=success';
            } else {
                setError(data.message || 'Failed to reset password');
            }
        } catch (err) {
            setError('Something went wrong. Please try again.');
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
                    <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Set New Password</h1>
                    <p className="text-slate-400 text-xs sm:text-sm">Create a strong, secure password for your account</p>
                </div>

                <div className="bg-[#0D1017] border border-[#1E2533] rounded-[24px] p-6 sm:p-8 shadow-2xl relative overflow-hidden shadow-[#FF6B00]/5 hover:border-[#FF6B00]/20 transition-all">
                    {error && (
                        <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-center gap-3 text-rose-400 text-xs font-bold animate-in fade-in zoom-in-95">
                            <AlertCircle size={18} className="shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5 text-left">
                        <div className="space-y-4">
                            
                            {/* New Password */}
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">New Password</label>
                                <div className="relative group">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-[#FF6B00] transition-colors" size={18} />
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full pl-11 pr-11 py-3.5 bg-[#050816] border border-[#1E2533] focus:border-[#FF6B00] rounded-xl text-white placeholder:text-slate-600 focus:outline-none transition-all font-medium text-sm"
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-400 transition-colors"
                                    >
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>

                            {/* Confirm Password */}
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Confirm New Password</label>
                                <div className="relative group">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-[#FF6B00] transition-colors" size={18} />
                                    <input
                                        type={showConfirmPassword ? "text" : "password"}
                                        placeholder="••••••••"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className="w-full pl-11 pr-11 py-3.5 bg-[#050816] border border-[#1E2533] focus:border-[#FF6B00] rounded-xl text-white placeholder:text-slate-600 focus:outline-none transition-all font-medium text-sm"
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-400 transition-colors"
                                    >
                                        {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>

                            {/* Security Note */}
                            <div className="flex items-start gap-3 p-3 bg-[#050816] border border-[#1E2533] rounded-xl">
                                <ShieldCheck size={16} className="text-[#FF6B00] shrink-0 mt-0.5" />
                                <p className="text-[10px] text-slate-500 leading-relaxed">
                                    Passwords should be at least 8 characters long and unique to you.
                                </p>
                            </div>

                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={loading || !password}
                            className="w-full py-4 bg-gradient-to-r from-[#FF6B00] to-orange-500 hover:from-orange-500 hover:to-[#FF6B00] disabled:bg-slate-800 disabled:text-slate-600 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-[#FF6B00]/10 hover:shadow-[#FF6B00]/25 transition-all hover:scale-[1.01]"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="animate-spin" size={18} />
                                    <span>Updating password...</span>
                                </>
                            ) : (
                                <>
                                    <span>Update Password</span>
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

export default function NewPasswordPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-[#050816] flex items-center justify-center"><Loader2 className="animate-spin text-[#FF6B00]" size={48} /></div>}>
            <NewPasswordContent />
        </Suspense>
    );
}
