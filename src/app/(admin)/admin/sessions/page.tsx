"use client";

import React, { useState, useEffect, useCallback } from 'react';
import {
    Shield,
    Activity,
    Globe,
    Lock,
    UserX,
    Search,
    Fingerprint,
    Loader2,
    RefreshCw,
    LogOut,
    Smartphone,
    Monitor,
    AlertTriangle,
    Sliders,
    X,
    CheckCircle2,
    Trash2,
    Play,
    Check,
    Upload,
    ShieldAlert,
    Skull,
    MapPin,
    AlertOctagon,
    HardDrive,
    Terminal,
    ArrowRight,
    LockKeyhole,
    Clock,
    UserCheck,
    FileSpreadsheet,
    PlayCircle,
    History
} from 'lucide-react';
import { adminService } from '@/services/admin.service';

export default function SecuritySessionsPage() {
    const [activeTab, setActiveTab] = useState<'dashboard' | 'sessions' | 'devices' | 'incidents' | 'policies' | 'forensics'>('dashboard');

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    
    // Core Data States
    const [webSessions, setWebSessions] = useState<any[]>([]);
    const [mobileSessions, setMobileSessions] = useState<any[]>([]);
    const [geoLocations, setGeoLocations] = useState<any[]>([]);
    const [overview, setOverview] = useState<any>(null);
    const [securityAlerts, setSecurityAlerts] = useState<any[]>([]);
    const [policies, setPolicies] = useState<any>(null);
    const [devices, setDevices] = useState<any[]>([]);
    const [auditLogs, setAuditLogs] = useState<any[]>([]);
    const [auditPagination, setAuditPagination] = useState<any>(null);

    // Security Policies States
    const [mandatory2faForAdmins, setMandatory2faForAdmins] = useState(false);
    const [enforce2faAllUsers, setEnforce2faAllUsers] = useState(false);
    const [blockNonKenyanIps, setBlockNonKenyanIps] = useState(false);
    const [ipWhitelist, setIpWhitelist] = useState<string[]>([]);
    const [ipBlacklist, setIpBlacklist] = useState<string[]>([]);
    const [deviceRestrictionsEnabled, setDeviceRestrictionsEnabled] = useState(false);
    const [sessionMaxAgeHours, setSessionMaxAgeHours] = useState(8);
    const [maxFailedLogins, setMaxFailedLogins] = useState(5);
    const [lockoutMinutes, setLockoutMinutes] = useState(15);

    // Form Filter & Search States
    const [sessionSearch, setSessionSearch] = useState('');
    const [deviceSearch, setDeviceSearch] = useState('');
    const [alertSeverityFilter, setAlertSeverityFilter] = useState('');
    const [alertStatusFilter, setAlertStatusFilter] = useState('');
    const [auditSearch, setAuditSearch] = useState('');
    const [auditSeverity, setAuditSeverity] = useState('');
    const [auditType, setAuditType] = useState('');
    const [auditPage, setAuditPage] = useState(1);

    // Modal & Interactive states
    const [statusAlert, setStatusAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
    const [activeIncidentId, setActiveIncidentId] = useState<string | null>(null);
    const [resolutionNotes, setResolutionNotes] = useState('');
    const [emergencyActionModal, setEmergencyActionModal] = useState<string | null>(null);
    const [regionInput, setRegionInput] = useState('');
    const [targetUserResetInput, setTargetUserResetInput] = useState('');
    const [adminAuthCode, setAdminAuthCode] = useState('');
    const [renameDeviceState, setRenameDeviceState] = useState<{ deviceId: string; userId: string; deviceName: string } | null>(null);

    // WebSocket / Laravel Reverb activity log simulator state
    const [liveEvents, setLiveEvents] = useState<any[]>([
        { time: new Date().toLocaleTimeString(), message: 'SOC Center monitoring nodes active.', severity: 'success' },
        { time: new Date(Date.now() - 25000).toLocaleTimeString(), message: 'Brute-force security policies sync completed.', severity: 'info' },
        { time: new Date(Date.now() - 55000).toLocaleTimeString(), message: 'Connected to Laravel Reverb messaging broker.', severity: 'info' }
    ]);

    const triggerAlert = (type: 'success' | 'error', message: string) => {
        setStatusAlert({ type, message });
        setTimeout(() => setStatusAlert(null), 5000);
    };

    const fetchData = useCallback(async (silent = false) => {
        try {
            if (!silent) setLoading(true);

            // 1. Fetch Sessions & Overview KPIs
            const overviewRes = await adminService.getSessionsOverview({ q: sessionSearch });
            if (overviewRes.success) {
                setWebSessions(overviewRes.webSessions || []);
                setMobileSessions(overviewRes.mobileSessions || []);
                setGeoLocations(overviewRes.geoLocations || []);
                setOverview(overviewRes.securityPulse);
                setPolicies(overviewRes.policies);
                setSecurityAlerts(overviewRes.recentSecurityAlerts || []);

                // Initialize policy states from database
                const sp = overviewRes.policies || {};
                setMandatory2faForAdmins(sp.mandatory2faForAdmins ?? false);
                setEnforce2faAllUsers(sp.enforce2faAllUsers ?? false);
                setBlockNonKenyanIps(sp.blockNonKenyanIps ?? false);
                setIpWhitelist(sp.ipWhitelist || []);
                setIpBlacklist(sp.ipBlacklist || []);
                setDeviceRestrictionsEnabled(sp.deviceRestrictionsEnabled ?? false);
                setSessionMaxAgeHours(sp.sessionMaxAgeHours ?? 8);
                setMaxFailedLogins(sp.maxFailedLogins ?? 5);
                setLockoutMinutes(sp.lockoutMinutes ?? 15);
            }

            // 2. Fetch Devices List
            const realDevicesRes = await adminService.getDevices().catch(() => null);
            if (realDevicesRes && realDevicesRes.success) {
                setDevices(realDevicesRes.devices || []);
            }

            // 3. Fetch Forensics Audit Logs
            const auditRes = await adminService.getSecurityAuditLogs({
                q: auditSearch,
                severity: auditSeverity,
                type: auditType,
                page: auditPage,
                limit: 25
            }).catch(() => null);
            if (auditRes && auditRes.success) {
                setAuditLogs(auditRes.logs || []);
                setAuditPagination(auditRes.pagination);
            }

        } catch (err: any) {
            console.error('Failed to load SOC telemetry:', err);
            triggerAlert('error', 'Incident load failed: ' + err.message);
        } finally {
            setLoading(false);
        }
    }, [sessionSearch, auditSearch, auditSeverity, auditType, auditPage]);

    useEffect(() => {
        fetchData();
        
        // Dynamic live polling updates every 25 seconds
        const timer = setInterval(() => {
            fetchData(true);
        }, 25000);
        return () => clearInterval(timer);
    }, [fetchData]);

    // WebSocket / Real-time activity simulator
    useEffect(() => {
        const interval = setInterval(() => {
            const mockAlerts = [
                { msg: 'Credential stuffing attempt blocked: IP 104.244.33.1', severity: 'high', statKey: 'suspiciousActivities' },
                { msg: 'New trusted device verified for admin account', severity: 'success', statKey: 'activeDevices' },
                { msg: '2FA verification code dispatched to user', severity: 'info' },
                { msg: 'Impossible travel check triggered: Login Abuja KE gap', severity: 'high', statKey: 'securityIncidents' },
                { msg: 'Suspicious cash withdrawal blocked: @martha limit lockout', severity: 'high', statKey: 'suspiciousActivities' },
                { msg: 'Admin policy altered: Lockout minutes modified', severity: 'medium' },
                { msg: 'Failed login attempt at user @joseph: Incorrect hash', severity: 'medium', statKey: 'failedLoginsToday' }
            ];

            const item = mockAlerts[Math.floor(Math.random() * mockAlerts.length)];
            const timeStr = new Date().toLocaleTimeString();
            
            setLiveEvents(prev => [{ time: timeStr, message: item.msg, severity: item.severity }, ...prev].slice(0, 15));

            // Dynamic overview stats updates on the fly
            if (item.statKey && overview) {
                setOverview((prev: any) => {
                    if (!prev) return prev;
                    return { ...prev, [item.statKey]: (prev[item.statKey] || 0) + 1 };
                });
            }
        }, 8000);
        return () => clearInterval(interval);
    }, [overview]);

    const handleRevokeSession = async (sessionId: string) => {
        if (!confirm('Verify session revocation? User will be logged out.')) return;
        try {
            setSaving(true);
            const res = await adminService.revokeSession(sessionId);
            if (res.success) {
                triggerAlert('success', 'Active session terminated.');
                await fetchData(true);
            }
        } catch (err: any) {
            triggerAlert('error', err.message);
        } finally {
            setSaving(false);
        }
    };

    const handleToggleTrust = async (sessionId: string, currentTrust: boolean) => {
        try {
            setSaving(true);
            const res = await adminService.trustDevice(sessionId, !currentTrust);
            if (res.success) {
                triggerAlert('success', currentTrust ? 'Device untrusted.' : 'Device trusted.');
                await fetchData(true);
            }
        } catch (err: any) {
            triggerAlert('error', err.message);
        } finally {
            setSaving(false);
        }
    };

    const handleDeviceAction = async (deviceId: string, userId: string, action: 'RENAME' | 'BLOCK' | 'UNBLOCK' | 'TRUST' | 'UNTRUST', newName?: string) => {
        try {
            setSaving(true);
            const res = await adminService.updateDeviceState({ deviceId, userId, action, newName });
            if (res.success) {
                triggerAlert('success', res.message || 'Device state committed.');
                setRenameDeviceState(null);
                await fetchData(true);
            }
        } catch (err: any) {
            triggerAlert('error', err.message);
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteDeviceRegistry = async (deviceId: string, userId: string) => {
        if (!confirm('Irreversibly delete device from registry?')) return;
        try {
            setSaving(true);
            const res = await adminService.deleteDeviceRegistry(deviceId, userId);
            if (res.success) {
                triggerAlert('success', 'Device removed from registry.');
                await fetchData(true);
            }
        } catch (err: any) {
            triggerAlert('error', err.message);
        } finally {
            setSaving(false);
        }
    };

    const handleResolveAlert = async () => {
        if (!activeIncidentId) return;
        try {
            setSaving(true);
            const res = await adminService.updateSecurityAlert(activeIncidentId, {
                status: 'RESOLVED',
                resolutionNotes
            });
            if (res.success) {
                triggerAlert('success', 'Security incident alert status set to RESOLVED.');
                setActiveIncidentId(null);
                setResolutionNotes('');
                await fetchData(true);
            }
        } catch (err: any) {
            triggerAlert('error', err.message);
        } finally {
            setSaving(false);
        }
    };

    const handleEscalateAlert = async (id: string) => {
        try {
            setSaving(true);
            const res = await adminService.updateSecurityAlert(id, {
                status: 'ESCALATED',
                resolutionNotes: 'Escalated to High Priority SOC tier.'
            });
            if (res.success) {
                triggerAlert('success', 'Incident escalated.');
                await fetchData(true);
            }
        } catch (err: any) {
            triggerAlert('error', err.message);
        } finally {
            setSaving(false);
        }
    };

    const handleTriggerEmergencyAction = async () => {
        if (!emergencyActionModal) return;
        if (!adminAuthCode) {
            triggerAlert('error', 'Verification code is required for emergency operations.');
            return;
        }

        try {
            setSaving(true);
            const res = await adminService.triggerEmergencyAction({
                action: emergencyActionModal as any,
                targetUserId: targetUserResetInput || undefined,
                regionCode: regionInput || undefined
            });
            if (res.success) {
                triggerAlert('success', res.message || 'Emergency action executed.');
                setEmergencyActionModal(null);
                setRegionInput('');
                setTargetUserResetInput('');
                setAdminAuthCode('');
                await fetchData(true);
            }
        } catch (err: any) {
            triggerAlert('error', err.message);
        } finally {
            setSaving(false);
        }
    };

    const handleUpdatePolicy = async (field: string, value: any) => {
        try {
            setSaving(true);
            await adminService.updateSecurityPolicies({ [field]: value });
            triggerAlert('success', 'Global policy variable modified.');
            await fetchData(true);
        } catch (err: any) {
            triggerAlert('error', err.message);
        } finally {
            setSaving(false);
        }
    };

    const handleExportAudit = (format: 'csv' | 'json') => {
        // Mock download file generation
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(auditLogs, null, 2));
        const downloadAnchor = document.createElement('a');
        downloadAnchor.setAttribute("href", dataStr);
        downloadAnchor.setAttribute("download", `security_audit_export.${format}`);
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        downloadAnchor.remove();
        triggerAlert('success', `Exported security logs in ${format.toUpperCase()} format.`);
    };

    if (loading && !overview) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 font-sans bg-[#050816]">
                <Loader2 className="animate-spin text-primary-orange" size={40} />
                <p className="text-slate-500 font-bold uppercase tracking-widest text-xs animate-pulse">Initializing administrative security node...</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-20 font-sans min-h-screen text-slate-100 bg-[#050816]">
            
            {/* Global Warning Status Alert Popup */}
            {statusAlert && (
                <div className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-6 py-4 rounded-2xl border backdrop-blur-md shadow-2xl animate-in slide-in-from-top-6 duration-300 ${
                    statusAlert.type === 'success' ? 'bg-emerald-950/95 border-emerald-500/30 text-emerald-300' : 'bg-rose-950/95 border-rose-500/30 text-rose-300'
                }`}>
                    <AlertTriangle size={18} className={statusAlert.type === 'success' ? 'text-emerald-400' : 'text-rose-400'} />
                    <p className="text-xs font-bold uppercase tracking-wider">{statusAlert.message}</p>
                </div>
            )}

            {/* Rename Device Modal */}
            {renameDeviceState && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-300">
                    <div className="bg-[#0D1017] border border-[#1E2533] w-full max-w-md rounded-3xl p-8 shadow-2xl">
                        <h4 className="text-lg font-bold text-white uppercase tracking-wider mb-2">Rename Device Registry</h4>
                        <p className="text-xs text-slate-500 mb-6">Assign a human-readable identifier for fingerprint: <span className="font-mono text-primary-orange">{renameDeviceState.deviceId}</span></p>
                        <input
                            type="text"
                            value={renameDeviceState.deviceName}
                            onChange={(e) => setRenameDeviceState({ ...renameDeviceState, deviceName: e.target.value })}
                            className="w-full px-4 py-3 bg-[#050816] border border-[#1E2533] rounded-xl text-xs text-white focus:outline-none mb-6"
                            placeholder="e.g. iPhone 15 Pro Max"
                        />
                        <div className="flex gap-3">
                            <button onClick={() => setRenameDeviceState(null)} className="flex-1 py-3 bg-white/[0.02] border border-[#1E2533] text-white font-bold text-xs uppercase tracking-widest rounded-xl hover:bg-white/[0.04]">Cancel</button>
                            <button 
                                onClick={() => handleDeviceAction(renameDeviceState.deviceId, renameDeviceState.userId, 'RENAME', renameDeviceState.deviceName)}
                                className="flex-1 py-3 bg-primary-orange text-white font-black text-xs uppercase tracking-widest rounded-xl"
                            >
                                Save Changes
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Resolve Incident Dialog Modal */}
            {activeIncidentId && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-300">
                    <div className="bg-[#0D1017] border border-[#1E2533] w-full max-w-md rounded-3xl p-8 shadow-2xl">
                        <h4 className="text-lg font-bold text-white uppercase tracking-wider mb-2">Resolve Security Incident</h4>
                        <p className="text-xs text-slate-500 mb-4">Provide forensics notes explaining resolution before closing the incident alert.</p>
                        <textarea
                            value={resolutionNotes}
                            onChange={(e) => setResolutionNotes(e.target.value)}
                            rows={3}
                            placeholder="Describe how the threat was resolved..."
                            className="w-full px-4 py-3 bg-[#050816] border border-[#1E2533] rounded-xl text-xs text-white focus:outline-none resize-none mb-6 font-semibold"
                        />
                        <div className="flex gap-3">
                            <button onClick={() => { setActiveIncidentId(null); setResolutionNotes(''); }} className="flex-1 py-3 bg-white/[0.02] border border-[#1E2533] text-white font-bold text-xs uppercase tracking-widest rounded-xl">Cancel</button>
                            <button onClick={handleResolveAlert} className="flex-1 py-3 bg-emerald-600 text-white font-black text-xs uppercase tracking-widest rounded-xl shadow-lg shadow-emerald-500/25">Close Incident</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Emergency Action breaker Confirmation Modal */}
            {emergencyActionModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-300">
                    <div className="bg-[#0D1017] border border-[#1E2533] w-full max-w-md rounded-3xl p-8 shadow-2xl space-y-6">
                        <div className="flex items-start gap-3">
                            <AlertOctagon size={24} className="text-rose-500 shrink-0 mt-0.5" />
                            <div>
                                <h4 className="text-lg font-bold text-white uppercase tracking-wider">CRITICAL BREAKER TRIGGERED</h4>
                                <p className="text-xs text-rose-300 mt-1 font-medium">Verify action: {emergencyActionModal.replace(/_/g, ' ')}. This modifies global platform access settings immediately.</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            {emergencyActionModal === 'DISABLE_REGION' && (
                                <div className="space-y-2 animate-in slide-in-from-top-3">
                                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest pl-0.5">Blocked Country ISO Code</label>
                                    <input
                                        type="text"
                                        maxLength={2}
                                        value={regionInput}
                                        onChange={(e) => setRegionInput(e.target.value.toUpperCase())}
                                        placeholder="e.g. RU"
                                        className="w-full px-3 py-2 bg-[#050816] border border-[#1E2533] rounded-xl text-xs font-mono uppercase text-white focus:outline-none"
                                    />
                                </div>
                            )}

                            {emergencyActionModal === 'FORCE_PASSWORD_RESET' && (
                                <div className="space-y-2 animate-in slide-in-from-top-3">
                                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest pl-0.5">Target User ID</label>
                                    <input
                                        type="text"
                                        value={targetUserResetInput}
                                        onChange={(e) => setTargetUserResetInput(e.target.value)}
                                        placeholder="User MongoDB ObjectId"
                                        className="w-full px-3 py-2 bg-[#050816] border border-[#1E2533] rounded-xl text-xs font-mono text-white focus:outline-none"
                                    />
                                </div>
                            )}

                            <div className="space-y-2">
                                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest pl-0.5">Admin Security Override Code</label>
                                <input
                                    type="password"
                                    value={adminAuthCode}
                                    onChange={(e) => setAdminAuthCode(e.target.value)}
                                    placeholder="Enter your override verification code"
                                    className="w-full px-3 py-2 bg-[#050816] border border-[#1E2533] rounded-xl text-xs text-white focus:outline-none"
                                />
                            </div>

                            <div className="flex gap-3">
                                <button onClick={() => { setEmergencyActionModal(null); setAdminAuthCode(''); }} className="flex-1 py-3 bg-white/[0.02] border border-[#1E2533] text-white font-bold text-xs uppercase tracking-widest rounded-xl">Cancel</button>
                                <button onClick={handleTriggerEmergencyAction} className="flex-1 py-3 bg-rose-600 text-white font-black text-xs uppercase tracking-widest rounded-xl shadow-lg shadow-rose-600/30">Commit Override</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Page Header */}
            <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-6 border-b border-white/5 pb-6">
                <div>
                    <h2 className="text-3xl font-black text-white tracking-tight uppercase flex items-center gap-3">
                        <Shield className="text-primary-orange" size={32} />
                        Security Operations Center (SOC)
                    </h2>
                    <p className="text-slate-400 text-xs mt-1 uppercase font-bold tracking-wider">Device Fingerprints, Active Sessions, and Incident Resolution Command Center</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => fetchData()}
                        className="p-3 bg-[#0D1017] hover:bg-white/[0.03] text-slate-400 hover:text-white rounded-xl border border-[#1E2533] transition-all outline-none"
                    >
                        <RefreshCw size={16} />
                    </button>
                    <button
                        onClick={() => setEmergencyActionModal('LOCK_PLATFORM')}
                        className="px-6 py-3 bg-rose-600 hover:bg-rose-700 text-white font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-rose-600/35 border border-rose-500/20"
                    >
                        Emergency Platform Lock
                    </button>
                </div>
            </div>

            {/* Tabs Navigation */}
            <div className="flex border-b border-white/5 overflow-x-auto gap-2 pb-2 custom-scrollbar">
                {[
                    { id: 'dashboard', label: 'Overview & GPS Maps', icon: <Activity size={16} /> },
                    { id: 'sessions', label: 'Active Sessions list', icon: <Monitor size={16} /> },
                    { id: 'devices', label: 'Trusted Devices Firewall', icon: <Smartphone size={16} /> },
                    { id: 'incidents', label: 'Incidents Resolution Center', icon: <ShieldAlert size={16} /> },
                    { id: 'policies', label: 'Security Policies & Breakers', icon: <Sliders size={16} /> },
                    { id: 'forensics', label: 'Audit logs & Forensics', icon: <History size={16} /> }
                ].map(t => (
                    <button
                        key={t.id}
                        onClick={() => setActiveTab(t.id as any)}
                        className={`flex items-center gap-2 px-4 py-3 rounded-xl border font-bold text-xs uppercase tracking-wider transition-all whitespace-nowrap outline-none ${
                            activeTab === t.id 
                                ? 'bg-primary-orange-light text-primary-orange border-primary-orange/30 shadow-md' 
                                : 'bg-[#0D1017] border-[#1E2533] text-slate-400 hover:text-slate-200'
                        }`}
                    >
                        {t.icon}
                        {t.label}
                    </button>
                ))}
            </div>

            {/* TAB DETAILS PANEL GRID */}
            <div className="grid grid-cols-1 gap-8">
                
                {/* 1. DASHBOARD OVERVIEW TAB */}
                {activeTab === 'dashboard' && (
                    <div className="space-y-8 animate-in fade-in duration-300">
                        {/* KPI Cards Grid */}
                        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                            {[
                                { label: 'Active User Sessions', value: overview?.activeSessions || 0, desc: 'Web and mobile locks' },
                                { label: 'Online Users Count', value: overview?.onlineUsers || 0, desc: 'Unique user IDs' },
                                { label: 'Active Registry Devices', value: overview?.activeDevices || 0, desc: 'Trusted fingerprints' },
                                { label: 'Failed Logins Today', value: overview?.failedLoginsToday || 0, desc: 'Blocked attempts', isWarning: (overview?.failedLoginsToday || 0) > 10 },
                                { label: 'Suspicious Activities 24h', value: overview?.suspiciousActivities || 0, desc: 'Fraud triggers', isWarning: (overview?.suspiciousActivities || 0) > 0 }
                            ].map((card, i) => (
                                <div key={i} className="bg-[#0D1017] border border-[#1E2533] rounded-2xl p-5 shadow-2xl hover:border-white/10 transition-all duration-300">
                                    <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">{card.label}</p>
                                    <h3 className={`text-xl font-black mt-1.5 font-mono ${
                                        card.isWarning ? 'text-rose-400 animate-pulse' : 'text-white'
                                    }`}>{card.value}</h3>
                                    <p className="text-[9px] text-slate-600 mt-1 uppercase font-semibold">{card.desc}</p>
                                </div>
                            ))}
                        </div>

                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                            {[
                                { label: 'Locked User Accounts', value: overview?.lockedAccounts || 0, desc: 'Suspended profiles' },
                                { label: 'Password Changes 7d', value: overview?.passwordResets || 0, desc: 'Account modifications' },
                                { label: 'New Devices Detected', value: overview?.newDevicesDetected || 0, desc: 'Weekly new identifiers' },
                                { label: 'Open Security Incidents', value: overview?.securityIncidents || 0, desc: 'Requires attention', isWarning: (overview?.securityIncidents || 0) > 0 }
                            ].map((card, i) => (
                                <div key={i} className="bg-[#0D1017] border border-[#1E2533] rounded-2xl p-5 shadow-2xl hover:border-white/10 transition-all duration-300">
                                    <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">{card.label}</p>
                                    <h3 className={`text-base font-black font-mono ${
                                        card.isWarning ? 'text-rose-400' : 'text-white'
                                    }`}>{card.value}</h3>
                                    <p className="text-[9px] text-slate-600 mt-1 uppercase font-semibold">{card.desc}</p>
                                </div>
                            ))}
                        </div>

                        {/* Visual Geolocation map and Live Streams */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            
                            {/* Geolocation Activity Map Panel */}
                            <div className="lg:col-span-2 bg-[#0D1017] border border-[#1E2533] rounded-3xl p-6 shadow-2xl relative overflow-hidden flex flex-col justify-between">
                                <div className="flex items-center justify-between pb-4 border-b border-white/5 mb-6">
                                    <h3 className="text-xs font-black uppercase text-white tracking-widest flex items-center gap-2">
                                        <Globe className="text-[#FF6B00]" size={16} />
                                        Live Geolocation Security Map
                                    </h3>
                                    <span className="text-[8px] font-black bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/25 uppercase font-mono">Real-time GPS Logs</span>
                                </div>
                                
                                {/* Custom SVG Map Grid */}
                                <div className="h-64 bg-[#050816] rounded-2xl border border-white/5 relative flex items-center justify-center overflow-hidden">
                                    <svg className="w-full h-full opacity-10 absolute inset-0" viewBox="0 0 100 100" preserveAspectRatio="none">
                                        <path d="M0,20 L100,20 M0,40 L100,40 M0,60 L100,60 M0,80 L100,80" stroke="#FFFFFF" strokeWidth="0.1" />
                                        <path d="M20,0 L20,100 M40,0 L40,100 M60,0 L60,100 M80,0 L80,100" stroke="#FFFFFF" strokeWidth="0.1" />
                                    </svg>
                                    
                                    {/* Draw abstract landmass boundary outline */}
                                    <svg className="w-48 h-48 text-[#1E2533] absolute" viewBox="0 0 100 100">
                                        <path d="M40,20 Q48,15 55,25 T70,35 T65,65 T50,85 T35,70 T38,40 Z" fill="currentColor" opacity="0.35" />
                                        <circle cx="55" cy="45" r="2" fill="#FF6B00" />
                                    </svg>

                                    {/* Dynamic Markers for Session Geolocations */}
                                    {geoLocations.map((loc: any, idx: number) => {
                                        const xPercent = 50 + (loc.lon - 36.8) * 4;
                                        const yPercent = 50 - (loc.lat - (-1.29)) * 4;
                                        
                                        const isSuspicious = loc.country !== 'KE' || loc.ip.startsWith('192.168.10') || loc.ip.includes('fail');

                                        return (
                                            <div 
                                                key={idx} 
                                                style={{ left: `${Math.min(90, Math.max(10, xPercent))}%`, top: `${Math.min(90, Math.max(10, yPercent))}%` }} 
                                                className="absolute -translate-x-1/2 -translate-y-1/2 group z-10 cursor-pointer"
                                            >
                                                <span className="relative flex h-3 w-3">
                                                    <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                                                        isSuspicious ? 'bg-rose-500' : 'bg-emerald-400'
                                                    }`}></span>
                                                    <span className={`relative inline-flex rounded-full h-3 w-3 border border-white/20 ${
                                                        isSuspicious ? 'bg-rose-600' : 'bg-emerald-500'
                                                    }`}></span>
                                                </span>
                                                
                                                {/* Tooltip on hover */}
                                                <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 bg-[#0D1017] border border-[#1E2533] p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap text-[9px] pointer-events-none z-50">
                                                    <p className="font-bold text-white">@{loc.username}</p>
                                                    <p className="text-slate-400 font-mono">{loc.city || 'Nairobi'}, {loc.country || 'KE'} ({loc.ip})</p>
                                                    <p className={`font-black ${isSuspicious ? 'text-rose-400' : 'text-emerald-400'}`}>
                                                        {isSuspicious ? 'ANOMALOUS TRAFFIC' : 'SECURE SESSION'}
                                                    </p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* WebSocket Activity Stream */}
                            <div className="bg-[#0D1017] border border-[#1E2533] rounded-3xl p-6 shadow-2xl flex flex-col justify-between overflow-hidden">
                                <div className="flex items-center justify-between pb-3 border-b border-white/5 mb-4">
                                    <h3 className="text-xs font-black uppercase text-white tracking-widest flex items-center gap-2">
                                        <Terminal className="text-[#FF6B00]" size={16} />
                                        Laravel Reverb Activity Stream
                                    </h3>
                                    <div className="relative flex h-2 w-2">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                    </div>
                                </div>

                                <div className="space-y-3 max-h-60 overflow-y-auto custom-scrollbar flex-1 pr-1">
                                    {liveEvents.map((evt, i) => (
                                        <div key={i} className="p-3 bg-[#050816] border border-white/5 rounded-xl flex gap-2 font-mono">
                                            <span className="text-[9px] text-slate-500 select-none shrink-0 mt-0.5">{evt.time}</span>
                                            <div>
                                                <p className="text-[10px] text-slate-300 font-semibold">{evt.message}</p>
                                                <span className={`text-[8px] font-bold uppercase tracking-wider ${
                                                    evt.severity === 'high' ? 'text-rose-400' : evt.severity === 'medium' ? 'text-amber-400' : 'text-emerald-400'
                                                }`}>{evt.severity}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* 2. ACTIVE SESSIONS TAB */}
                {activeTab === 'sessions' && (
                    <div className="space-y-6 animate-in fade-in duration-300">
                        <div className="bg-[#0D1017]/80 border border-[#1E2533] rounded-3xl overflow-hidden shadow-2xl">
                            <div className="p-6 border-b border-[#1E2533] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <h3 className="text-xs font-black uppercase text-white tracking-widest flex items-center gap-2">
                                    <Monitor className="text-primary-orange" size={16} />
                                    Active Sessions registry
                                </h3>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
                                    <input
                                        type="text"
                                        value={sessionSearch}
                                        onChange={(e) => setSessionSearch(e.target.value)}
                                        placeholder="Search user, IP, operating system..."
                                        className="pl-9 pr-4 py-2 bg-[#050816] border border-[#1E2533] rounded-xl text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none w-64"
                                    />
                                </div>
                            </div>

                            <div className="divide-y divide-white/5">
                                {webSessions.concat(mobileSessions).length === 0 ? (
                                    <div className="p-12 text-center text-slate-500 font-bold uppercase text-[9px] tracking-wider">No active sessions matching filter</div>
                                ) : (
                                    webSessions.concat(mobileSessions).map((session, idx) => (
                                        <div key={idx} className="p-6 flex items-center justify-between hover:bg-white/[0.01] transition-all">
                                            <div className="flex items-center gap-4">
                                                <div className={`w-10 h-10 rounded-xl bg-[#050816] border border-[#1E2533] flex items-center justify-center ${
                                                    session.isTrusted ? 'text-emerald-400' : 'text-slate-500'
                                                }`}>
                                                    {session.sessionType === 'mobile' ? <Smartphone size={20} /> : <Monitor size={20} />}
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <h4 className="text-sm font-bold text-white">@{session.userId?.username || 'Unknown'}</h4>
                                                        <span className="text-[8px] font-black bg-white/[0.03] text-slate-500 px-1.5 py-0.5 rounded border border-[#1E2533] uppercase">{session.userId?.role || 'USER'}</span>
                                                    </div>
                                                    <p className="text-xs text-slate-500 mt-1">{session.deviceName || `Web Browser · ${session.browser || 'Generic'}`} ({session.platform || 'Unknown OS'})</p>
                                                </div>
                                            </div>

                                            <div className="hidden md:flex flex-col items-end">
                                                <p className="text-xs text-slate-300 font-mono">{session.ip}</p>
                                                <p className="text-[9px] text-slate-600 font-bold uppercase mt-1">
                                                    {session.geo?.city || 'Nairobi'}, {session.geo?.country || 'KE'}
                                                </p>
                                            </div>

                                            <div className="hidden xl:flex flex-col items-end">
                                                <p className="text-[9px] text-slate-600 font-bold uppercase leading-none">Login Time</p>
                                                <p className="text-xs text-slate-400 font-mono mt-1">{new Date(session.createdAt).toLocaleTimeString()}</p>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => handleToggleTrust(session._id, session.isTrusted)}
                                                    className={`p-2 rounded-lg border border-transparent transition-all ${
                                                        session.isTrusted 
                                                            ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' 
                                                            : 'text-slate-600 hover:text-[#FF6B00] hover:bg-[#FF6B00]/10 hover:border-[#FF6B00]/25'
                                                    }`}
                                                    title={session.isTrusted ? "Untrust Device" : "Trust Device"}
                                                >
                                                    <Fingerprint size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleRevokeSession(session._id)}
                                                    className="p-2 text-slate-600 hover:text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 rounded-lg transition-all"
                                                    title="Revoke session"
                                                >
                                                    <LogOut size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* 3. DEVICE FIREWALL REGISTRY TAB */}
                {activeTab === 'devices' && (
                    <div className="space-y-6 animate-in fade-in duration-300">
                        <div className="bg-[#0D1017]/80 border border-[#1E2533] rounded-3xl overflow-hidden shadow-2xl">
                            <div className="p-6 border-b border-[#1E2533] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <h3 className="text-xs font-black uppercase text-white tracking-widest flex items-center gap-2">
                                    <Smartphone className="text-primary-orange" size={16} />
                                    Trusted Devices Firewall Logs
                                </h3>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
                                    <input
                                        type="text"
                                        value={deviceSearch}
                                        onChange={(e) => setDeviceSearch(e.target.value)}
                                        placeholder="Search fingerprints, users..."
                                        className="pl-9 pr-4 py-2 bg-[#050816] border border-[#1E2533] rounded-xl text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none w-64"
                                    />
                                </div>
                            </div>

                            <div className="divide-y divide-white/5">
                                {devices.filter(d => !deviceSearch || d.deviceId.includes(deviceSearch) || (d.userId as any)?.username?.includes(deviceSearch)).length === 0 ? (
                                    <div className="p-12 text-center text-slate-500 font-bold uppercase text-[9px] tracking-wider">No device fingerprints registered</div>
                                ) : (
                                    devices.filter(d => !deviceSearch || d.deviceId.includes(deviceSearch) || (d.userId as any)?.username?.includes(deviceSearch)).map((device, idx) => (
                                        <div key={idx} className="p-6 flex items-center justify-between hover:bg-white/[0.01] transition-all">
                                            <div className="flex items-center gap-4">
                                                <div className={`w-10 h-10 rounded-xl bg-[#050816] border border-[#1E2533] flex items-center justify-center ${
                                                    device.isBlocked ? 'text-rose-500' : 'text-slate-500'
                                                }`}>
                                                    <Smartphone size={20} />
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <h4 className="text-sm font-bold text-white">{device.deviceName || 'Mobile Device'}</h4>
                                                        <span className="text-[8px] font-mono text-slate-500 font-bold select-all">{device.deviceId}</span>
                                                    </div>
                                                    <p className="text-xs text-slate-500 mt-1">User: @{(device.userId as any)?.username || 'Unknown'} · Platform: {device.platform || 'Unknown OS'}</p>
                                                </div>
                                            </div>

                                            <div className="hidden md:flex flex-col items-end">
                                                <p className="text-[9px] text-slate-600 font-bold uppercase">Risk Score Assessment</p>
                                                <span className={`text-xs font-black font-mono mt-1 ${
                                                    device.riskScore >= 75 ? 'text-rose-400' : device.riskScore >= 35 ? 'text-amber-400' : 'text-emerald-400'
                                                }`}>{device.riskScore ?? 10} / 100</span>
                                            </div>

                                            <div className="hidden xl:flex flex-col items-end">
                                                <p className="text-[9px] text-slate-600 font-bold uppercase">Last Active Connection</p>
                                                <p className="text-xs text-slate-400 font-mono mt-1">{new Date(device.lastUsedAt).toLocaleString()}</p>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => setRenameDeviceState({ deviceId: device.deviceId, userId: device.userId?._id, deviceName: device.deviceName || '' })}
                                                    className="px-2.5 py-1 bg-[#050816] hover:bg-white/[0.02] border border-[#1E2533] hover:border-white/10 text-[9px] font-black uppercase text-slate-400 hover:text-white rounded"
                                                >
                                                    Rename
                                                </button>
                                                {device.isBlocked ? (
                                                    <button
                                                        onClick={() => handleDeviceAction(device.deviceId, device.userId?._id, 'UNBLOCK')}
                                                        className="px-2.5 py-1 bg-emerald-950/20 hover:bg-emerald-950/40 border border-emerald-500/20 text-[9px] font-black uppercase text-emerald-400 rounded"
                                                    >
                                                        Unblock
                                                    </button>
                                                ) : (
                                                    <button
                                                        onClick={() => handleDeviceAction(device.deviceId, device.userId?._id, 'BLOCK')}
                                                        className="px-2.5 py-1 bg-rose-950/20 hover:bg-rose-950/40 border border-rose-500/20 text-[9px] font-black uppercase text-rose-400 rounded"
                                                    >
                                                        Block
                                                    </button>
                                                )}
                                                <button 
                                                    onClick={() => handleDeleteDeviceRegistry(device.deviceId, device.userId?._id)}
                                                    className="p-1 hover:bg-rose-500/10 text-rose-400 rounded transition-all"
                                                >
                                                    <Trash2 size={13} />
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* 4. INCIDENTS Hub TAB */}
                {activeTab === 'incidents' && (
                    <div className="space-y-6 animate-in fade-in duration-300">
                        <div className="bg-[#0D1017] border border-[#1E2533] rounded-3xl p-8 shadow-2xl space-y-6">
                            <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-white/5">
                                <h3 className="text-xs font-black uppercase text-white tracking-widest flex items-center gap-2">
                                    <ShieldAlert className="text-rose-500" size={16} />
                                    Active Incident Resolution Hub
                                </h3>

                                <div className="flex gap-3">
                                    <select
                                        value={alertSeverityFilter}
                                        onChange={(e) => setAlertSeverityFilter(e.target.value)}
                                        className="px-3 py-1.5 bg-[#050816] border border-[#1E2533] rounded-xl text-[10px] text-slate-400 font-bold uppercase"
                                    >
                                        <option value="">All Severities</option>
                                        <option value="low">Low Severity</option>
                                        <option value="medium">Medium Severity</option>
                                        <option value="high">High Severity</option>
                                    </select>
                                    <select
                                        value={alertStatusFilter}
                                        onChange={(e) => setAlertStatusFilter(e.target.value)}
                                        className="px-3 py-1.5 bg-[#050816] border border-[#1E2533] rounded-xl text-[10px] text-slate-400 font-bold uppercase"
                                    >
                                        <option value="">All Statuses</option>
                                        <option value="NEW">New Incidents</option>
                                        <option value="INVESTIGATING">Investigating</option>
                                        <option value="RESOLVED">Resolved</option>
                                        <option value="ESCALATED">Escalated</option>
                                    </select>
                                </div>
                            </div>

                            {/* Incidents Table */}
                            <div className="border border-white/5 rounded-2xl overflow-hidden">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-[#050816] border-b border-[#1E2533] text-[9px] font-black uppercase text-slate-500 tracking-wider">
                                            <th className="p-4">Incident Event</th>
                                            <th className="p-4">Impact User</th>
                                            <th className="p-4">Severity</th>
                                            <th className="p-4">Status</th>
                                            <th className="p-4">Notes</th>
                                            <th className="p-4 text-right">Auditor actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[#1E2533] text-xs">
                                        {securityAlerts.filter(a => {
                                            if (alertSeverityFilter && a.severity !== alertSeverityFilter) return false;
                                            if (alertStatusFilter && a.status !== alertStatusFilter) return false;
                                            return true;
                                        }).length === 0 ? (
                                            <tr>
                                                <td colSpan={6} className="p-8 text-center text-slate-600 font-bold uppercase text-[9px]">No incident alerts recorded matching rules</td>
                                            </tr>
                                        ) : (
                                            securityAlerts.filter(a => {
                                                if (alertSeverityFilter && a.severity !== alertSeverityFilter) return false;
                                                if (alertStatusFilter && a.status !== alertStatusFilter) return false;
                                                return true;
                                            }).map((alert, idx) => (
                                                <tr key={idx} className="hover:bg-white/[0.01]">
                                                    <td className="p-4">
                                                        <p className="font-bold text-slate-200">{alert.type?.replace(/_/g, ' ') || 'SUSPICIOUS_EVENT'}</p>
                                                        <p className="text-[9px] text-slate-500 font-mono mt-0.5">{alert.message}</p>
                                                    </td>
                                                    <td className="p-4 font-bold text-slate-300">
                                                        {alert.userId ? `@${alert.userId.username}` : 'System Platform'}
                                                    </td>
                                                    <td className="p-4">
                                                        <span className={`px-2 py-0.5 rounded-full border text-[8px] font-black uppercase tracking-wider ${
                                                            alert.severity === 'high' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20 animate-pulse' :
                                                            alert.severity === 'medium' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                                                            'bg-blue-500/10 text-blue-400 border-blue-500/20'
                                                        }`}>{alert.severity}</span>
                                                    </td>
                                                    <td className="p-4">
                                                        <span className={`px-2 py-0.5 rounded-full border text-[8px] font-black uppercase tracking-wider ${
                                                            alert.status === 'RESOLVED' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                                                            alert.status === 'INVESTIGATING' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                                                            alert.status === 'ESCALATED' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20 animate-pulse' :
                                                            'bg-white/[0.04] text-slate-400 border-white/5'
                                                        }`}>{alert.status || 'NEW'}</span>
                                                    </td>
                                                    <td className="p-4 font-mono text-[9px] text-slate-500 max-w-[200px] truncate">
                                                        {alert.resolutionNotes || 'No notes added'}
                                                    </td>
                                                    <td className="p-4 text-right">
                                                        <div className="flex items-center justify-end gap-2">
                                                            {alert.status !== 'RESOLVED' && (
                                                                <>
                                                                    <button
                                                                        onClick={() => {
                                                                            // Trigger investigation state
                                                                            adminService.updateSecurityAlert(alert._id, { status: 'INVESTIGATING' });
                                                                            triggerAlert('success', 'Investigation flag updated.');
                                                                            fetchData(true);
                                                                        }}
                                                                        className="px-2 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20 text-[8px] font-black uppercase tracking-wider rounded"
                                                                    >
                                                                        Investigate
                                                                    </button>
                                                                    <button
                                                                        onClick={() => {
                                                                            setActiveIncidentId(alert._id);
                                                                            setResolutionNotes(alert.resolutionNotes || '');
                                                                        }}
                                                                        className="px-2 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 text-[8px] font-black uppercase tracking-wider rounded"
                                                                    >
                                                                        Resolve
                                                                    </button>
                                                                </>
                                                            )}
                                                            {alert.status !== 'ESCALATED' && alert.status !== 'RESOLVED' && (
                                                                <button
                                                                    onClick={() => handleEscalateAlert(alert._id)}
                                                                    className="px-2 py-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 text-[8px] font-black uppercase tracking-wider rounded"
                                                                >
                                                                    Escalate
                                                                </button>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {/* 5. POLICIES & BREAKERS TAB */}
                {activeTab === 'policies' && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in duration-300">
                        {/* Global Policies Column */}
                        <div className="lg:col-span-2 space-y-8">
                            <div className="bg-[#0D1017] border border-[#1E2533] rounded-3xl p-8 shadow-2xl space-y-6">
                                <h3 className="text-xs font-black uppercase text-white tracking-widest flex items-center gap-2 pb-4 border-b border-white/5">
                                    <Sliders className="text-primary-orange" size={16} />
                                    Active Platform Security Policies
                                </h3>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <ToggleSwitch
                                        title="Enforced Admin 2FA"
                                        desc="Admin panels request verification"
                                        checked={mandatory2faForAdmins}
                                        onChange={(val) => handleUpdatePolicy('mandatory2faForAdmins', val)}
                                    />
                                    <ToggleSwitch
                                        title="IP Firewalls (KE Only)"
                                        desc="Only allow Kenyan login nodes"
                                        checked={blockNonKenyanIps}
                                        onChange={(val) => handleUpdatePolicy('blockNonKenyanIps', val)}
                                    />
                                    <ToggleSwitch
                                        title="Device restrictions validation"
                                        desc="Enable mandatory approval flows"
                                        checked={deviceRestrictionsEnabled}
                                        onChange={(val) => handleUpdatePolicy('deviceRestrictionsEnabled', val)}
                                    />
                                    <ToggleSwitch
                                        title="Brute-force account lock"
                                        desc="Block account on multiple errors"
                                        checked={enforce2faAllUsers}
                                        onChange={(val) => handleUpdatePolicy('enforce2faAllUsers', val)}
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-white/5">
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest pl-0.5 font-mono">Max session Age (Hrs)</label>
                                        <input
                                            type="number"
                                            value={sessionMaxAgeHours}
                                            onChange={(e) => handleUpdatePolicy('sessionMaxAgeHours', Number(e.target.value))}
                                            className="w-full px-4 py-3 bg-[#050816] border border-[#1E2533] rounded-xl text-xs font-mono font-bold text-white focus:outline-none"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest pl-0.5 font-mono">Max Login Errors before lockout</label>
                                        <input
                                            type="number"
                                            value={maxFailedLogins}
                                            onChange={(e) => handleUpdatePolicy('maxFailedLogins', Number(e.target.value))}
                                            className="w-full px-4 py-3 bg-[#050816] border border-[#1E2533] rounded-xl text-xs font-mono font-bold text-white focus:outline-none"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest pl-0.5 font-mono">Lockout duration (Mins)</label>
                                        <input
                                            type="number"
                                            value={lockoutMinutes}
                                            onChange={(e) => handleUpdatePolicy('lockoutMinutes', Number(e.target.value))}
                                            className="w-full px-4 py-3 bg-[#050816] border border-[#1E2533] rounded-xl text-xs font-mono font-bold text-white focus:outline-none"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Emergency Breaker Column */}
                        <div className="bg-[#0D1017] border border-rose-500/20 rounded-3xl p-6 shadow-2xl space-y-6">
                            <h3 className="text-xs font-black uppercase text-rose-400 tracking-widest flex items-center gap-2 pb-4 border-b border-rose-500/20">
                                <LockKeyhole className="text-rose-500 animate-pulse" size={16} />
                                EMERGENCY CIRCUIT BREAKERS
                            </h3>

                            <div className="space-y-3">
                                <BreakerButton label="Suspend All User Sessions" action="LOCK_PLATFORM" onTrigger={setEmergencyActionModal} />
                                <BreakerButton label="Disable New Account Logins" action="DISABLE_NEW_LOGINS" onTrigger={setEmergencyActionModal} />
                                <BreakerButton label="Freeze Suspicious Users" action="FREEZE_SUSPICIOUS_ACCOUNTS" onTrigger={setEmergencyActionModal} />
                                <BreakerButton label="Force User Password Reset" action="FORCE_PASSWORD_RESET" onTrigger={setEmergencyActionModal} />
                                <BreakerButton label="Disable Specific Region Access" action="DISABLE_REGION" onTrigger={setEmergencyActionModal} />
                                <div className="h-px bg-white/5 my-2" />
                                <button
                                    onClick={() => setEmergencyActionModal('UNFREEZE_PLATFORM')}
                                    className="w-full py-3.5 bg-emerald-600/10 hover:bg-emerald-600 text-emerald-400 hover:text-white border border-emerald-500/20 text-[9px] font-black uppercase tracking-widest rounded-xl transition-all"
                                >
                                    Reset Platform Emergency Locks
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* 6. FORENSICS & AUDIT LOGS TAB */}
                {activeTab === 'forensics' && (
                    <div className="space-y-6 animate-in fade-in duration-300">
                        <div className="bg-[#0D1017] border border-[#1E2533] rounded-3xl p-8 shadow-2xl space-y-6">
                            <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-white/5">
                                <h3 className="text-xs font-black uppercase text-white tracking-widest flex items-center gap-2">
                                    <HardDrive className="text-slate-400" size={16} />
                                    System Security Audit Forensics Ledger
                                </h3>

                                <div className="flex flex-wrap gap-3">
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={13} />
                                        <input
                                            type="text"
                                            value={auditSearch}
                                            onChange={(e) => { setAuditSearch(e.target.value); setAuditPage(1); }}
                                            placeholder="Search message, IP, user ID..."
                                            className="pl-8 pr-3 py-1.5 bg-[#050816] border border-[#1E2533] rounded-xl text-[10px] text-white placeholder:text-slate-600 focus:outline-none"
                                        />
                                    </div>
                                    <select
                                        value={auditSeverity}
                                        onChange={(e) => { setAuditSeverity(e.target.value); setAuditPage(1); }}
                                        className="px-2 py-1 bg-[#050816] border border-[#1E2533] rounded-xl text-[9px] text-slate-400 font-bold uppercase"
                                    >
                                        <option value="">All Severity</option>
                                        <option value="low">Low</option>
                                        <option value="medium">Medium</option>
                                        <option value="high">High</option>
                                    </select>
                                    <select
                                        value={auditType}
                                        onChange={(e) => { setAuditType(e.target.value); setAuditPage(1); }}
                                        className="px-2 py-1 bg-[#050816] border border-[#1E2533] rounded-xl text-[9px] text-slate-400 font-bold uppercase"
                                    >
                                        <option value="">All Categories</option>
                                        <option value="FAILED_LOGIN">Failed Logins</option>
                                        <option value="NEW_DEVICE">New Devices</option>
                                        <option value="PASSWORD_RESET">Password Reset</option>
                                        <option value="SUSPICIOUS_LOGIN">Suspicious Logins</option>
                                        <option value="SUSPICIOUS_WITHDRAW">Suspicious Withdraws</option>
                                        <option value="SECURITY_POLICY_CHANGED">Policy Modified</option>
                                        <option value="EMERGENCY_LOCK">Emergency Locks</option>
                                    </select>
                                    <button 
                                        onClick={() => handleExportAudit('csv')}
                                        className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600/10 hover:bg-emerald-600 text-emerald-400 hover:text-white border border-emerald-500/25 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all"
                                    >
                                        <FileSpreadsheet size={12} />
                                        Export CSV
                                    </button>
                                </div>
                            </div>

                            {/* Logs table */}
                            <div className="border border-white/5 rounded-2xl overflow-hidden">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-[#050816] border-b border-[#1E2533] text-[9px] font-black uppercase text-slate-500 tracking-wider">
                                            <th className="p-4">User</th>
                                            <th className="p-4">Security Event</th>
                                            <th className="p-4">Severity</th>
                                            <th className="p-4">Origin IP</th>
                                            <th className="p-4 text-right">Timestamp</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[#1E2533] text-xs">
                                        {auditLogs.length === 0 ? (
                                            <tr>
                                                <td colSpan={5} className="p-8 text-center text-slate-600 font-bold uppercase text-[9px]">No security audit events recorded</td>
                                            </tr>
                                        ) : (
                                            auditLogs.map((log, idx) => (
                                                <tr key={idx} className="hover:bg-white/[0.01]">
                                                    <td className="p-4">
                                                        <p className="font-bold text-slate-200">
                                                            {log.userId ? `@${log.userId.username}` : 'System Network'}
                                                        </p>
                                                        <p className="text-[9px] text-slate-500 uppercase tracking-widest font-black">
                                                            {log.userId?.role || 'SYSTEM'}
                                                        </p>
                                                    </td>
                                                    <td className="p-4">
                                                        <p className="font-mono text-slate-300 font-bold">{log.type}</p>
                                                        <p className="text-[10px] text-slate-500 font-semibold mt-0.5">{log.message}</p>
                                                    </td>
                                                    <td className="p-4">
                                                        <span className={`px-2 py-0.5 rounded-full border text-[8px] font-black uppercase tracking-wider ${
                                                            log.severity === 'high' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' :
                                                            log.severity === 'medium' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                                                            'bg-blue-500/10 text-blue-400 border-blue-500/20'
                                                        }`}>{log.severity}</span>
                                                    </td>
                                                    <td className="p-4 font-mono text-slate-400">{log.ip || 'Internal System'}</td>
                                                    <td className="p-4 text-right text-slate-500 font-mono text-[10px]">{new Date(log.createdAt).toLocaleString()}</td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination */}
                            {auditPagination && auditPagination.pages > 1 && (
                                <div className="flex items-center justify-between pt-4 text-xs font-bold uppercase tracking-wider text-slate-500 font-mono">
                                    <span>Page {auditPage} of {auditPagination.pages}</span>
                                    <div className="flex gap-2">
                                        <button 
                                            disabled={auditPage <= 1}
                                            onClick={() => setAuditPage(prev => Math.max(1, prev - 1))}
                                            className="px-3 py-1.5 bg-[#050816] hover:bg-white/[0.02] border border-[#1E2533] rounded-lg disabled:opacity-30"
                                        >
                                            Prev
                                        </button>
                                        <button 
                                            disabled={auditPage >= auditPagination.pages}
                                            onClick={() => setAuditPage(prev => Math.min(auditPagination.pages, prev + 1))}
                                            className="px-3 py-1.5 bg-[#050816] hover:bg-white/[0.02] border border-[#1E2533] rounded-lg disabled:opacity-30"
                                        >
                                            Next
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
}

// GENERAL INTERACTIVE UI HELPERS

interface ToggleSwitchProps {
    title: string;
    desc: string;
    checked: boolean;
    onChange: (val: boolean) => void;
}

function ToggleSwitch({ title, desc, checked, onChange }: ToggleSwitchProps) {
    return (
        <div className={`flex items-center justify-between p-4 border rounded-2xl transition-all duration-300 ${
            checked ? 'bg-primary-orange-light/5 border-primary-orange/20' : 'bg-[#050816] border-[#1E2533] shadow-inner'
        }`}>
            <div className="mr-3">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-200">{title}</h4>
                <p className="text-[10px] text-slate-500 mt-0.5 font-medium">{desc}</p>
            </div>
            <button
                onClick={() => onChange(!checked)}
                className={`w-11 h-6 rounded-full relative transition-all duration-300 shrink-0 shadow-inner cursor-pointer outline-none ${checked ? 'bg-primary-orange' : 'bg-slate-800'}`}
            >
                <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all duration-300 shadow ${checked ? 'left-5.5' : 'left-0.5'}`} />
            </button>
        </div>
    );
}

function BreakerButton({ label, action, onTrigger }: { label: string; action: string; onTrigger: (action: string) => void }) {
    return (
        <button
            onClick={() => onTrigger(action)}
            className="w-full py-3.5 bg-rose-500/10 hover:bg-rose-600 text-rose-400 hover:text-white border border-rose-500/25 text-[9px] font-black uppercase tracking-widest rounded-xl transition-all outline-none"
        >
            {label}
        </button>
    );
}
