"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import {
    Mail,
    Lock,
    ArrowRight,
    ShieldCheck,
    AlertCircle,
    Eye,
    EyeOff,
    CheckCircle2
} from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const router = useRouter();

    const handleLogin = async (e: React.FormEvent) => {
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

            if (data.token) {
                // In a real app, you'd set cookies/localStorage
                // and handle redirects based on role
                if (data.role === 'user') {
                    router.push('/mobile-only');
                } else {
                    router.push('/admin/dashboard');
                }
            } else {
                setError(data.message || 'Invalid credentials');
            }
        } catch (err) {
            setError('Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 selection:bg-indigo-500/30">
            {/* Background Decor */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/10 blur-[100px] rounded-full -z-10" />
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-600/5 blur-[100px] rounded-full -z-10" />

            <div className="w-full max-w-md space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                {/* Logo */}
                <div className="text-center space-y-4">
                    <Link href="/" className="inline-flex items-center gap-3 group">
                        <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-600/20 group-hover:scale-110 transition-transform">
                            <span className="font-bold text-2xl text-white">S</span>
                        </div>
                    </Link>
                    <h1 className="text-3xl font-bold tracking-tight">Welcome back</h1>
                    <p className="text-slate-500 text-sm italic font-medium">Continue your financial journey.</p>
                </div>

                {/* Login Card */}
                <div className="bg-slate-900/50 border border-slate-800 rounded-[2.5rem] p-10 backdrop-blur-xl shadow-2xl relative overflow-hidden group">
                    <form onSubmit={handleLogin} className="space-y-6">
                        <div className="space-y-4">
                            <div className="relative group">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-indigo-400 transition-colors" size={20} />
                                <input
                                    type="email"
                                    placeholder="Email Address"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full pl-12 pr-4 py-4 bg-slate-950/50 border border-slate-800 rounded-2xl text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 transition-all font-medium"
                                />
                            </div>
                            <div className="relative group">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-indigo-400 transition-colors" size={20} />
                                <input
                                    type={showPassword ? "text" : "password"}
                                    placeholder="Password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full pl-12 pr-12 py-4 bg-slate-950/50 border border-slate-800 rounded-2xl text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 transition-all font-medium"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-400"
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        {error && (
                            <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-center gap-3 text-rose-400 text-xs font-bold animate-shake">
                                <AlertCircle size={16} />
                                {error}
                            </div>
                        )}

                        <div className="flex items-center justify-between text-xs px-1">
                            <label className="flex items-center gap-2 text-slate-500 cursor-pointer group">
                                <div className="w-4 h-4 rounded border border-slate-800 bg-slate-950 flex items-center justify-center group-hover:border-indigo-500 transition-all">
                                    <CheckCircle2 size={12} className="text-indigo-400 opacity-0 group-hover:opacity-50" />
                                </div>
                                Stay signed in
                            </label>
                            <Link href="/forgot-password" title="Coming soon" className="text-indigo-400 hover:text-indigo-300 font-bold">Forgot Password?</Link>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-600 text-white font-black rounded-2xl flex items-center justify-center gap-3 transition-all shadow-xl shadow-indigo-600/30 hover:-translate-y-0.5"
                        >
                            {loading ? 'Authenticating...' : 'Sign In'} <ArrowRight size={20} />
                        </button>
                    </form>

                    {/* Security Badge */}
                    <div className="mt-10 pt-8 border-t border-slate-800 flex items-center justify-center gap-2 text-[10px] font-bold text-slate-600 uppercase tracking-widest">
                        <ShieldCheck size={14} className="text-indigo-500" />
                        Secure AES-256 Authentication
                    </div>
                </div>

                {/* Create Account */}
                <p className="text-center text-sm text-slate-500 font-medium pb-20">
                    Don't have an account? <Link href="/register" className="text-indigo-400 hover:text-indigo-300 font-bold transition-colors">Register Now</Link>
                </p>
            </div>
        </div>
    );
}
