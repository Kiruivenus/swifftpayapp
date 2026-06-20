"use client";

import React, { useState, useEffect, useCallback } from 'react';
import {
    ShieldAlert,
    Smartphone,
    Monitor,
    LogOut,
    Globe,
    Lock,
    UserX,
    Search,
    Fingerprint,
    Loader2,
    RefreshCw,
    Shield
} from 'lucide-react';
import { adminService } from '@/services/admin.service';

export default function SecuritySessionsPage() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [data, setData] = useState<any>(null);
    const [searchQuery, setSearchQuery] = useState('');

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const res = await adminService.getSessionsOverview({ q: searchQuery });
            if (res.success) {
                setData(res);
            }
        } catch (err: any) {
            alert(err.message);
        } finally {
            setLoading(false);
        }
    }, [searchQuery]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleRevokeSession = async (sessionId: string) => {
        if (!confirm("Are you sure you want to revoke this session? The user will be logged out immediately.")) return;
        try {
            setSaving(true);
            await adminService.revokeSession(sessionId);
            await fetchData();
        } catch (err: any) {
            alert(err.message);
        } finally {
            setSaving(false);
        }
    };

    const handleRevokeAll = async (scope: 'me' | 'all') => {
        const msg = scope === 'all'
            ? "CRITICAL: This will log out EVERY user and admin from the platform. Proceed?"
            : "Log out of all your active sessions?";

        if (!confirm(msg)) return;

        try {
            setSaving(true);
            await adminService.revokeAllSessions(undefined);
            await fetchData();
            alert("Sessions revoked successfully.");
        } catch (err: any) {
            alert(err.message);
        } finally {
            setSaving(false);
        }
    };

    const handleToggleTrust = async (sessionId: string, currentStatus: boolean) => {
        try {
            setSaving(true);
            await adminService.trustDevice(sessionId, !currentStatus);
            await fetchData();
        } catch (err: any) {
            alert(err.message);
        } finally {
            setSaving(false);
        }
    };

    const handleUpdatePolicy = async (field: string, value: any) => {
        try {
            setSaving(true);
            await adminService.updateSecurityPolicies({ [field]: value });
            await fetchData();
        } catch (err: any) {
            alert(err.message);
        } finally {
            setSaving(false);
        }
    };

    if (loading && !data) {
        return (
            <div className="h-[60vh] flex flex-col items-center justify-center gap-4 text-slate-500 font-sans">
                <Loader2 className="animate-spin text-primary-orange" size={40} />
                <p className="font-bold uppercase tracking-widest text-xs animate-pulse">Loading security state...</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-700 font-sans">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h2 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
                        <Shield className="text-primary-orange" size={32} />
                        Security & Sessions
                    </h2>
                    <p className="text-slate-400 mt-1">Monitor active connections, manage trusted devices, and handle security incidents.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => fetchData()}
                        disabled={loading}
                        className="p-2.5 bg-[#0D1017] hover:bg-white/[0.02] border border-[#1E2533] text-slate-300 rounded-xl transition-all outline-none"
                    >
                        <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
                    </button>
                    <button
                        onClick={() => handleRevokeAll('all')}
                        disabled={saving}
                        className="flex items-center gap-2 px-6 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-rose-600/20 disabled:opacity-50 border border-rose-500/20"
                    >
                        {saving ? <Loader2 className="animate-spin" size={16} /> : <LogOut size={16} />}
                        Logout All Sessions
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Left: Active Sessions List */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-[#0D1017]/80 border border-[#1E2533] rounded-3xl overflow-hidden backdrop-blur-md shadow-2xl">
                        <div className="p-6 border-b border-[#1E2533] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <h3 className="text-base font-bold text-white uppercase tracking-wider flex items-center gap-3">
                                <Monitor className="text-primary-orange" size={22} />
                                Active Web Sessions
                            </h3>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Filter by IP or User"
                                    className="pl-9 pr-4 py-2 bg-[#07090E] border border-[#1E2533] rounded-xl text-[11px] text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-primary-orange w-48 transition-all focus:w-64"
                                />
                            </div>
                        </div>
                        <div className="divide-y divide-[#1E2533] min-h-[200px]">
                            {data?.webSessions?.length > 0 ? data.webSessions.map((session: any) => (
                                <SessionItem
                                    key={session._id}
                                    session={session}
                                    onRevoke={() => handleRevokeSession(session._id)}
                                    onTrust={() => handleToggleTrust(session._id, session.isTrusted)}
                                    isSaving={saving}
                                />
                            )) : (
                                <div className="p-12 text-center text-slate-500 text-xs font-bold uppercase tracking-wider italic">No active web sessions found.</div>
                            )}
                        </div>
                    </div>

                    <div className="bg-[#0D1017]/80 border border-[#1E2533] rounded-3xl overflow-hidden backdrop-blur-md shadow-2xl">
                        <div className="p-6 border-b border-[#1E2533]">
                            <h3 className="text-base font-bold text-white uppercase tracking-wider flex items-center gap-3">
                                <Smartphone className="text-primary-orange" size={22} />
                                Active Mobile Devices
                            </h3>
                        </div>
                        <div className="divide-y divide-[#1E2533] min-h-[150px]">
                            {data?.mobileSessions?.length > 0 ? data.mobileSessions.map((session: any) => (
                                <MobileDeviceItem
                                    key={session._id}
                                    session={session}
                                    onRevoke={() => handleRevokeSession(session._id)}
                                    onTrust={() => handleToggleTrust(session._id, session.isTrusted)}
                                    isSaving={saving}
                                />
                            )) : (
                                <div className="p-12 text-center text-slate-500 text-xs font-bold uppercase tracking-wider italic">No active mobile devices found.</div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right: Security Analytics & Alerts */}
                <div className="space-y-6">
                    <div className="bg-[#0D1017]/80 border border-[#1E2533] rounded-3xl p-6 backdrop-blur-md shadow-2xl">
                        <h3 className="text-base font-bold text-white mb-6 uppercase tracking-wider">Security Pulse (24h)</h3>
                        <div className="space-y-6">
                            <SecurityMetric label="Failed Login Attempts" value={data?.securityPulse?.failedLoginAttempts24h || 0} change="+N/A" trend="neutral" />
                            <SecurityMetric label="New Trusted Devices (7d)" value={data?.securityPulse?.newTrustedDevices7d || 0} change="+N/A" trend="neutral" />
                            <SecurityMetric label="Password Resets (7d)" value={data?.securityPulse?.passwordResets7d || 0} change="+N/A" trend="neutral" />
                        </div>
                    </div>

                    <div className="bg-rose-500/10 border border-rose-500/20 rounded-3xl p-6 backdrop-blur-md shadow-lg shadow-rose-950/10">
                        <h4 className="text-rose-400 font-bold text-xs uppercase tracking-wider mb-4 flex items-center gap-2">
                            <ShieldAlert size={18} />
                            Recent Security Alerts
                        </h4>
                        <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                            {data?.recentSecurityAlerts?.length > 0 ? data.recentSecurityAlerts.map((alert: any) => (
                                <SecurityAlertItem
                                    key={alert._id}
                                    title={alert.type.replace(/_/g, ' ')}
                                    desc={alert.message}
                                    time={new Date(alert.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    severity={alert.severity}
                                />
                            )) : (
                                <div className="text-slate-500 text-[10px] font-bold uppercase tracking-wider py-4 text-center">No recent alerts.</div>
                            )}
                        </div>
                    </div>

                    <div className="bg-[#0D1017]/80 border border-[#1E2533] rounded-3xl p-6 backdrop-blur-md shadow-2xl font-sans">
                        <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2 uppercase tracking-wider">
                            <Lock size={18} className="text-slate-500" />
                            System Policies
                        </h3>
                        <div className="space-y-3">
                            <PolicyToggle
                                label="Mandatory 2FA for Admins"
                                active={data?.policies?.mandatory2faForAdmins}
                                onToggle={() => handleUpdatePolicy('mandatory2faForAdmins', !data?.policies?.mandatory2faForAdmins)}
                                disabled={saving}
                            />
                            <PolicyToggle
                                label="Block Non-Kenyan IPs"
                                active={data?.policies?.blockNonKenyanIps}
                                onToggle={() => handleUpdatePolicy('blockNonKenyanIps', !data?.policies?.blockNonKenyanIps)}
                                disabled={saving}
                            />
                            <PolicyToggle
                                label={`Auto-expire Sessions (${data?.policies?.sessionMaxAgeHours || 8}h)`}
                                active={true}
                                onToggle={() => { }}
                                disabled={true}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function SessionItem({ session, onRevoke, onTrust, isSaving }: any) {
    const userDisplayName = session.userId?.username || "Unknown User";
    const userRole = session.userId?.role || "USER";

    return (
        <div className="p-6 flex items-center justify-between group hover:bg-white/[0.01] transition-colors">
            <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-xl bg-[#07090E] border border-[#1E2533] flex items-center justify-center ${session.isTrusted ? 'text-primary-orange' : 'text-slate-500'}`}>
                    <Monitor size={20} />
                </div>
                <div>
                    <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-white">{userDisplayName}</h4>
                        <span className="text-[9px] font-black bg-white/[0.04] text-slate-400 px-1.5 py-0.5 rounded border border-[#1E2533] uppercase tracking-widest">{userRole}</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1 font-medium">{session.deviceName || `Web Browser · ${session.browser || 'Cloud'}`}</p>
                </div>
            </div>
            <div className="hidden md:flex flex-col items-end">
                <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono">
                    <Globe size={12} className="text-slate-600" />
                    {session.ip}
                </div>
                <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest mt-1">
                    {session.geo?.city || 'Unknown'}, {session.geo?.country || 'Region'}
                </p>
            </div>
            <div className="flex items-center gap-2">
                <button
                    onClick={onTrust}
                    disabled={isSaving}
                    className={`p-2 rounded-lg border border-transparent transition-all ${session.isTrusted ? 'text-primary-orange bg-primary-orange-light border-primary-orange-border/30' : 'text-slate-600 hover:text-primary-orange hover:bg-primary-orange-light hover:border-primary-orange-border/30'}`}
                    title={session.isTrusted ? "Trusted Device" : "Mark as Trusted"}
                >
                    <Fingerprint size={16} />
                </button>
                <button
                    onClick={onRevoke}
                    disabled={isSaving}
                    className="p-2 text-slate-600 hover:text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 rounded-lg transition-all"
                    title="Force Logout"
                >
                    <LogOut size={16} />
                </button>
            </div>
        </div>
    );
}

function MobileDeviceItem({ session, onRevoke, onTrust, isSaving }: any) {
    const userDisplayName = session.userId?.username || "Unknown User";

    return (
        <div className="p-6 flex items-center justify-between group hover:bg-white/[0.01] transition-colors">
            <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-xl bg-[#07090E] border border-[#1E2533] flex items-center justify-center ${session.isTrusted ? 'text-primary-orange' : 'text-slate-500'}`}>
                    <Smartphone size={20} />
                </div>
                <div>
                    <h4 className="text-sm font-bold text-white capitalize">{session.deviceName || 'Mobile Device'}</h4>
                    <p className="text-xs text-slate-500 mt-1 font-medium">User: {userDisplayName} · {session.platform || 'Unknown OS'}</p>
                </div>
            </div>
            <div className="flex items-center gap-8">
                <div className="text-right hidden sm:block">
                    <p className="text-[9px] text-slate-600 font-bold uppercase tracking-widest leading-none mb-1.5">Last seen</p>
                    <p className="text-xs font-bold text-slate-400 font-mono">{new Date(session.lastSeenAt).toLocaleTimeString()}</p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={onTrust}
                        disabled={isSaving}
                        className={`p-2 rounded-lg border border-transparent transition-all ${session.isTrusted ? 'text-primary-orange bg-primary-orange-light border-primary-orange-border/30' : 'text-slate-800 text-slate-700'}`}
                        title={session.isTrusted ? "Trusted Device" : "Untrusted"}
                    >
                        <Fingerprint size={18} />
                    </button>
                    <button
                        onClick={onRevoke}
                        disabled={isSaving}
                        className="p-2 text-slate-600 hover:text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 rounded-lg transition-all"
                    >
                        <UserX size={16} />
                    </button>
                </div>
            </div>
        </div>
    );
}

function SecurityMetric({ label, value, change, trend }: any) {
    return (
        <div className="flex items-center justify-between border-b border-[#1E2533]/50 pb-4 last:border-0 last:pb-0">
            <div>
                <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest leading-none mb-2">{label}</p>
                <p className="text-xl font-bold text-white font-mono">{value}</p>
            </div>
            <div className="text-[9px] font-black px-2 py-1 rounded-lg border bg-white/[0.02] border-[#1E2533] text-slate-500 font-mono uppercase tracking-widest">
                {change}
            </div>
        </div>
    );
}

function SecurityAlertItem({ title, desc, time, severity }: any) {
    return (
        <div className="space-y-1.5 py-2.5 border-b border-white/5 last:border-0">
            <div className="flex items-center justify-between">
                <h5 className={`text-xs font-black uppercase tracking-wider ${severity === 'high' ? 'text-rose-400' :
                        severity === 'medium' ? 'text-amber-400' :
                            'text-blue-400'
                    }`}>{title}</h5>
                <span className="text-[9px] font-bold text-slate-600 font-mono">{time}</span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium leading-relaxed">{desc}</p>
        </div>
    );
}

function PolicyToggle({ label, active, onToggle, disabled }: any) {
    return (
        <div className="flex items-center justify-between p-3.5 rounded-xl border border-[#1E2533] bg-[#07090E]/40">
            <span className="text-xs font-bold text-slate-300">{label}</span>
            <button
                onClick={onToggle}
                disabled={disabled}
                className={`w-10 h-5 rounded-full relative transition-all shadow-inner ${active ? 'bg-emerald-600 shadow-emerald-500/20' : 'bg-slate-800'} ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
            >
                <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all shadow-md ${active ? 'left-5.5' : 'left-0.5'}`} />
            </button>
        </div>
    );
}
