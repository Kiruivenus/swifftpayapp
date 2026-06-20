"use client";

import React, { useEffect } from 'react';
import {
    Smartphone,
    ShieldCheck,
    Download,
    QrCode,
    Zap,
    LogOut,
    Play,
    Apple,
    ExternalLink
} from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function MobileOnlyPage() {
    const router = useRouter();

    useEffect(() => {
        // Automatically attempt to open the app if installed
        const deepLink = 'swiftpay://open';
        window.location.href = deepLink;
    }, []);

    const handleOpenApp = () => {
        window.location.href = 'swiftpay://open';
    };

    const handleLogout = async () => {
        try {
            await fetch('/api/auth/logout', { method: 'POST' });
            router.push('/login');
        } catch (error) {
            console.error('Logout failed:', error);
            router.push('/login');
        }
    };

    return (
        <div className="min-h-screen bg-[#07090E] text-white flex flex-col items-center justify-center p-6 font-sans relative overflow-hidden">
            {/* Glowing Accent Background */}
            <div className="absolute top-1/4 -left-20 w-80 h-80 bg-primary-orange/5 blur-[120px] rounded-full -z-10 animate-pulse duration-[6000ms]" />
            <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-primary-orange/5 blur-[120px] rounded-full -z-10 animate-pulse duration-[8000ms]" />

            <div className="w-full max-w-2xl space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 text-center relative z-10">
                
                {/* Logo & Header */}
                <div className="space-y-4">
                    <div className="inline-flex items-center gap-3">
                        <div className="w-12 h-12 bg-primary-orange/10 border border-primary-orange/20 rounded-2xl flex items-center justify-center shadow-lg shadow-primary-orange/5">
                            <svg className="w-6 h-6 text-primary-orange filter drop-shadow-[0_0_4px_rgba(255,122,0,0.5)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" fill="currentColor" />
                            </svg>
                        </div>
                    </div>
                    <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-white mt-2">SwiftPay is Mobile-First</h1>
                    <p className="text-slate-400 text-base max-w-lg mx-auto leading-relaxed">
                        For individual users, our secure wallet, instant transactions, and biometric security features are exclusively available on mobile.
                    </p>
                </div>

                {/* Primary Open App Action */}
                <div className="bg-[#0D1017] border border-[#1E2533] rounded-3xl p-8 shadow-2xl relative overflow-hidden group max-w-md mx-auto">
                    <div className="space-y-5">
                        <div className="w-12 h-12 bg-primary-orange/10 text-primary-orange rounded-2xl flex items-center justify-center mx-auto">
                            <Smartphone size={24} className="animate-bounce" />
                        </div>
                        <div>
                            <h3 className="font-bold text-white text-lg">Already have the App?</h3>
                            <p className="text-xs text-slate-500 mt-1">If the app didn't open automatically, tap below to launch it.</p>
                        </div>
                        <button
                            onClick={handleOpenApp}
                            className="w-full py-3.5 bg-primary-orange hover:bg-primary-orange-hover text-white font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-primary-orange/20 flex items-center justify-center gap-2"
                        >
                            Open SwiftPay App <ExternalLink size={14} />
                        </button>
                    </div>
                </div>

                {/* Info & Download Center Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left max-w-xl mx-auto">
                    <div className="p-6 bg-[#0D1017] border border-[#1E2533] rounded-2xl">
                        <div className="w-9 h-9 bg-primary-orange/10 text-primary-orange rounded-xl flex items-center justify-center mb-3">
                            <Zap size={18} />
                        </div>
                        <h3 className="font-bold text-white text-sm">Instant Transactions</h3>
                        <p className="text-xs text-slate-500 leading-relaxed mt-1">Direct M-Pesa channels and peer transfers, optimized for native performance on your smartphone.</p>
                    </div>
                    <div className="p-6 bg-[#0D1017] border border-[#1E2533] rounded-2xl">
                        <div className="w-9 h-9 bg-primary-orange/10 text-primary-orange rounded-xl flex items-center justify-center mb-3">
                            <ShieldCheck size={18} />
                        </div>
                        <h3 className="font-bold text-white text-sm">Biometric Protection</h3>
                        <p className="text-xs text-slate-500 leading-relaxed mt-1">Lock down your account with secure Android/iOS fingerprint and facial recognition keys.</p>
                    </div>
                </div>

                {/* QR and Store Badges Container */}
                <div className="bg-[#0D1017] border border-[#1E2533] rounded-3xl p-8 max-w-xl mx-auto">
                    <div className="flex flex-col md:flex-row items-center gap-8">
                        <div className="flex-1 space-y-6 text-left">
                            <h2 className="text-xl font-bold text-white">Need to download <br />the app?</h2>
                            <p className="text-xs text-slate-500">Scan the QR code with your phone camera or use the buttons below to install it.</p>
                            <div className="flex flex-col sm:flex-row gap-3">
                                <a
                                    href="https://play.google.com"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex-1 flex items-center justify-center gap-3 px-4 py-3 bg-[#07090E] border border-[#1E2533] rounded-xl hover:border-slate-700 transition-all"
                                >
                                    <Play size={18} className="text-primary-orange" fill="currentColor" />
                                    <div className="text-left">
                                        <p className="text-[7px] uppercase font-black text-slate-500 leading-none mb-1">Get it on</p>
                                        <p className="text-xs font-bold text-white leading-none">Google Play</p>
                                    </div>
                                </a>
                                <a
                                    href="https://apple.com/app-store"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex-1 flex items-center justify-center gap-3 px-4 py-3 bg-[#07090E] border border-[#1E2533] rounded-xl hover:border-slate-700 transition-all"
                                >
                                    <Apple size={18} className="text-white" fill="currentColor" />
                                    <div className="text-left">
                                        <p className="text-[7px] uppercase font-black text-slate-500 leading-none mb-1">Download on the</p>
                                        <p className="text-xs font-bold text-white leading-none">App Store</p>
                                    </div>
                                </a>
                            </div>
                        </div>

                        {/* QR Code */}
                        <div className="w-full max-w-[160px] aspect-square bg-[#07090E] border border-[#1E2533] rounded-2xl p-4 flex flex-col items-center justify-center gap-2 shrink-0">
                            <div className="relative">
                                <QrCode size={100} className="text-primary-orange/80" />
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="w-8 h-8 bg-[#07090E] rounded-lg border border-[#1E2533] flex items-center justify-center font-black text-xs text-primary-orange shadow-md">S</div>
                                </div>
                            </div>
                            <p className="text-[8px] font-bold text-slate-600 uppercase tracking-wider">Scan to Download</p>
                        </div>
                    </div>
                </div>

                {/* Footer Controls */}
                <div className="flex flex-col items-center gap-4 pt-4 border-t border-[#1E2533] max-w-xl mx-auto">
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-rose-400 transition-colors uppercase tracking-widest"
                    >
                        <LogOut size={14} /> Disconnect & Sign Out
                    </button>
                    <p className="text-slate-500 text-xs">
                        Admin user? Log in with your authorized admin credentials on the <a href="/login" className="text-primary-orange hover:underline font-bold">admin portal</a>.
                    </p>
                </div>
            </div>
        </div>
    );
}
