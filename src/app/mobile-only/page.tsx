"use client";

import React from 'react';
import Link from 'next/link';
import {
    Smartphone,
    Download,
    ShieldCheck,
    ArrowRight,
    LogOut,
    Play,
    Apple,
    QrCode,
    Zap
} from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function MobileOnlyPage() {
    const router = useRouter();

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
        <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 selection:bg-indigo-500/30 overflow-hidden">
            {/* Background Decor */}
            <div className="absolute top-1/4 -left-20 w-80 h-80 bg-indigo-600/10 blur-[100px] rounded-full -z-10" />
            <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-blue-600/5 blur-[100px] rounded-full -z-10" />

            <div className="w-full max-w-2xl space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700 text-center">
                {/* Logo */}
                <div className="space-y-4">
                    <Link href="/" className="inline-flex items-center gap-3 group">
                        <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-600/20 group-hover:scale-110 transition-transform">
                            <span className="font-bold text-2xl text-white">S</span>
                        </div>
                    </Link>
                    <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Full SwiftPay Experience is on Mobile</h1>
                    <p className="text-slate-500 text-lg max-w-lg mx-auto leading-relaxed">
                        For individual users, our mobile app provides the most secure and feature-rich way to manage your assets.
                    </p>
                </div>

                {/* Feature Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
                    <div className="p-6 bg-slate-900/40 border border-slate-800 rounded-3xl backdrop-blur-md">
                        <div className="w-10 h-10 bg-indigo-500/10 text-indigo-400 rounded-xl flex items-center justify-center mb-4">
                            <Zap size={20} />
                        </div>
                        <h3 className="font-bold text-white mb-2">Instant M-Pesa</h3>
                        <p className="text-xs text-slate-500 leading-relaxed">Direct integration for lightning-fast deposits and withdrawals via Safaricom.</p>
                    </div>
                    <div className="p-6 bg-slate-900/40 border border-slate-800 rounded-3xl backdrop-blur-md">
                        <div className="w-10 h-10 bg-indigo-500/10 text-indigo-400 rounded-xl flex items-center justify-center mb-4">
                            <ShieldCheck size={20} />
                        </div>
                        <h3 className="font-bold text-white mb-2">Biometric Security</h3>
                        <p className="text-xs text-slate-500 leading-relaxed">Secure your wallet with FaceID or Fingerprint for peace of mind.</p>
                    </div>
                </div>

                {/* Action Card */}
                <div className="bg-slate-900/50 border border-slate-800 rounded-[3rem] p-10 md:p-14 backdrop-blur-xl shadow-2xl relative overflow-hidden group">
                    <div className="flex flex-col md:flex-row items-center gap-12">
                        <div className="flex-1 space-y-8 text-left">
                            <h2 className="text-2xl font-bold text-white">Ready to start? <br /><span className="text-indigo-400">Scan to download.</span></h2>

                            <div className="flex gap-4">
                                <button className="flex-1 flex items-center gap-3 px-4 py-3 bg-slate-950 border border-slate-800 rounded-2xl hover:border-slate-700 transition-all">
                                    <Play size={20} className="text-indigo-500" fill="currentColor" />
                                    <div className="text-left">
                                        <p className="text-[8px] uppercase font-black text-slate-500 leading-none mb-1">Get it on</p>
                                        <p className="text-xs font-bold text-white leading-none">Google Play</p>
                                    </div>
                                </button>
                                <button className="flex-1 flex items-center gap-3 px-4 py-3 bg-slate-950 border border-slate-800 rounded-2xl hover:border-slate-700 transition-all">
                                    <Apple size={20} className="text-white" fill="currentColor" />
                                    <div className="text-left">
                                        <p className="text-[8px] uppercase font-black text-slate-500 leading-none mb-1">Download on</p>
                                        <p className="text-xs font-bold text-white leading-none">App Store</p>
                                    </div>
                                </button>
                            </div>

                            <button
                                onClick={handleLogout}
                                className="mt-4 flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-rose-400 transition-colors uppercase tracking-widest"
                            >
                                <LogOut size={14} /> Finish & Sign Out
                            </button>
                        </div>

                        {/* QR Component */}
                        <div className="w-full max-w-[200px] aspect-square bg-slate-950 border border-slate-800 rounded-3xl p-6 flex flex-col items-center justify-center gap-4 group">
                            <div className="relative">
                                <QrCode size={120} className="text-indigo-500 opacity-80 group-hover:opacity-100 transition-opacity" />
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="w-10 h-10 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-center font-black text-xs text-indigo-400">S</div>
                                </div>
                            </div>
                            <p className="text-[10px] font-bold text-slate-600 uppercase tracking-tighter">Point camera to scan</p>
                        </div>
                    </div>
                </div>

                {/* Bottom Contact */}
                <p className="text-slate-500 text-sm font-medium">
                    Need help? Contact our support at <span className="text-slate-300">support@swiftpay.ke</span>
                </p>
            </div>
        </div>
    );
}
