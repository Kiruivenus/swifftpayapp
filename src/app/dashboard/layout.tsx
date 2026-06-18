"use client";

import React from 'react';
import { DashboardProvider, useDashboard } from '@/components/layout/dashboard-context';
import DashboardHeader from '@/components/layout/dashboard-header';
import BottomNav from '@/components/layout/bottom-nav';
import { Loader2 } from 'lucide-react';

function DashboardContentWrapper({ children }: { children: React.ReactNode }) {
    const { loading, error } = useDashboard();

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 selection:bg-orange-500/30 overflow-hidden">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-[400px] bg-orange-600/10 blur-[120px] rounded-full -z-10 animate-pulse" />
                <div className="text-center space-y-6">
                    <Loader2 className="animate-spin text-orange-500 mx-auto" size={48} />
                    <div className="space-y-1">
                        <h2 className="text-lg font-black tracking-tight">Syncing SwiftPay</h2>
                        <p className="text-xs text-slate-500">Securing your session & connecting wallets...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 text-center">
                <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-8 max-w-sm space-y-4">
                    <h2 className="text-lg font-black text-rose-500">Connection Failed</h2>
                    <p className="text-xs text-slate-400">{error}</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="px-6 py-2.5 bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs rounded-xl shadow-md transition-all"
                    >
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-950 text-white pb-32 pt-24 select-none selection:bg-orange-500/20">
            {/* Background Glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-xl h-[300px] bg-orange-600/5 blur-[100px] rounded-full -z-10 pointer-events-none" />

            {/* Dashboard Header */}
            <DashboardHeader />

            {/* Sub-page Container */}
            <main className="max-w-xl mx-auto px-4 md:px-6 relative animate-in fade-in duration-300">
                {children}
            </main>

            {/* Floating Navigation Menu */}
            <BottomNav />
        </div>
    );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    return (
        <DashboardProvider>
            <DashboardContentWrapper>{children}</DashboardContentWrapper>
        </DashboardProvider>
    );
}
