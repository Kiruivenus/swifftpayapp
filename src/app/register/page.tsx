"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
    Mail,
    Lock,
    ArrowRight,
    CheckCircle2,
    ShieldCheck,
    ArrowLeft,
    Loader2,
    AlertCircle,
    Eye,
    EyeOff
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
    const [searchQuery, setSearchQuery] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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

    const filteredCountries = countries.filter(c => 
        c.countryName.toLowerCase().includes(searchQuery.toLowerCase()) || 
        c.countryCode.toLowerCase().includes(searchQuery.toLowerCase())
    );

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
                        Join the future of payments <span className="text-[#FF6B00]">across Africa</span>.
                    </h2>
                    <p className="text-slate-400 text-sm leading-relaxed font-medium">
                        Set up your secure, multi-currency wallet in minutes. Access low-fee conversions, instant settlements, and secure global payouts.
                    </p>
                </div>

                {/* Trust Indicators (No emojis) */}
                <div className="space-y-3 border-t border-[#1E2533]/55 pt-8 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                    <div className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#FF6B00]" />
                        <span>Region Localization Support</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#FF6B00]" />
                        <span>Device Multi-Factor Authentication</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#FF6B00]" />
                        <span>Automated Compliance Safeguards</span>
                    </div>
                </div>

                {/* Ambient lights */}
                <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-[#FF6B00]/5 blur-3xl rounded-full pointer-events-none" />
                <div className="absolute -top-20 -right-20 w-80 h-80 bg-[#FF6B00]/5 blur-3xl rounded-full pointer-events-none" />
            </div>

            {/* Split Right Column: Registration Card & Progress */}
            <div className="w-full lg:w-[58%] flex flex-col justify-between min-h-screen relative">
                
                {/* Mobile Header (Hidden on Desktop) */}
                <header className="flex lg:hidden items-center justify-between w-full h-[70px] px-6 bg-[#050816]/75 backdrop-blur-md border-b border-[#1E2533]/40 z-50 fixed top-0 left-0">
                    <div className="flex items-center gap-3">
                        {step === 2 && (
                            <button 
                                onClick={handleBack}
                                className="flex items-center justify-center text-slate-400 hover:text-white bg-[#0D1017]/80 w-8 h-8 rounded-lg border border-[#1E2533]/50"
                                title="Back to Step 1"
                            >
                                <ArrowLeft size={16} />
                            </button>
                        )}
                        <Link href="/" className="flex items-center gap-3 cursor-pointer">
                            <img src="/logo.png" alt="SwiftPay Logo" className="w-8 h-8 object-contain rounded-xl shadow-lg shadow-[#FF6B00]/10" />
                            <span className="text-lg font-bold tracking-tight text-white">SwiftPay</span>
                        </Link>
                    </div>
                    {step === 1 && (
                        <Link href="/login" className="text-xs font-bold text-[#FF6B00] bg-[#0D1017]/80 px-3.5 py-1.5 rounded-lg border border-[#1E2533]/50">
                            Login
                        </Link>
                    )}
                </header>

                {/* Desktop Top Header Bar (Redirection & Back controls) */}
                <div className="hidden lg:flex justify-between items-center p-8">
                    <div>
                        {step === 2 && (
                            <button 
                                onClick={handleBack}
                                className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-400 hover:text-white bg-[#0D1017]/80 px-4 py-2.5 rounded-xl border border-[#1E2533]/50 transition-colors"
                            >
                                <ArrowLeft size={14} />
                                Back
                            </button>
                        )}
                    </div>
                    {step < 3 && (
                        <div className="flex items-center gap-3">
                            <span className="text-xs text-slate-500 font-medium">Already have an account?</span>
                            <Link href="/login" className="text-xs font-bold text-[#FF6B00] hover:text-[#FF7A00] transition-colors bg-[#0D1017]/80 px-4 py-2 rounded-xl border border-[#1E2533]/50">
                                Sign In
                            </Link>
                        </div>
                    )}
                </div>

                {/* Onboarding Container */}
                <div className="flex-1 flex flex-col justify-center items-center p-6 md:p-12 pt-24 lg:pt-0 max-w-lg mx-auto w-full space-y-6">
                    
                    {/* Welcome texts */}
                    <div className="text-center space-y-1.5 w-full">
                        <h1 className="text-3xl font-black text-white tracking-tight">Create Your Account</h1>
                        <p className="text-slate-400 text-xs sm:text-sm">Set up your account and access borderless payments</p>
                    </div>

                    {/* Onboarding Progress Dots */}
                    <div className="flex items-center justify-between w-full px-1.5 select-none">
                        <div className="flex flex-col items-center">
                            <span className={`text-[9px] font-black uppercase tracking-wider transition-colors ${step >= 1 ? 'text-[#FF6B00]' : 'text-slate-600'}`}>Region Setup</span>
                            <div className={`w-3 h-3 rounded-full mt-1.5 border-2 transition-all ${step >= 1 ? 'bg-[#FF6B00] border-[#FF6B00] shadow-md shadow-[#FF6B00]/25' : 'bg-slate-900 border-slate-800'}`} />
                        </div>
                        <div className={`flex-1 h-0.5 mx-2 -mt-1 transition-colors ${step > 1 ? 'bg-[#FF6B00]' : 'bg-slate-800'}`} />
                        
                        <div className="flex flex-col items-center">
                            <span className={`text-[9px] font-black uppercase tracking-wider transition-colors ${step >= 2 ? 'text-[#FF6B00]' : 'text-slate-600'}`}>Personal Profile</span>
                            <div className={`w-3 h-3 rounded-full mt-1.5 border-2 transition-all ${step >= 2 ? 'bg-[#FF6B00] border-[#FF6B00] shadow-md shadow-[#FF6B00]/25' : 'bg-slate-900 border-slate-800'}`} />
                        </div>
                        <div className={`flex-1 h-0.5 mx-2 -mt-1 transition-colors ${step > 2 ? 'bg-[#FF6B00]' : 'bg-slate-800'}`} />
                        
                        <div className="flex flex-col items-center">
                            <span className={`text-[9px] font-black uppercase tracking-wider transition-colors ${step >= 3 ? 'text-[#FF6B00]' : 'text-slate-600'}`}>Verification</span>
                            <div className={`w-3 h-3 rounded-full mt-1.5 border-2 transition-all ${step >= 3 ? 'bg-[#FF6B00] border-[#FF6B00] shadow-md shadow-[#FF6B00]/25' : 'bg-slate-900 border-slate-800'}`} />
                        </div>
                    </div>

                    {/* Step Card Container */}
                    <div className="bg-[#0D1017] border border-[#1E2533] rounded-[24px] p-6 sm:p-8 shadow-2xl shadow-[#FF6B00]/2 hover:border-[#FF6B00]/20 transition-all w-full">
                        
                        {error && (
                            <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-center gap-3 text-rose-400 text-xs font-bold animate-in fade-in zoom-in-95">
                                <AlertCircle size={18} className="shrink-0" />
                                <span>{error}</span>
                            </div>
                        )}

                        {/* Step 1: Localization */}
                        {step === 1 && (
                            <div className="space-y-5 animate-in fade-in duration-500 text-left">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-[#FF6B00] uppercase tracking-widest pl-1">Step 1: Region Selection</label>
                                    <h3 className="text-base font-bold text-white">Select your country of residence</h3>
                                </div>

                                {/* Custom Search Box */}
                                <div className="relative">
                                    <input
                                        type="text"
                                        placeholder="Search country..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full px-4 py-3.5 bg-[#050816] border border-[#1E2533] focus:border-[#FF6B00] focus:ring-1 focus:ring-[#FF6B00] rounded-xl text-white placeholder:text-slate-600 focus:outline-none transition-all text-sm font-medium"
                                    />
                                </div>

                                {/* List Box */}
                                <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1 custom-scrollbar">
                                    {loading ? (
                                        <div className="flex justify-center py-8">
                                            <Loader2 className="animate-spin text-[#FF6B00]" size={28} />
                                        </div>
                                    ) : (
                                        filteredCountries.map((c) => (
                                            <button
                                                key={c.countryCode}
                                                onClick={() => handleSelectCountry(c)}
                                                className={`w-full flex items-center justify-between p-3.5 rounded-xl border transition-all ${formData.countryCode === c.countryCode ? 'bg-[#FF6B00]/10 border-[#FF6B00]/50 text-white' : 'bg-[#050816] border-[#1E2533] text-slate-400 hover:border-slate-700'}`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-[#050816] border border-[#1E2533] flex items-center justify-center font-bold text-xs text-[#FF6B00]">
                                                        {c.countryCode}
                                                    </div>
                                                    <span className="font-bold text-sm text-white">{c.countryName}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[9px] font-black uppercase bg-[#050816] border border-[#1E2533]/50 px-2 py-1 rounded text-slate-500">{c.defaultCurrency}</span>
                                                    {formData.countryCode === c.countryCode && <CheckCircle2 size={16} className="text-[#FF6B00]" />}
                                                </div>
                                            </button>
                                        ))
                                    )}
                                    {!loading && filteredCountries.length === 0 && (
                                        <p className="text-center text-slate-500 text-xs py-6">No matching countries found.</p>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Step 2: Personal Profile */}
                        {step === 2 && (
                            <div className="space-y-5 text-left animate-in fade-in slide-in-from-right-4 duration-500">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-[#FF6B00] uppercase tracking-widest pl-1">Step 2: Profile Setup</label>
                                    <h3 className="text-base font-bold text-white">Enter your credentials</h3>
                                </div>

                                <div className="space-y-4">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest pl-1">Username</label>
                                            <input
                                                type="text"
                                                placeholder="johndoe"
                                                value={formData.username}
                                                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                                className="w-full px-4 py-3 bg-[#050816] border border-[#1E2533] focus:border-[#FF6B00] rounded-xl text-white placeholder:text-slate-600 focus:outline-none transition-all font-medium text-sm"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest pl-1">Phone Number</label>
                                            <div className="relative flex">
                                                <div className="bg-[#050816] border border-[#1E2533] text-slate-500 px-3 py-3 rounded-l-xl text-xs font-bold flex items-center shrink-0 border-r-0">
                                                    {formData.dialCode}
                                                </div>
                                                <input
                                                    type="tel"
                                                    placeholder="712345678"
                                                    value={formData.phone}
                                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value.replace(/\D/g, '') })}
                                                    className="w-full px-3 py-3 bg-[#050816] border border-[#1E2533] focus:border-[#FF6B00] rounded-r-xl text-white placeholder:text-slate-600 focus:outline-none transition-all font-medium text-sm"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest pl-1">Email Address</label>
                                        <div className="relative group">
                                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-[#FF6B00] transition-colors" size={18} />
                                            <input
                                                type="email"
                                                placeholder="name@example.com"
                                                value={formData.email}
                                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                                className="w-full pl-11 pr-4 py-3.5 bg-[#050816] border border-[#1E2533] focus:border-[#FF6B00] rounded-xl text-white placeholder:text-slate-600 focus:outline-none transition-all font-medium text-sm"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest pl-1">Choose Password</label>
                                        <div className="relative group">
                                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-[#FF6B00] transition-colors" size={18} />
                                            <input
                                                type={showPassword ? "text" : "password"}
                                                placeholder="••••••••"
                                                value={formData.password}
                                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                                className="w-full pl-11 pr-11 py-3.5 bg-[#050816] border border-[#1E2533] focus:border-[#FF6B00] rounded-xl text-white placeholder:text-slate-600 focus:outline-none transition-all font-medium text-sm"
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

                                    <div className="space-y-1">
                                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest pl-1">Confirm Password</label>
                                        <div className="relative group">
                                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-[#FF6B00] transition-colors" size={18} />
                                            <input
                                                type={showConfirmPassword ? "text" : "password"}
                                                placeholder="••••••••"
                                                value={formData.confirmPassword}
                                                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                                className="w-full pl-11 pr-11 py-3.5 bg-[#050816] border border-[#1E2533] focus:border-[#FF6B00] rounded-xl text-white placeholder:text-slate-600 focus:outline-none transition-all font-medium text-sm"
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

                                    <div className="flex items-start gap-3 p-3 bg-[#050816] border border-[#1E2533] rounded-xl">
                                        <ShieldCheck size={16} className="text-[#FF6B00] shrink-0 mt-0.5" />
                                        <p className="text-[10px] text-slate-500 leading-relaxed">
                                            Credentials will secure all wallet access. Multi-factor device tracking is enabled immediately.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Step 3: Verification */}
                        {step === 3 && (
                            <div className="space-y-5 text-left animate-in zoom-in-95 duration-500">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-[#FF6B00] uppercase tracking-widest pl-1">Step 3: Verification</label>
                                    <h3 className="text-base font-bold text-white">Check your email</h3>
                                </div>
                                <div className="text-center py-2">
                                    <div className="w-14 h-14 bg-[#FF6B00]/10 rounded-2xl flex items-center justify-center mx-auto mb-3 border border-[#FF6B00]/20">
                                        <Mail size={28} className="text-[#FF6B00]" />
                                    </div>
                                    <p className="text-slate-400 text-xs leading-relaxed px-4">
                                        We sent a 6-digit verification code to <br />
                                        <span className="text-white font-bold">{formData.email}</span>
                                    </p>
                                </div>

                                <div className="space-y-3">
                                    <input
                                        type="text"
                                        maxLength={6}
                                        placeholder="000000"
                                        value={verificationCode}
                                        onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                                        className="w-full px-4 py-4 bg-[#050816] border border-[#1E2533] focus:border-[#FF6B00] rounded-xl text-white placeholder:text-slate-600 focus:outline-none transition-all font-black text-2xl tracking-[0.5em] text-center"
                                    />

                                    <button
                                        onClick={resendCode}
                                        disabled={submitting}
                                        className="w-full text-[#FF6B00] text-xs font-bold hover:text-[#FF7A00] transition-colors disabled:text-slate-600 text-center"
                                    >
                                        Didn't receive a code? Resend
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Action buttons */}
                        <div className="flex items-center gap-4 mt-8 pt-2">
                            <button
                                onClick={step === 3 ? handleVerify : handleNext}
                                disabled={
                                    (step === 1 && !formData.countryCode) ||
                                    (step === 2 && (!formData.email || !formData.password || !formData.username || !formData.phone)) ||
                                    (step === 3 && verificationCode.length !== 6) ||
                                    submitting
                                }
                                className="flex-1 py-4 bg-gradient-to-r from-[#FF6B00] to-orange-500 hover:from-orange-500 hover:to-[#FF6B00] disabled:bg-slate-800 disabled:text-slate-600 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-[#FF6B00]/10 hover:shadow-[#FF6B00]/25 transition-all hover:scale-[1.01]"
                            >
                                {submitting ? (
                                    <>
                                        <Loader2 className="animate-spin" size={18} />
                                        <span>Processing...</span>
                                    </>
                                ) : (
                                    <>
                                        <span>{step === 3 ? 'Verify & Finish' : 'Continue'}</span>
                                        <ArrowRight size={18} />
                                    </>
                                )}
                            </button>
                        </div>

                    </div>

                    {/* Desktop switch link bottom for mobile */}
                    {step < 3 && (
                        <p className="text-center text-sm text-slate-500 font-medium lg:hidden">
                            Already have an account? <Link href="/login" className="text-[#FF6B00] hover:text-[#FF7A00] font-bold transition-colors">Sign In</Link>
                        </p>
                    )}

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
