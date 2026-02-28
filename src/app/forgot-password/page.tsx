'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Mail, ArrowRight, Loader2, ArrowLeft, AlertCircle, CheckCircle2 } from 'lucide-react';

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
        <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 selection:bg-rose-500/30">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-[400px] bg-rose-600/10 blur-[100px] rounded-full -z-10" />

            <div className="w-full max-w-md space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className="text-center space-y-4">
                    <Link href="/login" className="inline-flex items-center gap-2 text-slate-500 hover:text-white transition-colors text-sm font-bold mb-4">
                        <ArrowLeft size={16} /> Back to Login
                    </Link>
                    <h1 className="text-2xl font-bold tracking-tight">Forgot Password?</h1>
                    <p className="text-slate-500 text-sm italic">No worries, we'll help you get back in.</p>
                </div>

                <div className="bg-slate-900/50 border border-slate-800 rounded-[2rem] p-8 backdrop-blur-xl shadow-2xl relative overflow-hidden">
                    {error && (
                        <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-center gap-3 text-rose-400 text-sm font-bold animate-in fade-in zoom-in-95">
                            <AlertCircle size={18} />
                            {error}
                        </div>
                    )}

                    {!success ? (
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-4">
                                <p className="text-slate-500 text-xs leading-relaxed px-1">
                                    Enter your registered email address and we'll send you a 6-digit code to reset your password.
                                </p>
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
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-4 bg-rose-600 hover:bg-rose-500 disabled:bg-slate-800 disabled:text-slate-600 text-white font-black rounded-2xl flex items-center justify-center gap-3 transition-all shadow-xl shadow-rose-600/20"
                            >
                                {loading ? <Loader2 className="animate-spin" size={20} /> : <>Reset Password <ArrowRight size={20} /></>}
                            </button>
                        </form>
                    ) : (
                        <div className="text-center space-y-6 py-4 animate-in zoom-in-95">
                            <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center mx-auto mb-2 border border-emerald-500/20">
                                <CheckCircle2 size={32} className="text-emerald-400" />
                            </div>
                            <div className="space-y-2">
                                <h3 className="font-bold">Check your email</h3>
                                <p className="text-slate-500 text-xs leading-relaxed">
                                    A 6-digit reset code has been sent to <br />
                                    <span className="text-white font-bold">{email}</span>
                                </p>
                            </div>
                            {/* We could redirect to verify-reset-code page here */}
                            <Link href={`/verify-reset-code?email=${encodeURIComponent(email)}`} className="inline-block w-full py-4 bg-rose-600 hover:bg-rose-500 text-white font-black rounded-2xl transition-all shadow-xl shadow-rose-600/20">
                                Enter Reset Code
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
