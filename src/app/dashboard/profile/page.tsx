"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    User,
    Mail,
    Phone,
    ShieldAlert,
    LogOut,
    CheckCircle2,
    Clock,
    AlertTriangle,
    ChevronRight,
    MapPin,
    Globe2,
    Lock
} from 'lucide-react';
import { useDashboard } from '@/components/layout/dashboard-context';

export default function MobileProfilePage() {
    const { profile, refreshData } = useDashboard();
    const [loggingOut, setLoggingOut] = useState(false);
    const router = useRouter();

    const handleLogout = async () => {
        setLoggingOut(true);
        try {
            await fetch('/api/auth/logout', { method: 'POST' });
            router.push('/login');
        } catch (error) {
            console.error('Logout failed:', error);
            router.push('/login');
        }
    };

    // KYC Status helpers
    const getKycBadge = () => {
        switch (profile?.kycStatus) {
            case 'APPROVED':
                return {
                    label: 'Approved / Fully Verified',
                    color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
                    icon: CheckCircle2
                };
            case 'PENDING':
                return {
                    label: 'Verification Pending',
                    color: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
                    icon: Clock
                };
            case 'REJECTED':
                return {
                    label: `Rejected: ${profile.kycRejectionReason || 'Invalid documents'}`,
                    color: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
                    icon: AlertTriangle
                };
            default:
                return {
                    label: 'Not Started (Action Required)',
                    color: 'text-slate-400 bg-slate-500/10 border-slate-500/20',
                    icon: ShieldAlert
                };
        }
    };

    const KycBadgeIcon = getKycBadge().icon;

    return (
        <div className="space-y-6">
            {/* 1. Header Avatar Profile */}
            <div className="flex flex-col items-center justify-center text-center space-y-3 py-4">
                <div className="relative">
                    {profile?.profilePhotoUrl ? (
                        <img
                            src={profile.profilePhotoUrl}
                            alt={profile.fullName || "User Avatar"}
                            className="w-20 h-20 rounded-full object-cover border-4 border-slate-800 shadow-2xl"
                        />
                    ) : (
                        <div className="w-20 h-20 rounded-full bg-slate-900 border-4 border-slate-800 text-orange-500 text-3xl font-black flex items-center justify-center shadow-2xl tracking-tighter select-none">
                            {profile?.fullName ? profile.fullName.slice(0, 2).toUpperCase() : 'SP'}
                        </div>
                    )}
                    <span className="absolute bottom-1.5 right-1.5 w-4 h-4 bg-emerald-500 rounded-full border-4 border-slate-950 shadow-md" />
                </div>
                <div className="space-y-0.5">
                    <h2 className="text-lg font-black text-white">{profile?.fullName || 'SwiftPay User'}</h2>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">@{profile?.username || 'user'}</p>
                </div>
            </div>

            {/* 2. KYC Status Gating */}
            <div className={`p-4 rounded-2xl border ${getKycBadge().color} flex items-center justify-between gap-4`}>
                <div className="flex items-center gap-3">
                    <div className="shrink-0">
                        <KycBadgeIcon size={20} />
                    </div>
                    <div>
                        <h4 className="font-bold text-xs">KYC Verification Status</h4>
                        <p className="text-[10px] mt-0.5 opacity-80 leading-snug">{getKycBadge().label}</p>
                    </div>
                </div>
                {profile?.kycStatus === 'NOT_STARTED' && (
                    <button className="px-3.5 py-1.5 bg-orange-600 hover:bg-orange-500 text-white font-black text-[10px] rounded-lg shadow-md transition-all select-none uppercase tracking-widest">
                        Verify
                    </button>
                )}
            </div>

            {/* 3. Account Details Info */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden">
                <div className="p-4 border-b border-slate-800/60">
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">Personal Information</h3>
                </div>

                <div className="divide-y divide-slate-850">
                    {/* Email */}
                    <div className="p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Mail size={16} className="text-slate-500" />
                            <div>
                                <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Email Address</p>
                                <p className="text-xs font-bold text-white mt-0.5">{profile?.email || 'N/A'}</p>
                            </div>
                        </div>
                    </div>

                    {/* Phone */}
                    <div className="p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Phone size={16} className="text-slate-500" />
                            <div>
                                <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Mobile Number</p>
                                <p className="text-xs font-bold text-white mt-0.5">{profile?.phone || 'N/A'}</p>
                            </div>
                        </div>
                    </div>

                    {/* Nationality */}
                    {profile?.nationalityName && (
                        <div className="p-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Globe2 size={16} className="text-slate-500" />
                                <div>
                                    <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Nationality</p>
                                    <p className="text-xs font-bold text-white mt-0.5">{profile.nationalityName}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Residential Address */}
                    {profile?.residentialAddress && (
                        <div className="p-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <MapPin size={16} className="text-slate-500" />
                                <div>
                                    <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Residential Address</p>
                                    <p className="text-xs font-bold text-white mt-0.5">{profile.residentialAddress}</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* 4. Security Options & Logout */}
            <div className="space-y-3">
                {/* Reset PIN Mock */}
                <button
                    onClick={() => router.push('/dashboard/reset-pin')}
                    className="w-full p-4 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-between hover:border-slate-750 transition-all select-none group text-left"
                >
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-slate-850 text-slate-400 rounded-lg flex items-center justify-center group-hover:text-white transition-all">
                            <Lock size={16} />
                        </div>
                        <div>
                            <h4 className="font-bold text-xs text-white leading-tight">Security PIN Options</h4>
                            <p className="text-[9px] text-slate-500 mt-0.5">Reset or configure wallet security PINs</p>
                        </div>
                    </div>
                    <ChevronRight size={16} className="text-slate-500 group-hover:text-white transition-all" />
                </button>

                {/* Logout Button */}
                <button
                    onClick={handleLogout}
                    disabled={loggingOut}
                    className="w-full py-4 bg-rose-600/10 hover:bg-rose-600 border border-rose-500/20 hover:border-rose-500/40 disabled:bg-slate-900 disabled:text-slate-600 text-rose-400 hover:text-white font-black rounded-2xl flex items-center justify-center gap-2.5 transition-all text-xs uppercase tracking-widest shadow-xl shadow-rose-600/5 select-none"
                >
                    <LogOut size={16} />
                    <span>{loggingOut ? 'Signing out...' : 'Finish & Sign Out'}</span>
                </button>
            </div>
        </div>
    );
}
