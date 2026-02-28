"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import {
    Globe,
    Mail,
    Lock,
    ArrowRight,
    CheckCircle2,
    Smartphone,
    ShieldCheck,
    ChevronRight,
    ArrowLeft
} from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function RegisterPage() {
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        country: '',
        currency: '',
        email: '',
        password: '',
    });
    const router = useRouter();

    const handleNext = () => {
        if (step < 3) setStep(step + 1);
        else router.push('/mobile-only');
    };

    const handleBack = () => {
        if (step > 1) setStep(step - 1);
    };

    const countries = [
        { name: 'Kenya', code: 'KES', flag: '🇰🇪' },
        { name: 'Uganda', code: 'UGX', flag: '🇺🇬' },
        { name: 'Tanzania', code: 'TZS', flag: '🇹🇿' },
    ];

    return (
        <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 selection:bg-indigo-500/30">
            {/* Background Decor */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-[400px] bg-indigo-600/10 blur-[100px] rounded-full -z-10" />

            <div className="w-full max-w-md space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                {/* Logo */}
                <div className="text-center space-y-4">
                    <Link href="/" className="inline-flex items-center gap-3 group">
                        <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-600/20 group-hover:scale-110 transition-transform">
                            <span className="font-bold text-2xl text-white">S</span>
                        </div>
                    </Link>
                    <h1 className="text-2xl font-bold tracking-tight">Create your account</h1>
                    <p className="text-slate-500 text-sm">Join the next generation of African fintech.</p>
                </div>

                {/* Progress Bar */}
                <div className="flex items-center justify-between px-2">
                    {[1, 2, 3].map((num) => (
                        <div key={num} className="flex items-center">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all border-2 ${step >= num ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'bg-slate-900 border-slate-800 text-slate-600'}`}>
                                {num}
                            </div>
                            {num < 3 && (
                                <div className={`w-20 h-0.5 mx-2 transition-all ${step > num ? 'bg-indigo-600' : 'bg-slate-800'}`} />
                            )}
                        </div>
                    ))}
                </div>

                {/* Step Card */}
                <div className="bg-slate-900/50 border border-slate-800 rounded-[2rem] p-8 backdrop-blur-xl shadow-2xl relative overflow-hidden group">
                    {/* Step 1: Localization */}
                    {step === 1 && (
                        <div className="space-y-6 animate-in fade-in duration-500">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1">Step 1: Region</label>
                                <h3 className="text-lg font-bold text-white">Where are you located?</h3>
                            </div>

                            <div className="space-y-3">
                                {countries.map((c) => (
                                    <button
                                        key={c.code}
                                        onClick={() => setFormData({ ...formData, country: c.name, currency: c.code })}
                                        className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all ${formData.country === c.name ? 'bg-indigo-600/10 border-indigo-500/50 text-white shadow-[0_0_20px_rgba(99,102,241,0.1)]' : 'bg-slate-950/30 border-slate-800 text-slate-400 hover:border-slate-700'}`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <span className="text-2xl">{c.flag}</span>
                                            <span className="font-bold">{c.name}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] font-black uppercase bg-slate-800 px-2 py-1 rounded text-slate-500">{c.code}</span>
                                            {formData.country === c.name && <CheckCircle2 size={18} className="text-indigo-400" />}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Step 2: Identification */}
                    {step === 2 && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1">Step 2: Security</label>
                                <h3 className="text-lg font-bold text-white">Create your login</h3>
                            </div>

                            <div className="space-y-4">
                                <div className="relative group">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-indigo-400 transition-colors" size={20} />
                                    <input
                                        type="email"
                                        placeholder="Email Address"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        className="w-full pl-12 pr-4 py-4 bg-slate-950/50 border border-slate-800 rounded-2xl text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 transition-all font-medium"
                                    />
                                </div>
                                <div className="relative group">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-indigo-400 transition-colors" size={20} />
                                    <input
                                        type="password"
                                        placeholder="Choose Password"
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        className="w-full pl-12 pr-4 py-4 bg-slate-950/50 border border-slate-800 rounded-2xl text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 transition-all font-medium"
                                    />
                                </div>
                                <div className="flex items-start gap-3 p-3 bg-indigo-500/5 border border-indigo-500/10 rounded-xl">
                                    <ShieldCheck size={16} className="text-indigo-400 shrink-0 mt-0.5" />
                                    <p className="text-[10px] text-slate-500 leading-relaxed">
                                        Your password should be at least 8 characters with a mix of letters and numbers.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 3: Confirmation */}
                    {step === 3 && (
                        <div className="text-center space-y-6 py-6 animate-in zoom-in-95 duration-500">
                            <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-2 border border-emerald-500/20 shadow-[0_0_40px_rgba(16,185,129,0.1)]">
                                <CheckCircle2 size={48} className="text-emerald-400" />
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-2xl font-bold text-white tracking-tight">Setup Complete!</h3>
                                <p className="text-slate-500 text-sm leading-relaxed px-4">
                                    Your profile is ready. For the best experience, please download the SwiftPay app to complete your first deposit.
                                </p>
                            </div>
                            <div className="pt-4 px-2 space-y-3">
                                <div className="p-4 bg-slate-950/50 rounded-2xl border border-slate-800 flex items-center justify-between text-left">
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-600 uppercase">Country</p>
                                        <p className="text-sm font-bold text-white">{formData.country}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-600 uppercase">Primary Currency</p>
                                        <p className="text-sm font-bold text-white">{formData.currency}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-4 mt-10">
                        {step > 1 && (
                            <button
                                onClick={handleBack}
                                className="p-4 bg-slate-800 hover:bg-slate-700 text-white rounded-2xl transition-all border border-slate-700"
                            >
                                <ArrowLeft size={20} />
                            </button>
                        )}
                        <button
                            onClick={handleNext}
                            disabled={step === 1 && !formData.country || step === 2 && (!formData.email || !formData.password)}
                            className="flex-1 py-4 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-600 text-white font-black rounded-2xl flex items-center justify-center gap-3 transition-all shadow-xl shadow-indigo-600/20"
                        >
                            {step === 3 ? 'Continue to App' : 'Continue'} <ArrowRight size={20} />
                        </button>
                    </div>
                </div>

                {/* Already have an account? */}
                <p className="text-center text-sm text-slate-500 font-medium pb-10">
                    Already have an account? <Link href="/login" className="text-indigo-400 hover:text-indigo-300 font-bold transition-colors">Sign In</Link>
                </p>
            </div>
        </div>
    );
}
