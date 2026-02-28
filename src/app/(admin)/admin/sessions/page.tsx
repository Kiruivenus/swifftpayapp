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
            // If scope is 'all', pass no userId (global). If 'me', we'd need current admin ID.
            // For now, let's assume 'all' for the global button as per prompt.
            await adminService.revokeAllSessions(scope === 'me' ? undefined : undefined);
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
            <div className="h-[60vh] flex flex-col items-center justify-center gap-4 text-slate-500">
                <Loader2 className="animate-spin text-indigo-500" size={40} />
                <p className="font-medium animate-pulse">Loading security state...</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h2 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
                        <Shield className="text-indigo-400" size={32} />
                        Security & Sessions
                    </h2>
                    <p className="text-slate-400 mt-1">Monitor active connections, manage trusted devices, and handle security incidents.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => fetchData()}
                        disabled={loading}
                        className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-all"
                    >
                        <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
                    </button>
                    <button
                        onClick={() => handleRevokeAll('all')}
                        disabled={saving}
                        className="flex items-center gap-2 px-6 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-semibold rounded-xl transition-all shadow-lg shadow-rose-600/20 disabled:opacity-50"
                    >
                        {saving ? <Loader2 className="animate-spin" size={18} /> : <LogOut size={18} />}
                        Logout All Sessions
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Left: Active Sessions List */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-slate-900/50 border border-slate-800 rounded-3xl overflow-hidden backdrop-blur-sm">
                        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
                            <h3 className="text-lg font-bold text-white flex items-center gap-3">
                                <Monitor className="text-indigo-400" size={24} />
                                Active Web & Browser Sessions
                            </h3>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Filter by IP or User"
                                    className="pl-9 pr-4 py-2 bg-slate-950/50 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500/50 w-48 transition-all focus:w-64"
                                />
                            </div>
                        </div>
                        <div className="divide-y divide-slate-800 min-h-[200px]">
                            {data?.webSessions?.length > 0 ? data.webSessions.map((session: any) => (
                                <SessionItem
                                    key={session._id}
                                    session={session}
                                    onRevoke={() => handleRevokeSession(session._id)}
                                    onTrust={() => handleToggleTrust(session._id, session.isTrusted)}
                                    isSaving={saving}
                                />
                            )) : (
                                <div className="p-12 text-center text-slate-500 text-sm italic">No active web sessions found.</div>
                            )}
                        </div>
                    </div>

                    <div className="bg-slate-900/50 border border-slate-800 rounded-3xl overflow-hidden backdrop-blur-sm">
                        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
                            <h3 className="text-lg font-bold text-white flex items-center gap-3">
                                <Smartphone className="text-indigo-400" size={24} />
                                Active Mobile Devices
                            </h3>
                        </div>
                        <div className="divide-y divide-slate-800 min-h-[150px]">
                            {data?.mobileSessions?.length > 0 ? data.mobileSessions.map((session: any) => (
                                <MobileDeviceItem
                                    key={session._id}
                                    session={session}
                                    onRevoke={() => handleRevokeSession(session._id)}
                                    onTrust={() => handleToggleTrust(session._id, session.isTrusted)}
                                    isSaving={saving}
                                />
                            )) : (
                                <div className="p-12 text-center text-slate-500 text-sm italic">No active mobile devices found.</div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right: Security Analytics & Alerts */}
                <div className="space-y-6">
                    <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-6 backdrop-blur-sm">
                        <h3 className="text-lg font-bold text-white mb-6">Security Pulse (24h)</h3>
                        <div className="space-y-6">
                            <SecurityMetric label="Failed Login Attempts" value={data?.securityPulse?.failedLoginAttempts24h || 0} change="+N/A" trend="neutral" />
                            <SecurityMetric label="New Trusted Devices (7d)" value={data?.securityPulse?.newTrustedDevices7d || 0} change="+N/A" trend="neutral" />
                            <SecurityMetric label="Password Resets (7d)" value={data?.securityPulse?.passwordResets7d || 0} change="+N/A" trend="neutral" />
                        </div>
                    </div>

                    <div className="bg-rose-500/10 border border-rose-500/20 rounded-3xl p-6 backdrop-blur-sm">
                        <h4 className="text-rose-400 font-bold mb-4 flex items-center gap-2">
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
                                <div className="text-slate-500 text-xs py-4 text-center">No recent alerts.</div>
                            )}
                        </div>
                    </div>

                    <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-6 backdrop-blur-sm">
                        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                            <Lock size={18} className="text-slate-400" />
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
                                active={true} // Visual only since it's hard to toggle "feature"
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
        <div className="p-6 flex items-center justify-between group hover:bg-slate-800/10 transition-colors">
            <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center ${session.isTrusted ? 'text-indigo-400' : 'text-slate-500'}`}>
                    <Monitor size={20} />
                </div>
                <div>
                    <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-white">{userDisplayName}</h4>
                        <span className="text-[9px] font-black bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded uppercase">{userRole}</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">{session.deviceName || `Web Browser · ${session.browser || 'Cloud'}`}</p>
                </div>
            </div>
            <div className="hidden md:flex flex-col items-end">
                <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium tracking-tight">
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
                    className={`p-2 rounded-lg transition-all ${session.isTrusted ? 'text-indigo-400 bg-indigo-500/10' : 'text-slate-600 hover:text-indigo-400 hover:bg-indigo-500/10'}`}
                    title={session.isTrusted ? "Trusted Device" : "Mark as Trusted"}
                >
                    <Fingerprint size={16} />
                </button>
                <button
                    onClick={onRevoke}
                    disabled={isSaving}
                    className="p-2 text-slate-600 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all"
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
        <div className="p-6 flex items-center justify-between group hover:bg-slate-800/10 transition-colors">
            <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center ${session.isTrusted ? 'text-indigo-400' : 'text-slate-500'}`}>
                    <Smartphone size={20} />
                </div>
                <div>
                    <h4 className="text-sm font-bold text-white">{session.deviceName || 'Mobile Device'}</h4>
                    <p className="text-xs text-slate-500 mt-0.5">User: {userDisplayName} · {session.platform || 'Unknown OS'}</p>
                </div>
            </div>
            <div className="flex items-center gap-8">
                <div className="text-right hidden sm:block">
                    <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest leading-none mb-1">Last seen</p>
                    <p className="text-xs font-bold text-slate-400">{new Date(session.lastSeenAt).toLocaleTimeString()}</p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={onTrust}
                        disabled={isSaving}
                        className={`p-2 rounded-lg transition-all ${session.isTrusted ? 'text-indigo-400 bg-indigo-500/10' : 'text-slate-800 text-slate-700'}`}
                        title={session.isTrusted ? "Trusted Device" : "Untrusted"}
                    >
                        <Fingerprint size={18} />
                    </button>
                    <button
                        onClick={onRevoke}
                        disabled={isSaving}
                        className="p-2 text-slate-600 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all"
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
        <div className="flex items-center justify-between">
            <div>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest leading-none mb-1">{label}</p>
                <p className="text-xl font-bold text-white">{value}</p>
            </div>
            <div className={`text-[10px] font-black px-2 py-1 rounded-lg ${trend === 'up' ? 'text-rose-400 bg-rose-500/5' :
                    trend === 'down' ? 'text-emerald-400 bg-emerald-500/5' :
                        'text-slate-500 bg-slate-500/5'
                }`}>
                {change}
            </div>
        </div>
    );
}

function SecurityAlertItem({ title, desc, time, severity }: any) {
    return (
        <div className="space-y-1.5 py-1 border-b border-slate-800/30 last:border-0">
            <div className="flex items-center justify-between">
                <h5 className={`text-xs font-bold ${severity === 'high' ? 'text-rose-400' :
                        severity === 'medium' ? 'text-amber-400' :
                            'text-blue-400'
                    }`}>{title}</h5>
                <span className="text-[9px] font-bold text-slate-600">{time}</span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium leading-relaxed">{desc}</p>
        </div>
    );
}

function PolicyToggle({ label, active, onToggle, disabled }: any) {
    return (
        <div className="flex items-center justify-between p-3 rounded-xl border border-slate-800 bg-slate-950/20">
            <span className="text-xs font-bold text-slate-300">{label}</span>
            <button
                onClick={onToggle}
                disabled={disabled}
                className={`w-8 h-4 rounded-full relative transition-all ${active ? 'bg-emerald-600' : 'bg-slate-800'} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
                <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all ${active ? 'left-4.5' : 'left-0.5'}`} />
            </button>
        </div>
    );
}
