"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
    Home,
    CreditCard,
    Plus,
    Send,
    RefreshCw,
    Download,
    User,
    Users,
    X
} from 'lucide-react';
import { useDashboard } from './dashboard-context';

export default function BottomNav() {
    const pathname = usePathname();
    const router = useRouter();
    const { isPayMenuOpen, setIsPayMenuOpen } = useDashboard();

    const tabs = [
        { name: 'Home', icon: Home, route: '/dashboard' },
        { name: 'Card', icon: CreditCard, route: '/dashboard/card' },
        { name: 'PayPlaceholder', icon: null, route: null }, // Center spot placeholder
        { name: 'Accounts', icon: Users, route: '/dashboard/accounts' },
        { name: 'Profile', icon: User, route: '/dashboard/profile' }
    ];

    const handleRadialAction = (route: string) => {
        setIsPayMenuOpen(false);
        router.push(route);
    };

    return (
        <>
            {/* Expanded Pay Backdrop Overlay */}
            {isPayMenuOpen && (
                <div
                    onClick={() => setIsPayMenuOpen(false)}
                    className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-45 flex items-center justify-center animate-in fade-in duration-300"
                >
                    {/* Dimming background */}
                    <div className="absolute inset-0" />

                    {/* Radial Floating Menu Buttons Container */}
                    <div
                        onClick={(e) => e.stopPropagation()}
                        className="relative w-full max-w-xs aspect-square flex items-center justify-center pointer-events-none"
                    >
                        {/* 1. Add Money / Deposit (Top-Left) */}
                        <button
                            onClick={() => handleRadialAction('/dashboard/deposit')}
                            className="absolute -translate-x-14 -translate-y-14 w-14 h-14 bg-gradient-to-tr from-orange-600 to-amber-500 text-white rounded-full flex flex-col items-center justify-center shadow-lg shadow-orange-600/20 hover:scale-110 active:scale-95 transition-all duration-300 pointer-events-auto group animate-in slide-in-from-bottom-2 duration-300 delay-50"
                        >
                            <Plus size={20} />
                            <span className="text-[9px] font-black uppercase tracking-tight mt-0.5">Add</span>
                        </button>

                        {/* 2. Send / Transfer (Top-Right) */}
                        <button
                            onClick={() => handleRadialAction('/dashboard/transfer')}
                            className="absolute translate-x-14 -translate-y-14 w-14 h-14 bg-gradient-to-tr from-orange-600 to-amber-500 text-white rounded-full flex flex-col items-center justify-center shadow-lg shadow-orange-600/20 hover:scale-110 active:scale-95 transition-all duration-300 pointer-events-auto group animate-in slide-in-from-bottom-2 duration-300 delay-100"
                        >
                            <Send size={18} />
                            <span className="text-[9px] font-black uppercase tracking-tight mt-0.5">Send</span>
                        </button>

                        {/* 3. Exchange / Convert (Bottom-Left) */}
                        <button
                            onClick={() => handleRadialAction('/dashboard/convert')}
                            className="absolute -translate-x-14 translate-y-14 w-14 h-14 bg-gradient-to-tr from-orange-600 to-amber-500 text-white rounded-full flex flex-col items-center justify-center shadow-lg shadow-orange-600/20 hover:scale-110 active:scale-95 transition-all duration-300 pointer-events-auto group animate-in slide-in-from-bottom-2 duration-300 delay-150"
                        >
                            <RefreshCw size={18} />
                            <span className="text-[9px] font-black uppercase tracking-tight mt-0.5">Convert</span>
                        </button>

                        {/* 4. Request (Bottom-Right) */}
                        <button
                            onClick={() => handleRadialAction('/dashboard/request')}
                            className="absolute translate-x-14 translate-y-14 w-14 h-14 bg-gradient-to-tr from-orange-600 to-amber-500 text-white rounded-full flex flex-col items-center justify-center shadow-lg shadow-orange-600/20 hover:scale-110 active:scale-95 transition-all duration-300 pointer-events-auto group animate-in slide-in-from-bottom-2 duration-300 delay-200"
                        >
                            <Download size={18} />
                            <span className="text-[9px] font-black uppercase tracking-tight mt-0.5">Request</span>
                        </button>
                    </div>
                </div>
            )}

            {/* Bottom Nav Bar */}
            <div className="fixed bottom-6 left-4 right-4 z-49 max-w-md mx-auto pointer-events-none">
                <div className="bg-slate-900/90 border border-slate-800/80 rounded-3xl py-3.5 px-4 backdrop-blur-xl shadow-2xl flex items-center justify-between pointer-events-auto">
                    {tabs.map((tab, idx) => {
                        if (idx === 2) {
                            // Center Pay Button
                            return (
                                <div key="pay-center-btn" className="relative -top-7 flex flex-col items-center">
                                    <button
                                        onClick={() => setIsPayMenuOpen(!isPayMenuOpen)}
                                        className={`w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 hover:scale-105 active:scale-95 border-4 border-slate-950 select-none ${
                                            isPayMenuOpen
                                                ? 'bg-slate-800 text-white rotate-180 shadow-slate-900/50'
                                                : 'bg-gradient-to-tr from-orange-600 to-amber-500 text-white shadow-orange-600/20'
                                        }`}
                                    >
                                        {isPayMenuOpen ? <X size={22} /> : (
                                            <div className="flex flex-col items-center leading-none">
                                                <Plus size={16} className="-mb-0.5" />
                                                <span className="text-[7px] font-black uppercase tracking-widest">Pay</span>
                                            </div>
                                        )}
                                    </button>
                                </div>
                            );
                        }

                        const Icon = tab.icon!;
                        const isActive = pathname === tab.route;

                        return (
                            <Link
                                key={tab.name}
                                href={tab.route!}
                                className="flex flex-col items-center gap-1 group py-1 px-3 focus:outline-none"
                                onClick={() => setIsPayMenuOpen(false)}
                            >
                                <Icon
                                    size={20}
                                    className={`transition-all duration-200 group-hover:scale-110 ${
                                        isActive ? 'text-orange-500 filter drop-shadow-[0_0_8px_rgba(249,115,22,0.3)]' : 'text-slate-500 group-hover:text-slate-300'
                                    }`}
                                />
                                <span
                                    className={`text-[9px] font-bold tracking-tight ${
                                        isActive ? 'text-orange-500' : 'text-slate-500 group-hover:text-slate-300'
                                    }`}
                                >
                                    {tab.name}
                                </span>
                            </Link>
                        );
                    })}
                </div>
            </div>
        </>
    );
}
