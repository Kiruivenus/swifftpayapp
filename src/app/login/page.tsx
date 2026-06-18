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
    Loader2
} from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
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
                // In a production app, the token is usually in a cookie set by the server
                // but if we handle it client-side:
                window.location.href = '/dashboard';
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
                // Token & cookie are set by the server — just redirect
                window.location.href = '/dashboard';
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
        <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 selection:bg-rose-500/30">
            {/* Background Decor */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-[400px] bg-rose-600/10 blur-[100px] rounded-full -z-10" />

            <div className="w-full max-w-md space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <div className="pt-6" />
                    <h1 className="text-2xl font-bold tracking-tight">Login to SwiftPay</h1>
                    <p className="text-slate-500 text-sm">Welcome back to the future of finance.</p>
                </div>

                {/* Card Container */}
                <div className="bg-slate-900/50 border border-slate-800 rounded-[2rem] p-8 backdrop-blur-xl shadow-2xl relative overflow-hidden">
                    {error && (
                        <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-center gap-3 text-rose-400 text-sm font-bold animate-in fade-in zoom-in-95">
                            <AlertCircle size={18} />
                            {error}
                        </div>
                    )}

                    {!show2FA ? (
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-4">
                                <div className="relative group">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-rose-400 transition-colors" size={20} />
                                    <input
                                        type="email"
                                        placeholder="Email Address"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full pl-12 pr-4 py-4 bg-slate-950/50 border border-slate-800 rounded-2xl text-white placeholder:text-slate-600 focus:outline-none focus:border-rose-500 transition-all font-medium"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <div className="relative group">
                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-rose-400 transition-colors" size={20} />
                                        <input
                                            type="password"
                                            placeholder="Your Password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className="w-full pl-12 pr-4 py-4 bg-slate-950/50 border border-slate-800 rounded-2xl text-white placeholder:text-slate-600 focus:outline-none focus:border-rose-500 transition-all font-medium"
                                            required
                                        />
                                    </div>
                                    <div className="flex justify-end px-1">
                                        <Link href="/forgot-password" title="Go to Forgot Password" className="text-xs font-bold text-rose-400 hover:text-rose-300 transition-colors">
                                            Forgot password?
                                        </Link>
                                    </div>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-4 bg-rose-600 hover:bg-rose-500 disabled:bg-slate-800 disabled:text-slate-600 text-white font-black rounded-2xl flex items-center justify-center gap-3 transition-all shadow-xl shadow-rose-600/20"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="animate-spin" size={20} />
                                        <span>Signing in...</span>
                                    </>
                                ) : (
                                    <>
                                        Sign In <ArrowRight size={20} />
                                    </>
                                )}
                            </button>
                        </form>
                    ) : (
                        <form onSubmit={handleVerify2FA} className="space-y-6">
                            <div className="text-center space-y-2 mb-4">
                                <div className="w-16 h-16 bg-rose-500/10 rounded-2xl flex items-center justify-center mx-auto mb-2 border border-rose-500/20">
                                    <Smartphone size={32} className="text-rose-400" />
                                </div>
                                <h3 className="font-bold">Trust this device?</h3>
                                <p className="text-slate-500 text-xs px-4">
                                    Enter the code sent to your email to verify this is you.
                                </p>
                            </div>

                            <input
                                type="text"
                                maxLength={6}
                                placeholder="000000"
                                value={twoFactorCode}
                                onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, ''))}
                                className="w-full px-4 py-4 bg-slate-950/50 border border-slate-800 rounded-2xl text-white placeholder:text-slate-600 focus:outline-none focus:border-rose-500 transition-all font-black text-3xl tracking-[0.5em] text-center"
                                required
                            />

                            <button
                                type="submit"
                                disabled={loading || twoFactorCode.length !== 6}
                                className="w-full py-4 bg-rose-600 hover:bg-rose-500 disabled:bg-slate-800 disabled:text-slate-600 text-white font-black rounded-2xl flex items-center justify-center gap-3 transition-all shadow-xl shadow-rose-600/20"
                            >
                                {loading ? <Loader2 className="animate-spin" size={20} /> : 'Verify Code'}
                            </button>

                            <button type="button" onClick={() => setShow2FA(false)} className="w-full text-slate-500 text-xs font-bold hover:text-white transition-colors">
                                Back to login
                            </button>
                        </form>
                    )}

                    {/* Security Footer */}
                    <div className="mt-8 pt-6 border-t border-slate-800 flex items-center justify-center gap-2 text-[10px] font-bold text-slate-600 uppercase tracking-widest">
                        <ShieldCheck size={14} className="text-rose-500" />
                        Secure Session Management
                    </div>
                </div>

                {/* Registration Link */}
                <p className="text-center text-sm text-slate-500 font-medium">
                    Don't have an account? <Link href="/register" className="text-rose-400 hover:text-rose-300 font-bold transition-colors">Sign Up</Link>
                </p>
            </div>
        </div>
    );
}
