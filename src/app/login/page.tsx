"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import {
    Mail,
    Lock,
    ArrowRight,
    ShieldCheck,
    AlertCircle,
    Smartphone,
    Loader2,
    Eye,
    EyeOff,
    Zap
} from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [show2FA, setShow2FA] = useState(false);
    const [twoFactorCode, setTwoFactorCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            const data = await res.json();

            if (data.status === '2FA_REQUIRED') {
                setShow2FA(true);
                setLoading(false);
                return;
            }

            if (data.token) {
                const userRole = (data.role || '').toLowerCase();
                if (userRole === 'admin' || userRole === 'superadmin' || userRole === 'manager') {
                    window.location.href = '/admin/dashboard';
                } else {
                    window.location.href = '/mobile-only';
                }
            } else {
                setError(data.message || 'Invalid credentials');
                setLoading(false);
            }
        } catch (err) {
            setError('Something went wrong. Please try again.');
            setLoading(false);
        }
    };

    const handleVerify2FA = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const res = await fetch('/api/auth/verify-2fa', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email,
                    code: twoFactorCode,
                    deviceInfo: {
                        name: typeof window !== 'undefined' ? navigator.userAgent : 'Web Browser',
                        platform: typeof window !== 'undefined' ? navigator.platform : 'Web'
                    }
                }),
            });

            const data = await res.json();
            if (data.ok) {
                const userRole = (data.role || '').toLowerCase();
                if (userRole === 'admin' || userRole === 'superadmin' || userRole === 'manager') {
                    window.location.href = '/admin/dashboard';
                } else {
                    window.location.href = '/mobile-only';
                }
            } else {
                setError(data.message || 'Invalid 2FA code');
                setLoading(false);
            }
        } catch (err) {
            setError('2FA verification failed');
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#050816] text-[#F3F4F6] flex flex-col lg:flex-row relative overflow-hidden font-sans selection:bg-[#FF6B00]/30">
            
            {/* Split Left Column: Desktop Brand Panel */}
            <div className="hidden lg:flex lg:w-[42%] bg-[#07090E] p-16 flex-col justify-between border-r border-[#1E2533]/40 relative overflow-hidden shrink-0">
                {/* Branding Logo */}
                <div className="flex items-center gap-3">
                    <img src="/logo.png" alt="SwiftPay Logo" className="w-9 h-9 object-contain rounded-xl shadow-lg shadow-[#FF6B00]/10" />
                    <span className="text-xl font-bold tracking-tight text-white">SwiftPay</span>
                </div>

                {/* Promotional Value Text */}
                <div className="space-y-6 max-w-sm my-auto">
                    <h2 className="text-4xl font-black tracking-tight text-white leading-tight">
                        The fastest way to <span className="text-[#FF6B00]">move money</span> across Africa.
                    </h2>
                    <p className="text-slate-400 text-sm leading-relaxed font-medium">
                        Send, receive, convert and spend KES, USD and USDT from one secure financial platform built for modern African businesses, creators, and remote teams.
                    </p>
                </div>

                {/* Trust Indicators (No emojis) */}
                <div className="space-y-3 border-t border-[#1E2533]/50 pt-8 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                    <div className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#FF6B00]" />
                        <span>Bank-Level Security</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#FF6B00]" />
                        <span>Encrypted Authentication</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#FF6B00]" />
                        <span>Instant Settlements</span>
                    </div>
                </div>

                {/* Ambient lights */}
                <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-[#FF6B00]/5 blur-3xl rounded-full pointer-events-none" />
                <div className="absolute -top-20 -right-20 w-80 h-80 bg-[#FF6B00]/5 blur-3xl rounded-full pointer-events-none" />
            </div>

            {/* Split Right Column: Authentication Card & Header */}
            <div className="w-full lg:w-[58%] flex flex-col justify-between min-h-screen relative">
                
                {/* Mobile Header (Hidden on Desktop) */}
                <header className="flex lg:hidden items-center justify-between w-full h-[70px] px-6 bg-[#050816]/75 backdrop-blur-md border-b border-[#1E2533]/40 z-50 fixed top-0 left-0">
                    <Link href="/" className="flex items-center gap-3 cursor-pointer">
                        <img src="/logo.png" alt="SwiftPay Logo" className="w-8 h-8 object-contain rounded-xl shadow-lg shadow-[#FF6B00]/10" />
                        <span className="text-lg font-bold tracking-tight text-white">SwiftPay</span>
                    </Link>
                    <Link href="/register" className="text-xs font-bold text-[#FF6B00] bg-[#0D1017]/80 px-3.5 py-1.5 rounded-lg border border-[#1E2533]/50">
                        Register
                    </Link>
                </header>

                {/* Desktop Top Header Bar (Redirection only) */}
                <div className="hidden lg:flex justify-end p-8">
                    <div className="flex items-center gap-3">
                        <span className="text-xs text-slate-500 font-medium">Don't have an account?</span>
                        <Link href="/register" className="text-xs font-bold text-[#FF6B00] hover:text-[#FF7A00] transition-colors bg-[#0D1017]/80 px-4 py-2 rounded-xl border border-[#1E2533]/50">
                            Create Account
                        </Link>
                    </div>
                </div>

                {/* Form Card */}
                <div className="flex-1 flex items-center justify-center p-6 md:p-12 pt-24 lg:pt-0">
                    <div className="w-full max-w-md space-y-6">
                        
                        {/* Welcome texts */}
                        <div className="text-center lg:text-left space-y-1.5">
                            <h1 className="text-3xl font-black text-white tracking-tight">Welcome Back</h1>
                            <p className="text-slate-400 text-xs sm:text-sm">Sign in to your account to continue</p>
                        </div>

                        {/* Login Form Panel */}
                        <div className="bg-[#0D1017] border border-[#1E2533] rounded-[24px] p-6 sm:p-8 shadow-2xl shadow-[#FF6B00]/2 hover:border-[#FF6B00]/20 transition-all">
                            
                            {error && (
                                <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-center gap-3 text-rose-400 text-xs font-bold animate-in fade-in zoom-in-95">
                                    <AlertCircle size={18} className="shrink-0" />
                                    <span>{error}</span>
                                </div>
                            )}

                            {!show2FA ? (
                                <form onSubmit={handleSubmit} className="space-y-5">
                                    <div className="space-y-4">
                                        
                                        {/* Email Address */}
                                        <div className="space-y-1.5 text-left">
                                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Email Address</label>
                                            <div className="relative group">
                                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-[#FF6B00] transition-colors" size={18} />
                                                <input
                                                    type="email"
                                                    placeholder="name@example.com"
                                                    value={email}
                                                    onChange={(e) => setEmail(e.target.value)}
                                                    className="w-full pl-11 pr-4 py-3.5 bg-[#050816] border border-[#1E2533] focus:border-[#FF6B00] focus:ring-1 focus:ring-[#FF6B00] rounded-xl text-white placeholder:text-slate-600 focus:outline-none transition-all font-medium text-sm"
                                                    required
                                                />
                                            </div>
                                        </div>

                                        {/* Password Field */}
                                        <div className="space-y-1.5 text-left">
                                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Password</label>
                                            <div className="relative group">
                                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-[#FF6B00] transition-colors" size={18} />
                                                <input
                                                    type={showPassword ? "text" : "password"}
                                                    placeholder="••••••••"
                                                    value={password}
                                                    onChange={(e) => setPassword(e.target.value)}
                                                    className="w-full pl-11 pr-11 py-3.5 bg-[#050816] border border-[#1E2533] focus:border-[#FF6B00] focus:ring-1 focus:ring-[#FF6B00] rounded-xl text-white placeholder:text-slate-600 focus:outline-none transition-all font-medium text-sm"
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
                                            <div className="flex justify-end px-1 pt-1">
                                                <Link href="/forgot-password" title="Go to Forgot Password" className="text-xs font-bold text-[#FF6B00] hover:text-[#FF7A00] transition-colors">
                                                    Forgot Password?
                                                </Link>
                                            </div>
                                        </div>

                                    </div>

                                    {/* Action button */}
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full py-4 mt-2 bg-gradient-to-r from-[#FF6B00] to-orange-500 hover:from-orange-500 hover:to-[#FF6B00] disabled:bg-slate-800 disabled:text-slate-600 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-[#FF6B00]/10 hover:shadow-[#FF6B00]/25 transition-all hover:scale-[1.01]"
                                    >
                                        {loading ? (
                                            <>
                                                <Loader2 className="animate-spin" size={18} />
                                                <span>Securely logging in...</span>
                                            </>
                                        ) : (
                                            <>
                                                <span>Sign In</span>
                                                <ArrowRight size={18} />
                                            </>
                                        )}
                                    </button>
                                </form>
                            ) : (
                                <form onSubmit={handleVerify2FA} className="space-y-6">
                                    <div className="text-center space-y-2 mb-4">
                                        <div className="w-14 h-14 bg-[#FF6B00]/10 rounded-2xl flex items-center justify-center mx-auto mb-2 border border-[#FF6B00]/20">
                                            <Smartphone size={28} className="text-[#FF6B00]" />
                                        </div>
                                        <h3 className="font-bold text-white text-base">Trust this device?</h3>
                                        <p className="text-slate-500 text-xs px-2 leading-relaxed">
                                            Enter the code sent to your email to verify this is you.
                                        </p>
                                    </div>

                                    <input
                                        type="text"
                                        maxLength={6}
                                        placeholder="000000"
                                        value={twoFactorCode}
                                        onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, ''))}
                                        className="w-full px-4 py-3.5 bg-[#050816] border border-[#1E2533] focus:border-[#FF6B00] rounded-xl text-white placeholder:text-slate-600 focus:outline-none transition-all font-black text-2xl tracking-[0.5em] text-center"
                                        required
                                    />

                                    <button
                                        type="submit"
                                        disabled={loading || twoFactorCode.length !== 6}
                                        className="w-full py-4 bg-gradient-to-r from-[#FF6B00] to-orange-500 hover:from-orange-500 hover:to-[#FF6B00] disabled:bg-slate-800 disabled:text-slate-600 text-[#07090E] font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-[#FF6B00]/10 hover:shadow-[#FF6B00]/25 transition-all hover:scale-[1.01]"
                                    >
                                        {loading ? <Loader2 className="animate-spin" size={18} /> : 'Verify Code'}
                                    </button>

                                    <button type="button" onClick={() => setShow2FA(false)} className="w-full text-slate-500 text-xs font-bold hover:text-white transition-colors">
                                        Back to Login
                                    </button>
                                </form>
                            )}

                        </div>

                        {/* Registration Switch link for mobile */}
                        <p className="text-center text-sm text-slate-500 font-medium lg:hidden">
                            Don't have an account? <Link href="/register" className="text-[#FF6B00] hover:text-[#FF7A00] font-bold transition-colors">Create account</Link>
                        </p>

                    </div>
                </div>

                {/* Footer text */}
                <div className="p-6 text-center text-[9px] text-slate-600 font-medium font-mono uppercase tracking-widest border-t border-[#1E2533]/10 lg:border-none">
                    SwiftPay security protocol v1.2
                </div>
            </div>

            {/* Background Ambient Radial Glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl h-[600px] bg-[radial-gradient(circle_at_center,rgba(255,107,0,0.02)_0%,transparent_70%)] rounded-full pointer-events-none -z-10" />

        </div>
    );
}
