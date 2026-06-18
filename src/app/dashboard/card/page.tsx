"use client";

import React, { useState, useEffect } from 'react';
import {
    CreditCard,
    Eye,
    EyeOff,
    Lock,
    Unlock,
    Sliders,
    Zap,
    Shield,
    CheckCircle2
} from 'lucide-react';
import { useDashboard } from '@/components/layout/dashboard-context';

export default function MyCardPage() {
    const { profile } = useDashboard();
    const [frozen, setFrozen] = useState(false);
    const [showDetails, setShowDetails] = useState(false);
    const [limit, setLimit] = useState(50000); // 50,000 KES default
    const [saving, setSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);

    // Load persistent state
    useEffect(() => {
        if (profile?.id) {
            const savedFrozen = localStorage.getItem(`swiftpay_card_frozen_${profile.id}`);
            const savedLimit = localStorage.getItem(`swiftpay_card_limit_${profile.id}`);
            if (savedFrozen !== null) setFrozen(savedFrozen === 'true');
            if (savedLimit !== null) setLimit(Number(savedLimit));
        }
    }, [profile]);

    const handleFreezeToggle = () => {
        const nextState = !frozen;
        setFrozen(nextState);
        if (profile?.id) {
            localStorage.setItem(`swiftpay_card_frozen_${profile.id}`, String(nextState));
        }
    };

    const handleLimitChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = Number(e.target.value);
        setLimit(val);
    };

    const handleSaveLimit = () => {
        setSaving(true);
        setTimeout(() => {
            if (profile?.id) {
                localStorage.setItem(`swiftpay_card_limit_${profile.id}`, String(limit));
            }
            setSaving(false);
            setSaveSuccess(true);
            setTimeout(() => setSaveSuccess(false), 2000);
        }, 600);
    };

    return (
        <div className="space-y-6">
            {/* 1. Header */}
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-xl font-black tracking-tight">Virtual Card</h1>
                    <p className="text-xs text-slate-500">Fast local shopping & international payments</p>
                </div>
                <span className={`text-[9px] font-black uppercase px-2 py-1 rounded-full ${frozen ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'}`}>
                    {frozen ? 'FROZEN' : 'ACTIVE'}
                </span>
            </div>

            {/* 2. Glassmorphic Debit Card */}
            <div className="relative aspect-[1.586/1] w-full bg-gradient-to-tr from-slate-900 via-slate-900 to-orange-500/10 border border-slate-800 rounded-[2.5rem] p-6 flex flex-col justify-between overflow-hidden shadow-2xl group transition-all duration-500">
                {/* Shiny gloss backdrop reflection */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/10 blur-[60px] rounded-full pointer-events-none -z-10 group-hover:bg-orange-500/15 transition-all duration-500" />
                
                {/* Frozen Overlay */}
                {frozen && (
                    <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-md flex flex-col items-center justify-center space-y-2 z-10 animate-in fade-in duration-300">
                        <Lock className="text-rose-400" size={32} />
                        <h3 className="font-black text-sm text-white uppercase tracking-widest">Card is Frozen</h3>
                        <p className="text-[10px] text-slate-500">Unfreeze your card to execute payments</p>
                    </div>
                )}

                {/* Top of Card */}
                <div className="flex justify-between items-start">
                    <div className="space-y-1">
                        <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest leading-none">SwiftPay Premium</p>
                        <h2 className="text-sm font-black text-white italic tracking-tight">Visa Debit</h2>
                    </div>
                    <div className="w-10 h-7 bg-slate-800/80 rounded-lg flex items-center justify-center border border-slate-700/50">
                        {/* Chip Mockup */}
                        <div className="w-7 h-5 bg-gradient-to-tr from-amber-400/50 to-amber-200/50 rounded-sm" />
                    </div>
                </div>

                {/* Card Details Panel */}
                <div className="space-y-4">
                    {/* Card Number */}
                    <div className="space-y-1">
                        <h3 className="text-lg md:text-xl font-bold font-mono tracking-[0.2em] text-white">
                            {showDetails ? "4302 8589 1229 9005" : "••••  ••••  ••••  9005"}
                        </h3>
                    </div>

                    {/* Expiry and CVV */}
                    <div className="flex gap-10 items-end">
                        <div className="space-y-0.5">
                            <p className="text-[7px] font-bold text-slate-500 uppercase tracking-wider">Expiry Date</p>
                            <p className="text-xs font-bold font-mono text-white">{showDetails ? "09 / 30" : "•• / ••"}</p>
                        </div>
                        <div className="space-y-0.5">
                            <p className="text-[7px] font-bold text-slate-500 uppercase tracking-wider">CVV Code</p>
                            <p className="text-xs font-bold font-mono text-white">{showDetails ? "499" : "•••"}</p>
                        </div>
                    </div>
                </div>

                {/* Bottom of Card */}
                <div className="flex justify-between items-end">
                    <h4 className="font-bold text-xs text-slate-300 uppercase tracking-tight">
                        {profile?.fullName || "SwiftPay Customer"}
                    </h4>
                    {/* Tiny visual eye details toggle */}
                    <button
                        onClick={() => setShowDetails(!showDetails)}
                        className="px-3 py-1.5 bg-slate-850 hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl text-[10px] font-bold flex items-center gap-1.5 border border-slate-800/80 transition-all select-none"
                    >
                        {showDetails ? <EyeOff size={12} /> : <Eye size={12} />}
                        <span>{showDetails ? 'Hide Details' : 'Show Details'}</span>
                    </button>
                </div>
            </div>

            {/* 3. Freeze Toggle Control */}
            <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${frozen ? 'bg-rose-500/10 text-rose-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                        {frozen ? <Lock size={18} /> : <Unlock size={18} />}
                    </div>
                    <div>
                        <h3 className="font-bold text-xs text-white">Freeze Virtual Card</h3>
                        <p className="text-[10px] text-slate-500 mt-0.5">Lock card to block unapproved purchases</p>
                    </div>
                </div>
                <button
                    onClick={handleFreezeToggle}
                    className={`w-12 h-6 rounded-full p-1 transition-all duration-300 focus:outline-none flex items-center ${frozen ? 'bg-rose-600 justify-end' : 'bg-slate-800 justify-start'}`}
                >
                    <span className="w-4 h-4 bg-white rounded-full shadow-md transform transition-all duration-300" />
                </button>
            </div>

            {/* 4. Limits Control Slider */}
            <div className="p-5 bg-slate-900 border border-slate-800 rounded-3xl space-y-4">
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-slate-850 text-slate-400 rounded-lg flex items-center justify-center">
                            <Sliders size={16} />
                        </div>
                        <div>
                            <h3 className="font-bold text-xs text-white">Daily Spending Limit</h3>
                            <p className="text-[9px] text-slate-500 mt-0.5">Applies to all online transactions</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <span className="text-sm font-black text-orange-400 font-mono">
                            {limit.toLocaleString()} KES
                        </span>
                    </div>
                </div>

                <div className="space-y-2 pt-2">
                    <input
                        type="range"
                        min={5000}
                        max={250000}
                        step={5000}
                        value={limit}
                        onChange={handleLimitChange}
                        disabled={frozen}
                        className="w-full h-1.5 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-orange-600 disabled:opacity-30 disabled:cursor-not-allowed"
                    />
                    <div className="flex justify-between text-[8px] font-bold text-slate-600">
                        <span>Min: 5,000 KES</span>
                        <span>Max: 250,000 KES</span>
                    </div>
                </div>

                <button
                    onClick={handleSaveLimit}
                    disabled={frozen || saving}
                    className="w-full py-3 bg-slate-950 hover:bg-slate-850 disabled:bg-slate-950/30 text-slate-300 hover:text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all border border-slate-800 select-none"
                >
                    {saving ? 'Saving...' : saveSuccess ? (
                        <span className="text-emerald-400 flex items-center gap-1.5">
                            <CheckCircle2 size={14} /> Limit Saved!
                        </span>
                    ) : 'Save New Limit'}
                </button>
            </div>

            {/* 5. Features Grid Info */}
            <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-slate-905 border border-slate-800/60 rounded-2xl flex gap-3">
                    <Shield size={18} className="text-orange-500 shrink-0 mt-0.5" />
                    <div>
                        <h4 className="font-bold text-xs text-white leading-tight">3D Secure</h4>
                        <p className="text-[9px] text-slate-500 mt-1 leading-relaxed">Protected by OTP alerts via email/SMS.</p>
                    </div>
                </div>
                <div className="p-4 bg-slate-905 border border-slate-800/60 rounded-2xl flex gap-3">
                    <Zap size={18} className="text-orange-500 shrink-0 mt-0.5" />
                    <div>
                        <h4 className="font-bold text-xs text-white leading-tight">Zero Fees</h4>
                        <p className="text-[9px] text-slate-500 mt-1 leading-relaxed">Free digital issuances and zero annual charges.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
