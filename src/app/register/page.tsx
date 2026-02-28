"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
    Mail,
    Lock,
    ArrowRight,
    CheckCircle2,
    Smartphone,
    ShieldCheck,
    ArrowLeft,
    Loader2,
    AlertCircle
} from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function RegisterPage() {
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        countryName: '',
        countryCode: '',
        currency: '',
        dialCode: '',
        email: '',
        username: '',
        phone: '',
        password: '',
        confirmPassword: '',
    });
    const [countries, setCountries] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [verificationCode, setVerificationCode] = useState('');
    const router = useRouter();

    useEffect(() => {
        const fetchCountries = async () => {
            try {
                const res = await fetch('/api/public/regions');
                const data = await res.json();
                if (data.success) {
                    setCountries(data.regions);
                    const defaultRegion = data.regions.find((r: any) => r.isDefault);
                    if (defaultRegion) {
                        setFormData(prev => ({
                            ...prev,
                            countryName: defaultRegion.countryName,
                            countryCode: defaultRegion.countryCode,
                            currency: defaultRegion.defaultCurrency,
                            dialCode: defaultRegion.dialCode
                        }));
                    }
                }
            } catch (err) {
                console.error("Failed to fetch regions", err);
            } finally {
                setLoading(false);
            }
        };
        fetchCountries();
    }, []);

    const handleSelectCountry = (c: any) => {
        setFormData({
            ...formData,
            countryName: c.countryName,
            countryCode: c.countryCode,
            currency: c.defaultCurrency,
            dialCode: c.dialCode
        });
    };

    const handleNext = async () => {
        setError('');
        if (step === 1) {
            if (!formData.countryCode) {
                setError('Please select a country');
                return;
            }
            setStep(2);
        } else if (step === 2) {
            // Validation
            if (!formData.username || !formData.email || !formData.phone || !formData.password) {
                setError('All fields are required');
                return;
            }
            if (formData.password !== formData.confirmPassword) {
                setError('Passwords do not match');
                return;
            }
            if (formData.password.length < 8) {
                setError('Password must be at least 8 characters');
                return;
            }

            setSubmitting(true);
            try {
                const res = await fetch('/api/auth/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        username: formData.username,
                        email: formData.email,
                        phone: formData.phone,
                        password: formData.password,
                        countryCode: formData.countryCode,
                        currency: formData.currency
                    }),
                });

                const data = await res.json();
                if (data.ok) {
                    setStep(3);
                } else {
                    setError(data.message || 'Registration failed');
                }
            } catch (err) {
                setError('Service unavailable. Please try again later.');
            } finally {
                setSubmitting(false);
            }
        }
    };

    const handleVerify = async () => {
        setError('');
        setSubmitting(true);
        try {
            const res = await fetch('/api/auth/email/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: formData.email.trim().toLowerCase(),
                    code: verificationCode
                }),
            });

            const data = await res.json();
            if (data.token) {
                router.push('/mobile-only');
            } else {
                setError(data.message || 'Verification failed');
            }
        } catch (err) {
            setError('Verification failed. Use the code sent to your email.');
        } finally {
            setSubmitting(false);
        }
    };

    const resendCode = async () => {
        setError('');
        setSubmitting(true);
        try {
            const res = await fetch('/api/auth/resend-email-code', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: formData.email.trim().toLowerCase() }),
            });
            const data = await res.json();
            if (data.ok) {
                // Code resent successfully
            } else {
                setError(data.message || 'Failed to resend code');
            }
        } catch (err) {
            setError('Failed to resend code. Please try again later.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleBack = () => {
        if (step > 1 && step < 3) setStep(step - 1);
    };

    return (
        <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 selection:bg-rose-500/30">
            {/* Background Decor */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-[400px] bg-rose-600/10 blur-[100px] rounded-full -z-10" />

            <div className="w-full max-w-md space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                {/* Logo */}
                <div className="text-center space-y-4">
                    <Link href="/" className="inline-flex items-center gap-3 group">
                        <div className="w-12 h-12 bg-rose-600 rounded-2xl flex items-center justify-center shadow-lg shadow-rose-600/20 group-hover:scale-110 transition-transform">
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
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all border-2 ${step >= num ? 'bg-rose-600 border-rose-600 text-white shadow-lg shadow-rose-600/20' : 'bg-slate-900 border-slate-800 text-slate-600'}`}>
                                {num}
                            </div>
                            {num < 3 && (
                                <div className={`w-20 h-0.5 mx-2 transition-all ${step > num ? 'bg-rose-600' : 'bg-slate-800'}`} />
                            )}
                        </div>
                    ))}
                </div>

                {/* Step Card */}
                <div className="bg-slate-900/50 border border-slate-800 rounded-[2rem] p-8 backdrop-blur-xl shadow-2xl relative overflow-hidden">
                    {/* Error Display */}
                    {error && (
                        <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-center gap-3 text-rose-400 text-sm font-bold animate-in fade-in zoom-in-95">
                            <AlertCircle size={18} />
                            {error}
                        </div>
                    )}

                    {/* Step 1: Localization */}
                    {step === 1 && (
                        <div className="space-y-6 animate-in fade-in duration-500">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1">Step 1: Region</label>
                                <h3 className="text-lg font-bold text-white">Where are you located?</h3>
                            </div>

                            <div className="space-y-3">
                                {loading ? (
                                    <div className="flex justify-center py-10">
                                        <Loader2 className="animate-spin text-rose-500" size={32} />
                                    </div>
                                ) : (
                                    countries.map((c) => (
                                        <button
                                            key={c.countryCode}
                                            onClick={() => handleSelectCountry(c)}
                                            className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all ${formData.countryCode === c.countryCode ? 'bg-rose-600/10 border-rose-500/50 text-white shadow-[0_0_20px_rgba(225,29,72,0.1)]' : 'bg-slate-950/30 border-slate-800 text-slate-400 hover:border-slate-700'}`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <span className="text-xl">🌍</span>
                                                <span className="font-bold">{c.countryName}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-[10px] font-black uppercase bg-slate-800 px-2 py-1 rounded text-slate-500">{c.defaultCurrency}</span>
                                                {formData.countryCode === c.countryCode && <CheckCircle2 size={18} className="text-rose-400" />}
                                            </div>
                                        </button>
                                    ))
                                )}
                                {!loading && countries.length === 0 && (
                                    <p className="text-center text-slate-500 text-xs py-4">No supported regions available.</p>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Step 2: Identification */}
                    {step === 2 && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1">Step 2: Account Details</label>
                                <h3 className="text-lg font-bold text-white">Set up your profile</h3>
                            </div>

                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="relative group">
                                        <input
                                            type="text"
                                            placeholder="Username"
                                            value={formData.username}
                                            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                            className="w-full px-4 py-4 bg-slate-950/50 border border-slate-800 rounded-2xl text-white placeholder:text-slate-600 focus:outline-none focus:border-rose-500 transition-all font-medium text-sm"
                                        />
                                    </div>
                                    <div className="relative group flex">
                                        <div className="bg-slate-900 border border-slate-800 text-slate-500 px-3 py-4 rounded-l-2xl text-sm font-bold flex items-center">
                                            {formData.dialCode}
                                        </div>
                                        <input
                                            type="tel"
                                            placeholder="Phone"
                                            value={formData.phone}
                                            onChange={(e) => setFormData({ ...formData, phone: e.target.value.replace(/\D/g, '') })}
                                            className="w-full px-4 py-4 bg-slate-950/50 border border-slate-800 border-l-0 rounded-r-2xl text-white placeholder:text-slate-600 focus:outline-none focus:border-rose-500 transition-all font-medium text-sm"
                                        />
                                    </div>
                                </div>
                                <div className="relative group">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-rose-400 transition-colors" size={20} />
                                    <input
                                        type="email"
                                        placeholder="Email Address"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        className="w-full pl-12 pr-4 py-4 bg-slate-950/50 border border-slate-800 rounded-2xl text-white placeholder:text-slate-600 focus:outline-none focus:border-rose-500 transition-all font-medium"
                                    />
                                </div>
                                <div className="relative group">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-rose-400 transition-colors" size={20} />
                                    <input
                                        type="password"
                                        placeholder="Choose Password"
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        className="w-full pl-12 pr-4 py-4 bg-slate-950/50 border border-slate-800 rounded-2xl text-white placeholder:text-slate-600 focus:outline-none focus:border-rose-500 transition-all font-medium"
                                    />
                                </div>
                                <div className="relative group">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-rose-400 transition-colors" size={20} />
                                    <input
                                        type="password"
                                        placeholder="Confirm Password"
                                        value={formData.confirmPassword}
                                        onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                        className="w-full pl-12 pr-4 py-4 bg-slate-950/50 border border-slate-800 rounded-2xl text-white placeholder:text-slate-600 focus:outline-none focus:border-rose-500 transition-all font-medium"
                                    />
                                </div>
                                <div className="flex items-start gap-3 p-3 bg-rose-500/5 border border-rose-500/10 rounded-xl">
                                    <ShieldCheck size={16} className="text-rose-400 shrink-0 mt-0.5" />
                                    <p className="text-[10px] text-slate-500 leading-relaxed">
                                        Email and password will be used for all future logins. 2FA is enabled by default for new devices.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 3: Email Verification */}
                    {step === 3 && (
                        <div className="space-y-6 animate-in zoom-in-95 duration-500">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1">Step 3: Verification</label>
                                <h3 className="text-lg font-bold text-white">Check your email</h3>
                            </div>
                            <div className="text-center py-4">
                                <div className="w-16 h-16 bg-rose-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-rose-500/20">
                                    <Mail size={32} className="text-rose-400" />
                                </div>
                                <p className="text-slate-500 text-sm leading-relaxed px-4">
                                    We sent a 6-digit verification code to <br />
                                    <span className="text-white font-bold">{formData.email}</span>
                                </p>
                            </div>

                            <div className="space-y-4">
                                <input
                                    type="text"
                                    maxLength={6}
                                    placeholder="000000"
                                    value={verificationCode}
                                    onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                                    className="w-full px-4 py-6 bg-slate-950/50 border border-slate-800 rounded-2xl text-white placeholder:text-slate-600 focus:outline-none focus:border-rose-500 transition-all font-black text-3xl tracking-[0.5em] text-center"
                                />

                                <button
                                    onClick={resendCode}
                                    disabled={submitting}
                                    className="w-full text-rose-400 text-xs font-bold hover:text-rose-300 transition-colors disabled:text-slate-600"
                                >
                                    Didn't receive a code? Resend
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-4 mt-10">
                        {step > 1 && step < 3 && (
                            <button
                                onClick={handleBack}
                                className="p-4 bg-slate-800 hover:bg-slate-700 text-white rounded-2xl transition-all border border-slate-700"
                            >
                                <ArrowLeft size={20} />
                            </button>
                        )}
                        <button
                            onClick={step === 3 ? handleVerify : handleNext}
                            disabled={
                                (step === 1 && !formData.countryCode) ||
                                (step === 2 && (!formData.email || !formData.password || !formData.username || !formData.phone)) ||
                                (step === 3 && verificationCode.length !== 6) ||
                                submitting
                            }
                            className="flex-1 py-4 bg-rose-600 hover:bg-rose-500 disabled:bg-slate-800 disabled:text-slate-600 text-white font-black rounded-2xl flex items-center justify-center gap-3 transition-all shadow-xl shadow-rose-600/20"
                        >
                            {submitting ? (
                                <>
                                    <Loader2 className="animate-spin" size={20} />
                                    <span>Processing...</span>
                                </>
                            ) : (
                                <>
                                    {step === 3 ? 'Verify & Finish' : 'Continue'} <ArrowRight size={20} />
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {/* Already have an account? */}
                {step < 3 && (
                    <p className="text-center text-sm text-slate-500 font-medium">
                        Already have an account? <Link href="/login" className="text-rose-400 hover:text-rose-300 font-bold transition-colors">Sign In</Link>
                    </p>
                )}
            </div>
        </div>
    );
}
