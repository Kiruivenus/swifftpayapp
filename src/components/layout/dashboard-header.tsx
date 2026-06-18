"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Bell, QrCode, Gift, User } from 'lucide-react';
import { useDashboard } from './dashboard-context';

export default function DashboardHeader() {
    const { profile } = useDashboard();
    const [unreadCount, setUnreadCount] = useState(0);

    // Fetch unread notifications count
    useEffect(() => {
        const fetchUnread = async () => {
            try {
                const res = await fetch('/api/user/notifications/list');
                if (res.ok) {
                    const data = await res.json();
                    const unread = data.filter((n: any) => !n.read).length;
                    setUnreadCount(unread);
                }
            } catch (err) {
                console.error('Failed to load notifications unread count', err);
            }
        };

        fetchUnread();
        // Poll for notifications every 60s
        const interval = setInterval(fetchUnread, 60000);
        return () => clearInterval(interval);
    }, []);

    // Extract initials (e.g. "Patrick Ke" -> "PK")
    const getInitials = () => {
        if (!profile || !profile.fullName) return "SP";
        const parts = profile.fullName.trim().split(/\s+/);
        if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    };

    return (
        <header className="fixed top-0 left-0 right-0 z-40 bg-slate-950/80 backdrop-blur-xl border-b border-slate-900/50 py-3.5 px-4 md:px-6 safe-top transition-all duration-300">
            <div className="max-w-xl mx-auto flex items-center justify-between">
                {/* Left Side: Avatar, Bell, QR Scanner */}
                <div className="flex items-center gap-3">
                    {/* Initials Avatar */}
                    <Link href="/dashboard/profile" title="View Profile" className="relative group focus:outline-none">
                        {profile?.profilePhotoUrl ? (
                            <img
                                src={profile.profilePhotoUrl}
                                alt={profile.fullName || "User avatar"}
                                className="w-10 h-10 rounded-full object-cover border-2 border-slate-800 group-hover:border-orange-500 transition-all shadow-md"
                            />
                        ) : (
                            <div className="w-10 h-10 rounded-full bg-slate-900 border-2 border-slate-800 text-orange-500 font-black text-sm flex items-center justify-center tracking-tight shadow-md group-hover:border-orange-500 transition-all select-none">
                                {getInitials()}
                            </div>
                        )}
                        {/* Tiny active green dot */}
                        <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-slate-950" />
                    </Link>

                    {/* Notification Bell */}
                    <Link href="/dashboard/notifications" title="Notifications" className="w-10 h-10 rounded-full bg-slate-900/80 border border-slate-800/80 hover:border-slate-700 flex items-center justify-center text-slate-300 hover:text-white transition-all shadow-sm relative group">
                        <Bell size={18} className="group-hover:rotate-12 transition-transform" />
                        {unreadCount > 0 && (
                            <span className="absolute top-1 right-1 w-4 h-4 bg-orange-600 border border-slate-950 text-[9px] font-black text-white rounded-full flex items-center justify-center animate-pulse">
                                {unreadCount > 9 ? '9+' : unreadCount}
                            </span>
                        )}
                    </Link>

                    {/* QR Code Scanner */}
                    <Link href="/dashboard/receive" title="Receive USDT" className="w-10 h-10 rounded-full bg-slate-900/80 border border-slate-800/80 hover:border-slate-700 flex items-center justify-center text-slate-300 hover:text-white transition-all shadow-sm group">
                        <QrCode size={18} className="group-hover:scale-105 transition-transform" />
                    </Link>
                </div>

                {/* Right Side: Earn $10 Button */}
                <div>
                    <button className="flex items-center gap-2 px-3.5 py-1.5 bg-orange-600/10 hover:bg-orange-600/20 border border-orange-500/20 hover:border-orange-500/40 text-orange-400 text-xs font-black rounded-full shadow-lg shadow-orange-600/5 hover:scale-102 hover:-translate-y-0.2 active:scale-98 transition-all">
                        <Gift size={14} className="animate-bounce" />
                        <span>Earn $10</span>
                    </button>
                </div>
            </div>
        </header>
    );
}
