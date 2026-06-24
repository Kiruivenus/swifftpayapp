"use client";

import React, { useState, useEffect, useCallback } from 'react';
import {
    Settings,
    Shield,
    Key,
    Image as ImageIcon,
    Save,
    AlertTriangle,
    Smartphone,
    Server,
    Mail,
    Lock,
    Eye,
    EyeOff,
    Loader2,
    RefreshCw,
    X,
    CheckCircle2,
    Gift,
    Activity,
    Database,
    Terminal,
    History,
    Plus,
    Trash2,
    Play,
    Check,
    Upload,
    Sliders,
    Search,
    FileText,
    CloudLightning,
    Wifi,
    AlertOctagon,
    HardDrive,
    Send,
    LockKeyhole,
    Globe2,
    CheckCircle
} from 'lucide-react';
import { adminService } from '@/services/admin.service';

export default function SettingsPage() {
    const [activeTab, setActiveTab] = useState<'overview' | 'general' | 'gateways' | 'security' | 'email' | 'apikeys' | 'backups' | 'audit'>('overview');
    
    const [settings, setSettings] = useState<any>(null);
    const [health, setHealth] = useState<any>(null);
    const [overview, setOverview] = useState<any>(null);
    const [gateways, setGateways] = useState<any>(null);
    const [securityAlerts, setSecurityAlerts] = useState<any[]>([]);
    const [emailLogs, setEmailLogs] = useState<any[]>([]);
    const [apiKeys, setApiKeys] = useState<any[]>([]);
    const [backups, setBackups] = useState<any[]>([]);
    const [auditLogs, setAuditLogs] = useState<any[]>([]);
    
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    
    // General Toggles & Configurations
    const [platformName, setPlatformName] = useState('');
    const [supportEmail, setSupportEmail] = useState('');
    const [maintenanceMode, setMaintenanceMode] = useState(false);
    const [maintenanceMessage, setMaintenanceMessage] = useState('');
    const [registrationEnabled, setRegistrationEnabled] = useState(true);
    const [depositsEnabled, setDepositsEnabled] = useState(true);
    const [withdrawalsEnabled, setWithdrawalsEnabled] = useState(true);
    const [notificationsEnabled, setNotificationsEnabled] = useState(true);
    const [kycRequired, setKycRequired] = useState(true);
    const [withdrawalRequiresKyc, setWithdrawalRequiresKyc] = useState(true);

    // Referral States
    const [referralEnabled, setReferralEnabled] = useState(true);
    const [referralMinRewardUsd, setReferralMinRewardUsd] = useState(2);
    const [referralMaxRewardUsd, setReferralMaxRewardUsd] = useState(10);
    const [referralCardSpendRequirementUsd, setReferralCardSpendRequirementUsd] = useState(5);
    const [referralCardSpendDaysLimit, setReferralCardSpendDaysLimit] = useState(14);
    const [referralDepositRequirementUsd, setReferralDepositRequirementUsd] = useState(100);

    // Brand Colors & Typography
    const [brandColors, setBrandColors] = useState({
        primary: '#FF6B00',
        secondary: '#0D1017',
        darkBase: '#050816',
        cardBg: '#0D1017'
    });
    const [typography, setTypography] = useState('Outfit');

    // Email Config States
    const [preferredEmailProvider, setPreferredEmailProvider] = useState<'smtp' | 'resend' | 'sendgrid' | 'mailgun' | 'ses'>('smtp');
    const [smtpHost, setSmtpHost] = useState('');
    const [smtpPort, setSmtpPort] = useState(587);
    const [smtpUser, setSmtpUser] = useState('');
    const [smtpPass, setSmtpPass] = useState('');
    const [smtpFrom, setSmtpFrom] = useState('');
    
    const [sendgridApiKey, setSendgridApiKey] = useState('');
    const [resendApiKey, setResendApiKey] = useState('');
    const [mailgunApiKey, setMailgunApiKey] = useState('');
    const [mailgunDomain, setMailgunDomain] = useState('');
    const [sesAccessKeyId, setSesAccessKeyId] = useState('');
    const [sesSecretAccessKey, setSesSecretAccessKey] = useState('');
    const [sesRegion, setSesRegion] = useState('us-east-1');

    // Palpluss Integration States
    const [palplussApiKey, setPalplussApiKey] = useState('');
    const [palplussWebhookSecret, setPalplussWebhookSecret] = useState('');
    const [palplussEnvironment, setPalplussEnvironment] = useState<'sandbox' | 'production'>('sandbox');

    
    // Testing email recipient
    const [testEmailRecipient, setTestEmailRecipient] = useState('');
    const [emailTesting, setEmailTesting] = useState(false);
    const [emailTestResult, setEmailTestResult] = useState<{ success: boolean; message: string } | null>(null);

    // Gateways state
    const [gatewayToggles, setGatewayToggles] = useState({
        mpesa: true,
        paypal: false,
        stripe: false,
        crypto: false,
        bank: false
    });

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
    
    const [newWhitelistIp, setNewWhitelistIp] = useState('');
    const [newBlacklistIp, setNewBlacklistIp] = useState('');

    // API Key states
    const [newKeyName, setNewKeyName] = useState('');
    const [newKeyRateLimit, setNewKeyRateLimit] = useState(120);
    const [createdKeyData, setCreatedKeyData] = useState<{ name: string; key: string } | null>(null);
    const [keyCreating, setKeyCreating] = useState(false);

    // Alert messages
    const [statusAlert, setStatusAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    const triggerAlert = (type: 'success' | 'error', message: string) => {
        setStatusAlert({ type, message });
        setTimeout(() => setStatusAlert(null), 5000);
    };

    const fetchData = useCallback(async (silent = false) => {
        try {
            if (!silent) setLoading(true);
            
            // Core system overview and configurations
            const systemRes = await adminService.getSettings();
            
            if (systemRes.settings) {
                const s = systemRes.settings;
                setSettings(s);
                setPlatformName(s.platformName || 'SwiftPay');
                setSupportEmail(s.supportEmail || 'support@swiftpay.ke');
                setMaintenanceMode(s.maintenanceMode ?? false);
                setMaintenanceMessage(s.maintenanceMessage || '');
                setRegistrationEnabled(s.registrationEnabled ?? true);
                setDepositsEnabled(s.depositsEnabled ?? true);
                setWithdrawalsEnabled(s.withdrawalsEnabled ?? true);
                setNotificationsEnabled(s.notificationsEnabled ?? true);
                setKycRequired(s.kycRequired ?? true);
                setWithdrawalRequiresKyc(s.withdrawalRequiresKyc ?? true);

                setReferralEnabled(s.referralEnabled ?? true);
                setReferralMinRewardUsd(s.referralMinRewardUsd ?? 2);
                setReferralMaxRewardUsd(s.referralMaxRewardUsd ?? 10);
                setReferralCardSpendRequirementUsd(s.referralCardSpendRequirementUsd ?? 5);
                setReferralCardSpendDaysLimit(s.referralCardSpendDaysLimit ?? 14);
                setReferralDepositRequirementUsd(s.referralDepositRequirementUsd ?? 100);

                if (s.brandColors) {
                    setBrandColors({
                        primary: s.brandColors.primary || '#FF6B00',
                        secondary: s.brandColors.secondary || '#0D1017',
                        darkBase: s.brandColors.darkBase || '#050816',
                        cardBg: s.brandColors.cardBg || '#0D1017'
                    });
                }
                setTypography(s.typography || 'Outfit');

                setPreferredEmailProvider(s.preferredEmailProvider || 'smtp');
                setSmtpHost(s.smtpHost || '');
                setSmtpPort(s.smtpPort || 587);
                setSmtpUser(s.smtpUser || '');
                setSmtpFrom(s.smtpFrom || '');
                
                setSendgridApiKey(s.sendgridApiKey || '');
                setResendApiKey(s.resendApiKey || '');
                setMailgunApiKey(s.mailgunApiKey || '');
                setMailgunDomain(s.mailgunDomain || '');
                setSesAccessKeyId(s.sesAccessKeyId || '');
                setSesSecretAccessKey(s.sesSecretAccessKey || '');
                setSesRegion(s.sesRegion || 'us-east-1');

                setPalplussApiKey(s.palplussApiKey || '');
                setPalplussWebhookSecret(s.palplussWebhookSecret || '');
                setPalplussEnvironment(s.palplussEnvironment || 'sandbox');


                if (s.gatewaysEnabled) {
                    setGatewayToggles({
                        mpesa: s.gatewaysEnabled.mpesa ?? true,
                        paypal: s.gatewaysEnabled.paypal ?? false,
                        stripe: s.gatewaysEnabled.stripe ?? false,
                        crypto: s.gatewaysEnabled.crypto ?? false,
                        bank: s.gatewaysEnabled.bank ?? false
                    });
                }
            }

            if (systemRes.overview) setOverview(systemRes.overview);
            if (systemRes.gateways) setGateways(systemRes.gateways);
            if (systemRes.securityAlerts) setSecurityAlerts(systemRes.securityAlerts);

            // System health status
            const healthRes = await adminService.getSystemHealth().catch(() => null);
            if (healthRes) setHealth(healthRes);

            // Security Policies
            const secPolicyRes = await adminService.getSecurityPolicies().catch(() => null);
            if (secPolicyRes && secPolicyRes.success && secPolicyRes.data) {
                const sp = secPolicyRes.data;
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

            // Email Integration Logs
            const emailLogsRes = await adminService.getEmailLogs().catch(() => null);
            if (emailLogsRes && emailLogsRes.success) setEmailLogs(emailLogsRes.logs || []);

            // API Keys
            const apiKeysRes = await adminService.getApiKeys().catch(() => null);
            if (apiKeysRes && apiKeysRes.success) setApiKeys(apiKeysRes.keys || []);

            // Backups
            const backupsRes = await adminService.getBackups().catch(() => null);
            if (backupsRes && backupsRes.success) setBackups(backupsRes.backups || []);

            // Audit Logs (limited query)
            const auditRes = await adminService.getAuditLogs({ limit: 30, severity: 'CRITICAL' }).catch(() => null);
            if (auditRes && auditRes.success) setAuditLogs(auditRes.logs || []);

        } catch (err: any) {
            console.error('Failed to reload command center data:', err);
            triggerAlert('error', 'Error refreshing telemetry: ' + err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
        
        // Auto-refresh metrics every 30 seconds
        const timer = setInterval(() => {
            fetchData(true);
        }, 30000);
        return () => clearInterval(timer);
    }, [fetchData]);

    const handleSaveGeneral = async () => {
        try {
            setSaving(true);
            await adminService.updateGeneralSettings({
                platformName,
                supportEmail,
                maintenanceMode,
                maintenanceMessage,
                registrationEnabled,
                depositsEnabled,
                withdrawalsEnabled,
                notificationsEnabled,
                kycRequired,
                withdrawalRequiresKyc,
                referralEnabled,
                referralMinRewardUsd,
                referralMaxRewardUsd,
                referralCardSpendRequirementUsd,
                referralCardSpendDaysLimit,
                referralDepositRequirementUsd,
                brandColors,
                typography,
                gatewaysEnabled: gatewayToggles
            });
            triggerAlert('success', 'General configurations and visual assets updated successfully.');
            await fetchData(true);
        } catch (err: any) {
            triggerAlert('error', 'Failed to commit settings changes: ' + err.message);
        } finally {
            setSaving(false);
        }
    };

    const handleSaveEmailSecrets = async () => {
        try {
            setSaving(true);
            await adminService.updateIntegrationKeys({
                preferredEmailProvider,
                smtpHost,
                smtpPort,
                smtpUser,
                smtpPass: smtpPass && !smtpPass.startsWith('•') ? smtpPass : undefined,
                smtpFrom,
                sendgridApiKey: sendgridApiKey && !sendgridApiKey.startsWith('•') ? sendgridApiKey : undefined,
                resendApiKey: resendApiKey && !resendApiKey.startsWith('•') ? resendApiKey : undefined,
                mailgunApiKey: mailgunApiKey && !mailgunApiKey.startsWith('•') ? mailgunApiKey : undefined,
                mailgunDomain,
                sesAccessKeyId: sesAccessKeyId && !sesAccessKeyId.startsWith('•') ? sesAccessKeyId : undefined,
                sesSecretAccessKey: sesSecretAccessKey && !sesSecretAccessKey.startsWith('•') ? sesSecretAccessKey : undefined,
                sesRegion,
                palplussApiKey: palplussApiKey && !palplussApiKey.startsWith('•') ? palplussApiKey : undefined,
                palplussWebhookSecret: palplussWebhookSecret && !palplussWebhookSecret.startsWith('•') ? palplussWebhookSecret : undefined,
                palplussEnvironment
            });
            triggerAlert('success', 'Email routing and Palpluss payout keys saved securely.');
            await fetchData(true);
        } catch (err: any) {
            triggerAlert('error', 'Failed to update email integration keys: ' + err.message);
        } finally {
            setSaving(false);
        }
    };

    const handleTestEmail = async () => {
        if (!testEmailRecipient) {
            triggerAlert('error', 'Please provide a recipient email address for testing.');
            return;
        }
        try {
            setEmailTesting(true);
            setEmailTestResult(null);
            const res = await adminService.testEmailSettings({
                provider: preferredEmailProvider,
                toEmail: testEmailRecipient
            });
            setEmailTestResult({ success: res.success, message: res.message });
            triggerAlert('success', 'Test email dispatched. Check output result.');
            await fetchData(true);
        } catch (err: any) {
            setEmailTestResult({ success: false, message: err.message });
            triggerAlert('error', 'Email integration validation failed.');
        } finally {
            setEmailTesting(false);
        }
    };

    const handleSaveSecurityPolicies = async () => {
        try {
            setSaving(true);
            await adminService.updateSecurityPolicies({
                mandatory2faForAdmins,
                enforce2faAllUsers,
                blockNonKenyanIps,
                ipWhitelist,
                ipBlacklist,
                deviceRestrictionsEnabled,
                sessionMaxAgeHours: Number(sessionMaxAgeHours),
                maxFailedLogins: Number(maxFailedLogins),
                lockoutMinutes: Number(lockoutMinutes)
            });
            triggerAlert('success', 'Security center parameters modified.');
            await fetchData(true);
        } catch (err: any) {
            triggerAlert('error', 'Error committing security policy update: ' + err.message);
        } finally {
            setSaving(false);
        }
    };

    const handleAddIp = (type: 'whitelist' | 'blacklist') => {
        const ip = type === 'whitelist' ? newWhitelistIp : newBlacklistIp;
        if (!ip) return;
        
        // Simple IP format validation
        const ipRegex = /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/;
        if (!ipRegex.test(ip)) {
            triggerAlert('error', 'Invalid IP Address format.');
            return;
        }

        if (type === 'whitelist') {
            if (!ipWhitelist.includes(ip)) setIpWhitelist([...ipWhitelist, ip]);
            setNewWhitelistIp('');
        } else {
            if (!ipBlacklist.includes(ip)) setIpBlacklist([...ipBlacklist, ip]);
            setNewBlacklistIp('');
        }
    };

    const handleRemoveIp = (type: 'whitelist' | 'blacklist', ip: string) => {
        if (type === 'whitelist') {
            setIpWhitelist(ipWhitelist.filter(x => x !== ip));
        } else {
            setIpBlacklist(ipBlacklist.filter(x => x !== ip));
        }
    };

    const handleCreateApiKey = async () => {
        if (!newKeyName) {
            triggerAlert('error', 'Credential Name is required.');
            return;
        }
        try {
            setKeyCreating(true);
            const res = await adminService.createApiKey({
                name: newKeyName,
                rateLimit: newKeyRateLimit
            });
            if (res.success) {
                setCreatedKeyData({
                    name: res.data.name,
                    key: res.fullKey
                });
                triggerAlert('success', 'API credential key compiled.');
                setNewKeyName('');
                await fetchData(true);
            }
        } catch (err: any) {
            triggerAlert('error', 'Failed to generate API credential key: ' + err.message);
        } finally {
            setKeyCreating(false);
        }
    };

    const handleRevokeApiKey = async (id: string) => {
        if (!confirm('Are you sure you want to revoke this API credential key? All systems using it will be blocked immediately.')) return;
        try {
            await adminService.revokeApiKey(id);
            triggerAlert('success', 'API Key status changed to REVOKED.');
            await fetchData(true);
        } catch (err: any) {
            triggerAlert('error', err.message);
        }
    };

    const handleRegenerateApiKey = async (id: string) => {
        if (!confirm('Are you sure you want to regenerate this key? The old credential value will stop working.')) return;
        try {
            const res = await adminService.regenerateApiKey(id);
            if (res.success) {
                setCreatedKeyData({
                    name: res.data.name,
                    key: res.fullKey
                });
                triggerAlert('success', 'API key regenerated.');
                await fetchData(true);
            }
        } catch (err: any) {
            triggerAlert('error', err.message);
        }
    };

    const handleDeleteApiKey = async (id: string) => {
        if (!confirm('Permanently delete this developer key registry? This action is irreversible.')) return;
        try {
            await adminService.deleteApiKey(id);
            triggerAlert('success', 'Developer key permanently removed from registry.');
            await fetchData(true);
        } catch (err: any) {
            triggerAlert('error', err.message);
        }
    };

    const handleCreateBackup = async () => {
        try {
            setSaving(true);
            const res = await adminService.createBackup();
            if (res.success) {
                triggerAlert('success', 'Database config snapshot generated: ' + res.filename);
                await fetchData(false);
            }
        } catch (err: any) {
            triggerAlert('error', 'Backup generation failed: ' + err.message);
        } finally {
            setSaving(false);
        }
    };

    const handleRestoreBackup = async (filename: string) => {
        if (!confirm('CAUTION: Restoring this backup will replace current settings, referral rates, gateways, and configurations immediately. Continue?')) return;
        try {
            setSaving(true);
            const res = await adminService.restoreBackup(filename);
            if (res.success) {
                triggerAlert('success', 'Settings config restored successfully.');
                await fetchData(false);
            }
        } catch (err: any) {
            triggerAlert('error', 'Restore operation failed: ' + err.message);
        } finally {
            setSaving(false);
        }
    };

    const handleUploadLogo = async (type: 'logo' | 'logoDashboard' | 'logoMobile' | 'logoEmail' | 'favicon' | 'notificationIcon', e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onloadend = async () => {
            try {
                setSaving(true);
                await adminService.uploadBrandAsset(type as any, reader.result as string);
                triggerAlert('success', `Dynamic brand asset [${type}] updated successfully.`);
                await fetchData(true);
            } catch (err: any) {
                triggerAlert('error', 'Dynamic upload failed: ' + err.message);
            } finally {
                setSaving(false);
            }
        };
        reader.readAsDataURL(file);
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 font-sans bg-[#050816]">
                <Loader2 className="animate-spin text-primary-orange" size={40} />
                <p className="text-slate-500 font-bold uppercase tracking-widest text-xs animate-pulse">Initializing Administrative Command Desk...</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-20 font-sans min-h-screen text-slate-100 bg-[#050816]">
            
            {/* Global Warning Status Alert Popup */}
            {statusAlert && (
                <div className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-6 py-4 rounded-2xl border backdrop-blur-md shadow-2xl animate-in slide-in-from-top-6 duration-300 ${
                    statusAlert.type === 'success' ? 'bg-emerald-950/90 border-emerald-500/30 text-emerald-300' : 'bg-rose-950/90 border-rose-500/30 text-rose-300'
                }`}>
                    <AlertTriangle size={18} className={statusAlert.type === 'success' ? 'text-emerald-400' : 'text-rose-400'} />
                    <p className="text-xs font-bold uppercase tracking-wider">{statusAlert.message}</p>
                </div>
            )}

            {/* Page Header */}
            <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-6 border-b border-white/5 pb-6">
                <div>
                    <h2 className="text-3xl font-black text-white tracking-tight uppercase">System Settings & Platform Control Center</h2>
                    <p className="text-slate-400 text-xs mt-1 uppercase font-bold tracking-wider">SwiftPay Operational Core & Integration Dashboard</p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    <button
                        onClick={() => fetchData()}
                        className="p-3 bg-[#0D1017] hover:bg-white/[0.03] text-slate-400 hover:text-white rounded-xl border border-[#1E2533] transition-all outline-none"
                        title="Force telemetric refresh"
                    >
                        <RefreshCw size={16} />
                    </button>
                    
                    {activeTab === 'general' && (
                        <button
                            onClick={handleSaveGeneral}
                            disabled={saving}
                            className="flex items-center gap-2 px-6 py-3 bg-primary-orange hover:bg-primary-orange-hover text-white font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-primary-orange/20 disabled:opacity-50"
                        >
                            {saving ? <Loader2 className="animate-spin" size={14} /> : <Save size={14} />}
                            Save General Configuration
                        </button>
                    )}

                    {activeTab === 'email' && (
                        <button
                            onClick={handleSaveEmailSecrets}
                            disabled={saving}
                            className="flex items-center gap-2 px-6 py-3 bg-primary-orange hover:bg-primary-orange-hover text-white font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-primary-orange/20 disabled:opacity-50"
                        >
                            {saving ? <Loader2 className="animate-spin" size={14} /> : <Save size={14} />}
                            Save Email Routing Keys
                        </button>
                    )}

                    {activeTab === 'security' && (
                        <button
                            onClick={handleSaveSecurityPolicies}
                            disabled={saving}
                            className="flex items-center gap-2 px-6 py-3 bg-primary-orange hover:bg-primary-orange-hover text-white font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-primary-orange/20 disabled:opacity-50"
                        >
                            {saving ? <Loader2 className="animate-spin" size={14} /> : <Save size={14} />}
                            Commit Security Parameters
                        </button>
                    )}
                </div>
            </div>

            {/* Operational Tabs Navigation */}
            <div className="flex border-b border-white/5 overflow-x-auto gap-2 pb-2 custom-scrollbar">
                {[
                    { id: 'overview', label: 'Overview Dashboard', icon: <Activity size={16} /> },
                    { id: 'general', label: 'General & Branding', icon: <Sliders size={16} /> },
                    { id: 'gateways', label: 'Payment Gateways', icon: <Globe2 size={16} /> },
                    { id: 'security', label: 'Security Controls', icon: <Shield size={16} /> },
                    { id: 'email', label: 'Email & Integrations', icon: <Mail size={16} /> },
                    { id: 'apikeys', label: 'Developer API Keys', icon: <Key size={16} /> },
                    { id: 'backups', label: 'Backup & Restore', icon: <Database size={16} /> },
                    { id: 'audit', label: 'Settings Audit logs', icon: <History size={16} /> }
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

            {/* Main Tabs Panel Content */}
            <div className="grid grid-cols-1 gap-8">
                
                {/* 1. OVERVIEW TAB */}
                {activeTab === 'overview' && (
                    <div className="space-y-8 animate-in fade-in duration-300">
                        {/* Metrics Cards Grid */}
                        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                            {[
                                { label: 'Total Registered Users', value: overview?.totalUsers || 0, desc: 'Registered accounts' },
                                { label: 'Active Users Today', value: overview?.activeUsersToday || 0, desc: 'Active sessions' },
                                { label: 'Cumulative Revenue', value: `${(overview?.platformRevenue || 0).toLocaleString()} KES`, desc: 'Aggregated fees' },
                                { label: 'Pending KYC Review', value: overview?.pendingKycReviews || 0, desc: 'Compliance backlog' },
                                { label: 'Pending Withdrawals', value: overview?.pendingWithdrawals || 0, desc: 'Treasury payouts' }
                            ].map((card, i) => (
                                <div key={i} className="bg-[#0D1017] border border-[#1E2533] rounded-2xl p-5 shadow-2xl hover:border-white/10 transition-all duration-300">
                                    <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">{card.label}</p>
                                    <h3 className="text-xl font-black text-white mt-1.5 font-mono">{card.value}</h3>
                                    <p className="text-[9px] text-slate-600 mt-1 uppercase font-semibold">{card.desc}</p>
                                </div>
                            ))}
                        </div>

                        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                            {[
                                { label: 'Database Health', value: overview?.databaseHealth || 'ONLINE', desc: 'MongoDB Server Cluster', isSuccess: overview?.databaseHealth === 'ONLINE' },
                                { label: 'API Status', value: overview?.apiStatus || 'ONLINE', desc: 'Next.js core API node', isSuccess: true },
                                { label: 'Storage Used', value: overview?.storageUsage || 'N/A', desc: 'Collections Size' },
                                { label: 'Queue Backlog', value: health?.metrics?.queueLength !== undefined ? health.metrics.queueLength : '0', desc: 'Queued Emails' },
                                { label: 'Last Config Backup', value: overview?.lastBackupTime !== 'N/A' && overview?.lastBackupTime ? new Date(overview.lastBackupTime).toLocaleTimeString() : 'N/A', desc: 'JSON snapshot' }
                            ].map((card, i) => (
                                <div key={i} className="bg-[#0D1017] border border-[#1E2533] rounded-2xl p-5 shadow-2xl hover:border-white/10 transition-all duration-300">
                                    <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">{card.label}</p>
                                    <div className="flex items-center gap-2 mt-1.5">
                                        <h3 className={`text-base font-black font-mono ${
                                            card.isSuccess !== undefined ? (card.isSuccess ? 'text-emerald-400' : 'text-rose-400') : 'text-white'
                                        }`}>{card.value}</h3>
                                        {card.isSuccess !== undefined && (
                                            <span className={`w-1.5 h-1.5 rounded-full ${card.isSuccess ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                                        )}
                                    </div>
                                    <p className="text-[9px] text-slate-600 mt-1 uppercase font-semibold">{card.desc}</p>
                                </div>
                            ))}
                        </div>

                        {/* Health Monitoring Metrics */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            {/* Live System Performance Gauges */}
                            <div className="bg-[#0D1017] border border-[#1E2533] rounded-3xl p-6 shadow-2xl space-y-6 lg:col-span-2">
                                <div className="flex items-center justify-between pb-4 border-b border-white/5">
                                    <h3 className="text-xs font-black uppercase text-white tracking-widest flex items-center gap-2">
                                        <Activity className="text-primary-orange" size={16} />
                                        Platform Health Telemetry
                                    </h3>
                                    <span className="text-[9px] font-black font-mono bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/20">LIVE MONITORING</span>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* CPU Usage Meter */}
                                    <div className="space-y-2 bg-[#050816] border border-white/5 rounded-2xl p-4">
                                        <div className="flex items-center justify-between text-[10px] font-bold uppercase text-slate-400">
                                            <span>CPU LOAD</span>
                                            <span className="font-mono text-white text-xs">{health?.metrics?.cpuUsage || 0}%</span>
                                        </div>
                                        <div className="w-full bg-[#0D1017] h-2.5 rounded-full overflow-hidden border border-white/5 flex">
                                            <div 
                                                style={{ width: `${health?.metrics?.cpuUsage || 5}%` }} 
                                                className={`h-full rounded-full transition-all duration-1000 ${
                                                    (health?.metrics?.cpuUsage || 0) > 80 ? 'bg-rose-500' : (health?.metrics?.cpuUsage || 0) > 50 ? 'bg-amber-500' : 'bg-primary-orange'
                                                }`}
                                            />
                                        </div>
                                        <p className="text-[8px] text-slate-600 font-bold uppercase tracking-wider">EST. THREAD ALLOCATIONS</p>
                                    </div>

                                    {/* RAM Usage Meter */}
                                    <div className="space-y-2 bg-[#050816] border border-white/5 rounded-2xl p-4">
                                        <div className="flex items-center justify-between text-[10px] font-bold uppercase text-slate-400">
                                            <span>RAM UTILIZATION</span>
                                            <span className="font-mono text-white text-xs">{health?.metrics?.ramUsage || 0}%</span>
                                        </div>
                                        <div className="w-full bg-[#0D1017] h-2.5 rounded-full overflow-hidden border border-white/5 flex">
                                            <div 
                                                style={{ width: `${health?.metrics?.ramUsage || 10}%` }} 
                                                className={`h-full rounded-full transition-all duration-1000 bg-emerald-500`}
                                            />
                                        </div>
                                        <p className="text-[8px] text-slate-600 font-bold uppercase tracking-wider font-mono">
                                            {health?.metrics?.totalRamBytes ? `${((health.metrics.totalRamBytes - health.metrics.freeRamBytes) / (1024*1024*1024)).toFixed(1)} GB / ${(health.metrics.totalRamBytes / (1024*1024*1024)).toFixed(1)} GB` : 'N/A'}
                                        </p>
                                    </div>

                                    {/* DB latency stats */}
                                    <div className="space-y-2 bg-[#050816] border border-white/5 rounded-2xl p-4">
                                        <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">DATABASE QUERY LATENCY</p>
                                        <div className="flex items-baseline gap-2">
                                            <span className="text-2xl font-black text-white font-mono">{health?.metrics?.dbLatencyMs || 0}</span>
                                            <span className="text-[9px] text-slate-500 font-bold uppercase">ms</span>
                                        </div>
                                        <p className="text-[8px] text-emerald-400 font-bold uppercase font-mono">
                                            {health?.metrics?.dbStatus || 'ONLINE'} - {health?.metrics?.dbStats?.collections || 0} Collections
                                        </p>
                                    </div>

                                    {/* API response times */}
                                    <div className="space-y-2 bg-[#050816] border border-white/5 rounded-2xl p-4">
                                        <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">API RESPONSE TIMES</p>
                                        <div className="flex items-baseline gap-2">
                                            <span className="text-2xl font-black text-white font-mono">{health?.metrics?.apiResponseTimeMs || 0}</span>
                                            <span className="text-[9px] text-slate-500 font-bold uppercase">ms</span>
                                        </div>
                                        <p className="text-[8px] text-slate-600 font-bold uppercase">Gateway HTTP response latencies</p>
                                    </div>
                                </div>
                            </div>

                            {/* Threat Intelligence Feed */}
                            <div className="bg-[#0D1017] border border-[#1E2533] rounded-3xl p-6 shadow-2xl space-y-4">
                                <h3 className="text-xs font-black uppercase text-white tracking-widest flex items-center gap-2 pb-3 border-b border-white/5">
                                    <Shield className="text-rose-500" size={16} />
                                    Threat Alerts
                                </h3>

                                <div className="space-y-3.5 max-h-56 overflow-y-auto custom-scrollbar">
                                    {securityAlerts.length === 0 ? (
                                        <div className="text-center py-8 text-slate-600 font-bold uppercase text-[9px] tracking-wider">
                                            No active threats flagged
                                        </div>
                                    ) : (
                                        securityAlerts.map((alert, i) => (
                                            <div key={i} className="p-3 bg-rose-950/20 border border-rose-500/20 rounded-xl flex gap-2.5">
                                                <AlertOctagon size={14} className="text-rose-400 shrink-0 mt-0.5" />
                                                <div>
                                                    <p className="text-[10px] font-bold text-slate-200">{alert.eventType || 'Unusual Action'}</p>
                                                    <p className="text-[9px] text-slate-500 font-mono mt-0.5">IP: {alert.ipAddress}</p>
                                                    <p className="text-[8px] text-rose-400/80 font-bold uppercase font-mono mt-1">Severity: {alert.severity}</p>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* 2. GENERAL & BRANDING TAB */}
                {activeTab === 'general' && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in duration-300">
                        {/* Config Column */}
                        <div className="lg:col-span-2 space-y-8">
                            {/* General status switches */}
                            <div className="bg-[#0D1017] border border-[#1E2533] rounded-3xl p-8 shadow-2xl space-y-6">
                                <h3 className="text-xs font-black uppercase text-white tracking-widest flex items-center gap-2 pb-4 border-b border-white/5">
                                    <Sliders className="text-primary-orange" size={16} />
                                    Platform Toggles
                                </h3>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <ToggleSwitch
                                        title="Maintenance Mode"
                                        desc="Take down client operations"
                                        checked={maintenanceMode}
                                        onChange={setMaintenanceMode}
                                    />
                                    <ToggleSwitch
                                        title="User Registration"
                                        desc="Allow new accounts"
                                        checked={registrationEnabled}
                                        onChange={setRegistrationEnabled}
                                    />
                                    <ToggleSwitch
                                        title="Deposit System"
                                        desc="Allow credit payments"
                                        checked={depositsEnabled}
                                        onChange={setDepositsEnabled}
                                    />
                                    <ToggleSwitch
                                        title="Withdrawal System"
                                        desc="Allow balance withdrawals"
                                        checked={withdrawalsEnabled}
                                        onChange={setWithdrawalsEnabled}
                                    />
                                    <ToggleSwitch
                                        title="KYC Validation System"
                                        desc="Enable mandatory KYC"
                                        checked={kycRequired}
                                        onChange={setKycRequired}
                                    />
                                    <ToggleSwitch
                                        title="Notification System"
                                        desc="Enable broadcast center"
                                        checked={notificationsEnabled}
                                        onChange={setNotificationsEnabled}
                                    />
                                    <ToggleSwitch
                                        title="Withdrawal Requires KYC"
                                        desc="Restrict payouts to verified"
                                        checked={withdrawalRequiresKyc}
                                        onChange={setWithdrawalRequiresKyc}
                                    />
                                </div>

                                {maintenanceMode && (
                                    <div className="space-y-2 pt-2 animate-in slide-in-from-top-3">
                                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest pl-0.5">Maintenance Screen Message</label>
                                        <textarea
                                            value={maintenanceMessage}
                                            onChange={(e) => setMaintenanceMessage(e.target.value)}
                                            rows={2}
                                            placeholder="System undergoing maintenance..."
                                            className="w-full px-4 py-3 bg-[#050816] border border-[#1E2533] rounded-xl text-xs text-slate-200 focus:outline-none resize-none font-semibold focus:border-rose-500/35"
                                        />
                                    </div>
                                )}

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest pl-0.5 font-mono">Branded Title Name</label>
                                        <input
                                            type="text"
                                            value={platformName}
                                            onChange={(e) => setPlatformName(e.target.value)}
                                            className="w-full px-4 py-3 bg-[#050816] border border-[#1E2533] rounded-xl text-xs text-slate-200 focus:outline-none focus:border-primary-orange uppercase font-bold"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest pl-0.5 font-mono">General Support Email</label>
                                        <input
                                            type="email"
                                            value={supportEmail}
                                            onChange={(e) => setSupportEmail(e.target.value)}
                                            className="w-full px-4 py-3 bg-[#050816] border border-[#1E2533] rounded-xl text-xs text-slate-200 focus:outline-none focus:border-primary-orange font-mono"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Referral Rewards configuration */}
                            <div className="bg-[#0D1017] border border-[#1E2533] rounded-3xl p-8 shadow-2xl space-y-6">
                                <div className="flex items-center justify-between pb-4 border-b border-white/5">
                                    <h3 className="text-xs font-black uppercase text-white tracking-widest flex items-center gap-2">
                                        <Gift className="text-primary-orange" size={16} />
                                        Referral Program Settings
                                    </h3>
                                    <button 
                                        onClick={() => setReferralEnabled(!referralEnabled)}
                                        className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border transition-all ${
                                            referralEnabled ? 'bg-primary-orange-light text-primary-orange border-primary-orange/20' : 'bg-[#050816] border-white/5 text-slate-600'
                                        }`}
                                    >
                                        {referralEnabled ? 'ACTIVE' : 'DEACTIVE'}
                                    </button>
                                </div>

                                {referralEnabled && (
                                    <div className="space-y-6 animate-in slide-in-from-top-3">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest pl-0.5 font-mono">Min Reward Reward (USD)</label>
                                                <input
                                                    type="number"
                                                    value={referralMinRewardUsd}
                                                    onChange={(e) => setReferralMinRewardUsd(Number(e.target.value))}
                                                    className="w-full px-4 py-3 bg-[#050816] border border-[#1E2533] rounded-xl text-xs text-slate-200 focus:outline-none focus:border-primary-orange font-bold font-mono"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest pl-0.5 font-mono">Max Reward Reward (USD)</label>
                                                <input
                                                    type="number"
                                                    value={referralMaxRewardUsd}
                                                    onChange={(e) => setReferralMaxRewardUsd(Number(e.target.value))}
                                                    className="w-full px-4 py-3 bg-[#050816] border border-[#1E2533] rounded-xl text-xs text-slate-200 focus:outline-none focus:border-primary-orange font-bold font-mono"
                                                />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                            <div className="space-y-2">
                                                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest pl-0.5 font-mono">Card Spend Required (USD)</label>
                                                <input
                                                    type="number"
                                                    value={referralCardSpendRequirementUsd}
                                                    onChange={(e) => setReferralCardSpendRequirementUsd(Number(e.target.value))}
                                                    className="w-full px-4 py-3 bg-[#050816] border border-[#1E2533] rounded-xl text-xs text-slate-200 focus:outline-none focus:border-primary-orange font-bold font-mono"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest pl-0.5 font-mono">Spend Days Limit</label>
                                                <input
                                                    type="number"
                                                    value={referralCardSpendDaysLimit}
                                                    onChange={(e) => setReferralCardSpendDaysLimit(Number(e.target.value))}
                                                    className="w-full px-4 py-3 bg-[#050816] border border-[#1E2533] rounded-xl text-xs text-slate-200 focus:outline-none focus:border-primary-orange font-bold font-mono"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest pl-0.5 font-mono">Deposit Required (USD)</label>
                                                <input
                                                    type="number"
                                                    value={referralDepositRequirementUsd}
                                                    onChange={(e) => setReferralDepositRequirementUsd(Number(e.target.value))}
                                                    className="w-full px-4 py-3 bg-[#050816] border border-[#1E2533] rounded-xl text-xs text-slate-200 focus:outline-none focus:border-primary-orange font-bold font-mono"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Branding and Visual Preview Card */}
                        <div className="space-y-8">
                            <div className="bg-[#0D1017] border border-[#1E2533] rounded-3xl p-6 shadow-2xl space-y-6">
                                <h3 className="text-xs font-black uppercase text-white tracking-widest flex items-center gap-2 pb-4 border-b border-white/5">
                                    <ImageIcon className="text-primary-orange" size={16} />
                                    Brand Management
                                </h3>

                                <div className="space-y-4">
                                    <div>
                                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2 pl-0.5 font-mono">Typography Selection</p>
                                        <select
                                            value={typography}
                                            onChange={(e) => setTypography(e.target.value)}
                                            className="w-full px-4 py-3 bg-[#050816] border border-[#1E2533] rounded-xl text-xs text-slate-200 focus:outline-none focus:border-primary-orange font-bold font-sans"
                                        >
                                            {['Outfit', 'Plus Jakarta Sans', 'Inter', 'Roboto', 'Montserrat'].map(font => (
                                                <option key={font} value={font}>{font}</option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Color Pickers */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <ColorPickerItem label="Primary accent" value={brandColors.primary} onChange={(c) => setBrandColors({...brandColors, primary: c})} />
                                        <ColorPickerItem label="Secondary Accent" value={brandColors.secondary} onChange={(c) => setBrandColors({...brandColors, secondary: c})} />
                                        <ColorPickerItem label="Dark Base BG" value={brandColors.darkBase} onChange={(c) => setBrandColors({...brandColors, darkBase: c})} />
                                        <ColorPickerItem label="Card Background" value={brandColors.cardBg} onChange={(c) => setBrandColors({...brandColors, cardBg: c})} />
                                    </div>

                                    {/* Visual Style Preview Card */}
                                    <div className="p-5 rounded-2xl border border-white/5 bg-[#050816] space-y-4 shadow-inner">
                                        <div className="flex items-center justify-between">
                                            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest font-mono">Global Style Preview</p>
                                            <span className="text-[8px] font-black text-[#FF6B00] uppercase tracking-widest animate-pulse">PREVIEWING DELTA</span>
                                        </div>
                                        <div 
                                            style={{ backgroundColor: brandColors.darkBase }} 
                                            className="p-4 rounded-xl border border-white/5 space-y-3 transition-colors duration-500"
                                        >
                                            <div 
                                                style={{ backgroundColor: brandColors.cardBg }} 
                                                className="p-3 rounded-lg border border-white/5 flex items-center justify-between transition-colors duration-500"
                                            >
                                                <div className="flex items-center gap-2">
                                                    <div style={{ backgroundColor: brandColors.primary }} className="w-2.5 h-2.5 rounded-full" />
                                                    <span className="font-bold text-[10px] text-white" style={{ fontFamily: typography }}>{platformName || 'SwiftPay'}</span>
                                                </div>
                                                <button 
                                                    style={{ backgroundColor: brandColors.primary, color: '#ffffff' }}
                                                    className="px-2.5 py-1 text-[8px] font-black uppercase tracking-wider rounded transition-all duration-300 cursor-pointer"
                                                >
                                                    Action
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Brand Logo Upload Assets */}
                                    <div className="h-px bg-white/5 my-2" />
                                    <div className="grid grid-cols-2 gap-4">
                                        <LogoUploadItem label="Login Page Logo" type="logo" currentUrl={settings?.logoUrl} onUpload={handleUploadLogo} disabled={saving} />
                                        <LogoUploadItem label="Dashboard Logo" type="logoDashboard" currentUrl={settings?.logoDashboardUrl} onUpload={handleUploadLogo} disabled={saving} />
                                        <LogoUploadItem label="Mobile App Logo" type="logoMobile" currentUrl={settings?.logoMobileUrl} onUpload={handleUploadLogo} disabled={saving} />
                                        <LogoUploadItem label="Receipt/Email Logo" type="logoEmail" currentUrl={settings?.logoEmailUrl} onUpload={handleUploadLogo} disabled={saving} />
                                        <LogoUploadItem label="Favicon (.ico)" type="favicon" currentUrl={settings?.faviconUrl} onUpload={handleUploadLogo} disabled={saving} />
                                        <LogoUploadItem label="Notif. Icon" type="notificationIcon" currentUrl={settings?.notificationIconUrl} onUpload={handleUploadLogo} disabled={saving} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* 3. PAYMENT GATEWAY TAB */}
                {activeTab === 'gateways' && (
                    <div className="space-y-6 animate-in fade-in duration-300">
                        <div className="bg-[#0D1017] border border-[#1E2533] rounded-3xl p-8 shadow-2xl space-y-6">
                            <h3 className="text-xs font-black uppercase text-white tracking-widest flex items-center gap-2 pb-4 border-b border-white/5">
                                <Globe2 className="text-[#FF6B00]" size={16} />
                                Payment Gateway Integrations
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                <GatewayCard
                                    name="Safaricom M-PESA API"
                                    code="mpesa"
                                    checked={gatewayToggles.mpesa}
                                    onChange={(val) => {
                                        const next = { ...gatewayToggles, mpesa: val };
                                        setGatewayToggles(next);
                                    }}
                                    telemetry={gateways?.mpesa}
                                    saving={saving}
                                    onToggle={handleSaveGeneral}
                                />
                                <GatewayCard
                                    name="PayPal Checkout"
                                    code="paypal"
                                    checked={gatewayToggles.paypal}
                                    onChange={(val) => {
                                        const next = { ...gatewayToggles, paypal: val };
                                        setGatewayToggles(next);
                                    }}
                                    telemetry={gateways?.paypal}
                                    saving={saving}
                                    onToggle={handleSaveGeneral}
                                />
                                <GatewayCard
                                    name="Stripe Payments"
                                    code="stripe"
                                    checked={gatewayToggles.stripe}
                                    onChange={(val) => {
                                        const next = { ...gatewayToggles, stripe: val };
                                        setGatewayToggles(next);
                                    }}
                                    telemetry={gateways?.stripe}
                                    saving={saving}
                                    onToggle={handleSaveGeneral}
                                />
                                <GatewayCard
                                    name="Crypto Wallet gateway"
                                    code="crypto"
                                    checked={gatewayToggles.crypto}
                                    onChange={(val) => {
                                        const next = { ...gatewayToggles, crypto: val };
                                        setGatewayToggles(next);
                                    }}
                                    telemetry={gateways?.crypto}
                                    saving={saving}
                                    onToggle={handleSaveGeneral}
                                />
                                <GatewayCard
                                    name="Kenswitch Bank Transfer"
                                    code="bank"
                                    checked={gatewayToggles.bank}
                                    onChange={(val) => {
                                        const next = { ...gatewayToggles, bank: val };
                                        setGatewayToggles(next);
                                    }}
                                    telemetry={gateways?.bank}
                                    saving={saving}
                                    onToggle={handleSaveGeneral}
                                />
                            </div>
                        </div>
                    </div>
                )}

                {/* 4. SECURITY CONTROLS TAB */}
                {activeTab === 'security' && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in duration-300">
                        {/* Rules columns */}
                        <div className="lg:col-span-2 space-y-8">
                            <div className="bg-[#0D1017] border border-[#1E2533] rounded-3xl p-8 shadow-2xl space-y-6">
                                <h3 className="text-xs font-black uppercase text-white tracking-widest flex items-center gap-2 pb-4 border-b border-white/5">
                                    <Shield className="text-rose-500" size={16} />
                                    Access & 2FA Enforcement Rules
                                </h3>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <ToggleSwitch
                                        title="Mandatory Admin 2FA"
                                        desc="Require 2FA for all roles"
                                        checked={mandatory2faForAdmins}
                                        onChange={setMandatory2faForAdmins}
                                    />
                                    <ToggleSwitch
                                        title="Enforce 2FA for all users"
                                        desc="Blocks transactions until configured"
                                        checked={enforce2faAllUsers}
                                        onChange={setEnforce2faAllUsers}
                                    />
                                    <ToggleSwitch
                                        title="Regional IP Lock (KE)"
                                        desc="Only allow Kenyan IP blocks"
                                        checked={blockNonKenyanIps}
                                        onChange={setBlockNonKenyanIps}
                                    />
                                    <ToggleSwitch
                                        title="Device Restrictions"
                                        desc="Confirm new device emails"
                                        checked={deviceRestrictionsEnabled}
                                        onChange={setDeviceRestrictionsEnabled}
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-white/5">
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest pl-0.5 font-mono">Session Timeout (Hrs)</label>
                                        <input
                                            type="number"
                                            value={sessionMaxAgeHours}
                                            onChange={(e) => setSessionMaxAgeHours(Number(e.target.value))}
                                            className="w-full px-4 py-3 bg-[#050816] border border-[#1E2533] rounded-xl text-xs text-slate-200 focus:outline-none focus:border-primary-orange font-bold font-mono"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest pl-0.5 font-mono">Max Failed Logins</label>
                                        <input
                                            type="number"
                                            value={maxFailedLogins}
                                            onChange={(e) => setMaxFailedLogins(Number(e.target.value))}
                                            className="w-full px-4 py-3 bg-[#050816] border border-[#1E2533] rounded-xl text-xs text-slate-200 focus:outline-none focus:border-primary-orange font-bold font-mono"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest pl-0.5 font-mono">Lockout Period (Min)</label>
                                        <input
                                            type="number"
                                            value={lockoutMinutes}
                                            onChange={(e) => setLockoutMinutes(Number(e.target.value))}
                                            className="w-full px-4 py-3 bg-[#050816] border border-[#1E2533] rounded-xl text-xs text-slate-200 focus:outline-none focus:border-primary-orange font-bold font-mono"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Whitelist and Blacklist IP controls */}
                        <div className="space-y-8">
                            <div className="bg-[#0D1017] border border-[#1E2533] rounded-3xl p-6 shadow-2xl space-y-6">
                                <h3 className="text-xs font-black uppercase text-white tracking-widest flex items-center gap-2 pb-4 border-b border-white/5">
                                    <LockKeyhole className="text-emerald-500" size={16} />
                                    Security Firewalls IP Whitelists
                                </h3>

                                <div className="space-y-4">
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={newWhitelistIp}
                                            onChange={(e) => setNewWhitelistIp(e.target.value)}
                                            placeholder="e.g. 192.168.1.1"
                                            className="flex-1 px-3 py-2 bg-[#050816] border border-[#1E2533] rounded-xl text-xs text-slate-200 font-mono focus:outline-none focus:border-primary-orange"
                                        />
                                        <button
                                            onClick={() => handleAddIp('whitelist')}
                                            className="px-3 bg-white/[0.03] hover:bg-white/[0.05] border border-[#1E2533] text-white text-xs font-black rounded-xl uppercase tracking-wider transition-all"
                                        >
                                            Add
                                        </button>
                                    </div>

                                    <div className="space-y-2 max-h-36 overflow-y-auto custom-scrollbar">
                                        {ipWhitelist.length === 0 ? (
                                            <p className="text-[9px] text-slate-600 font-black uppercase text-center py-4 font-mono">No Whitelisted IPs</p>
                                        ) : (
                                            ipWhitelist.map((ip, i) => (
                                                <div key={i} className="flex items-center justify-between p-2 bg-[#050816] border border-white/5 rounded-lg">
                                                    <span className="text-[10px] font-mono text-slate-300">{ip}</span>
                                                    <button onClick={() => handleRemoveIp('whitelist', ip)} className="text-rose-500 hover:text-rose-400 p-0.5">
                                                        <Trash2 size={12} />
                                                    </button>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="bg-[#0D1017] border border-[#1E2533] rounded-3xl p-6 shadow-2xl space-y-6">
                                <h3 className="text-xs font-black uppercase text-white tracking-widest flex items-center gap-2 pb-4 border-b border-white/5">
                                    <AlertOctagon className="text-rose-500" size={16} />
                                    IP Blacklist Firewall
                                </h3>

                                <div className="space-y-4">
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={newBlacklistIp}
                                            onChange={(e) => setNewBlacklistIp(e.target.value)}
                                            placeholder="e.g. 8.8.8.8"
                                            className="flex-1 px-3 py-2 bg-[#050816] border border-[#1E2533] rounded-xl text-xs text-slate-200 font-mono focus:outline-none focus:border-rose-500/35"
                                        />
                                        <button
                                            onClick={() => handleAddIp('blacklist')}
                                            className="px-3 bg-white/[0.03] hover:bg-white/[0.05] border border-[#1E2533] text-white text-xs font-black rounded-xl uppercase tracking-wider transition-all"
                                        >
                                            Block
                                        </button>
                                    </div>

                                    <div className="space-y-2 max-h-36 overflow-y-auto custom-scrollbar">
                                        {ipBlacklist.length === 0 ? (
                                            <p className="text-[9px] text-slate-600 font-black uppercase text-center py-4 font-mono">No Blacklisted IPs</p>
                                        ) : (
                                            ipBlacklist.map((ip, i) => (
                                                <div key={i} className="flex items-center justify-between p-2 bg-[#050816] border border-white/5 rounded-lg">
                                                    <span className="text-[10px] font-mono text-slate-300">{ip}</span>
                                                    <button onClick={() => handleRemoveIp('blacklist', ip)} className="text-rose-500 hover:text-rose-400 p-0.5">
                                                        <Trash2 size={12} />
                                                    </button>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* 5. EMAIL CONFIGURATION TAB */}
                {activeTab === 'email' && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in duration-300">
                        {/* Config and Testing forms */}
                        <div className="lg:col-span-2 space-y-8">
                            <div className="bg-[#0D1017] border border-[#1E2533] rounded-3xl p-8 shadow-2xl space-y-6">
                                <h3 className="text-xs font-black uppercase text-white tracking-widest flex items-center gap-2 pb-4 border-b border-white/5">
                                    <Mail className="text-primary-orange" size={16} />
                                    Transactional Email Provider Routing
                                </h3>

                                <div className="space-y-4">
                                    <div>
                                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest pl-0.5 font-mono">Active Provider Engine</label>
                                        <select
                                            value={preferredEmailProvider}
                                            onChange={(e) => setPreferredEmailProvider(e.target.value as any)}
                                            className="w-full px-4 py-3 bg-[#050816] border border-[#1E2533] rounded-xl text-xs text-slate-200 focus:outline-none focus:border-primary-orange font-bold uppercase"
                                        >
                                            <option value="smtp">Standard SMTP Server (TLS/SSL)</option>
                                            <option value="resend">Resend API (Preferred)</option>
                                            <option value="sendgrid">Twilio SendGrid API</option>
                                            <option value="mailgun">Mailgun HTTP API</option>
                                            <option value="ses">Amazon SES Node</option>
                                        </select>
                                    </div>

                                    {/* SMTP Server options */}
                                    {preferredEmailProvider === 'smtp' && (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-white/5 animate-in slide-in-from-top-3">
                                            <div className="space-y-2">
                                                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest pl-0.5">SMTP Host Server</label>
                                                <input type="text" value={smtpHost} onChange={(e) => setSmtpHost(e.target.value)} className="w-full px-4 py-2.5 bg-[#050816] border border-[#1E2533] rounded-xl text-xs font-mono text-white focus:outline-none" />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest pl-0.5">SMTP Port</label>
                                                <input type="number" value={smtpPort} onChange={(e) => setSmtpPort(Number(e.target.value))} className="w-full px-4 py-2.5 bg-[#050816] border border-[#1E2533] rounded-xl text-xs font-mono text-white focus:outline-none" />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest pl-0.5">SMTP Username</label>
                                                <input type="text" value={smtpUser} onChange={(e) => setSmtpUser(e.target.value)} className="w-full px-4 py-2.5 bg-[#050816] border border-[#1E2533] rounded-xl text-xs font-mono text-white focus:outline-none" />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest pl-0.5">SMTP Password</label>
                                                <input type="password" value={smtpPass} onChange={(e) => setSmtpPass(e.target.value)} placeholder="••••••••••••" className="w-full px-4 py-2.5 bg-[#050816] border border-[#1E2533] rounded-xl text-xs font-mono text-white focus:outline-none" />
                                            </div>
                                            <div className="space-y-2 md:col-span-2">
                                                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest pl-0.5">Sender Mail Envelope (From)</label>
                                                <input type="text" value={smtpFrom} onChange={(e) => setSmtpFrom(e.target.value)} className="w-full px-4 py-2.5 bg-[#050816] border border-[#1E2533] rounded-xl text-xs font-mono text-white focus:outline-none" />
                                            </div>
                                        </div>
                                    )}

                                    {/* Resend Options */}
                                    {preferredEmailProvider === 'resend' && (
                                        <div className="space-y-3 pt-2 border-t border-white/5 animate-in slide-in-from-top-3">
                                            <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest pl-0.5">Resend API Key</label>
                                            <input type="password" value={resendApiKey} onChange={(e) => setResendApiKey(e.target.value)} placeholder="re_••••••••••••" className="w-full px-4 py-2.5 bg-[#050816] border border-[#1E2533] rounded-xl text-xs font-mono text-white focus:outline-none" />
                                        </div>
                                    )}

                                    {/* SendGrid Options */}
                                    {preferredEmailProvider === 'sendgrid' && (
                                        <div className="space-y-3 pt-2 border-t border-white/5 animate-in slide-in-from-top-3">
                                            <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest pl-0.5">SendGrid API Key</label>
                                            <input type="password" value={sendgridApiKey} onChange={(e) => setSendgridApiKey(e.target.value)} placeholder="SG.••••••••••••" className="w-full px-4 py-2.5 bg-[#050816] border border-[#1E2533] rounded-xl text-xs font-mono text-white focus:outline-none" />
                                        </div>
                                    )}

                                    {/* Mailgun Options */}
                                    {preferredEmailProvider === 'mailgun' && (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-white/5 animate-in slide-in-from-top-3">
                                            <div className="space-y-2">
                                                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest pl-0.5">Mailgun Domain</label>
                                                <input type="text" value={mailgunDomain} onChange={(e) => setMailgunDomain(e.target.value)} className="w-full px-4 py-2.5 bg-[#050816] border border-[#1E2533] rounded-xl text-xs font-mono text-white focus:outline-none" />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest pl-0.5">Mailgun API Key</label>
                                                <input type="password" value={mailgunApiKey} onChange={(e) => setMailgunApiKey(e.target.value)} placeholder="key-••••••••••••" className="w-full px-4 py-2.5 bg-[#050816] border border-[#1E2533] rounded-xl text-xs font-mono text-white focus:outline-none" />
                                            </div>
                                        </div>
                                    )}

                                    {/* SES Options */}
                                    {preferredEmailProvider === 'ses' && (
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-t border-white/5 animate-in slide-in-from-top-3">
                                            <div className="space-y-2">
                                                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest pl-0.5">SES Access Key ID</label>
                                                <input type="text" value={sesAccessKeyId} onChange={(e) => setSesAccessKeyId(e.target.value)} className="w-full px-4 py-2.5 bg-[#050816] border border-[#1E2533] rounded-xl text-xs font-mono text-white focus:outline-none" />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest pl-0.5">SES Secret Access Key</label>
                                                <input type="password" value={sesSecretAccessKey} onChange={(e) => setSesSecretAccessKey(e.target.value)} placeholder="••••••••••••" className="w-full px-4 py-2.5 bg-[#050816] border border-[#1E2533] rounded-xl text-xs font-mono text-white focus:outline-none" />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest pl-0.5">SES Region</label>
                                                <input type="text" value={sesRegion} onChange={(e) => setSesRegion(e.target.value)} className="w-full px-4 py-2.5 bg-[#050816] border border-[#1E2533] rounded-xl text-xs font-mono text-white focus:outline-none" />
                                            </div>
                                        </div>
                                    )}

                                    {/* Palpluss B2C Payout Integration settings */}
                                    <div className="pt-6 border-t border-white/5 space-y-4">
                                        <h3 className="text-xs font-black uppercase text-white tracking-widest flex items-center gap-2 pb-2 border-b border-white/5">
                                            <Server className="text-primary-orange" size={16} />
                                            Palpluss B2C Payout Integration
                                        </h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest pl-0.5">Palpluss API Key</label>
                                                <input type="password" value={palplussApiKey} onChange={(e) => setPalplussApiKey(e.target.value)} placeholder="pk_••••••••••••" className="w-full px-4 py-2.5 bg-[#050816] border border-[#1E2533] rounded-xl text-xs font-mono text-white focus:outline-none" />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest pl-0.5">Webhook Signing Secret</label>
                                                <input type="password" value={palplussWebhookSecret} onChange={(e) => setPalplussWebhookSecret(e.target.value)} placeholder="whsec_••••••••••••" className="w-full px-4 py-2.5 bg-[#050816] border border-[#1E2533] rounded-xl text-xs font-mono text-white focus:outline-none" />
                                            </div>
                                            <div className="space-y-2 md:col-span-2">
                                                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest pl-0.5">Palpluss Environment</label>
                                                <select
                                                    value={palplussEnvironment}
                                                    onChange={(e) => setPalplussEnvironment(e.target.value as any)}
                                                    className="w-full px-4 py-3 bg-[#050816] border border-[#1E2533] rounded-xl text-xs text-slate-200 focus:outline-none focus:border-primary-orange font-bold uppercase"
                                                >
                                                    <option value="sandbox">Sandbox Environment</option>
                                                    <option value="production">Production Gateway</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Integration verification and Logs */}
                        <div className="space-y-8">
                            {/* Validation panel */}
                            <div className="bg-[#0D1017] border border-[#1E2533] rounded-3xl p-6 shadow-2xl space-y-6">
                                <h3 className="text-xs font-black uppercase text-white tracking-widest flex items-center gap-2 pb-4 border-b border-white/5">
                                    <Send className="text-emerald-500" size={16} />
                                    Integration Connection Validator
                                </h3>

                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest pl-0.5 font-mono">Test Recipient Email</label>
                                        <input
                                            type="email"
                                            value={testEmailRecipient}
                                            onChange={(e) => setTestEmailRecipient(e.target.value)}
                                            placeholder="test@example.com"
                                            className="w-full px-3 py-2 bg-[#050816] border border-[#1E2533] rounded-xl text-xs text-white focus:outline-none focus:border-primary-orange"
                                        />
                                    </div>

                                    <button
                                        onClick={handleTestEmail}
                                        disabled={emailTesting}
                                        className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase tracking-widest rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                                    >
                                        {emailTesting ? <Loader2 className="animate-spin" size={14} /> : <Play size={14} />}
                                        Test Email Connection
                                    </button>

                                    {emailTestResult && (
                                        <div className={`p-4 rounded-xl border text-[11px] font-semibold leading-relaxed animate-in slide-in-from-top-3 ${
                                            emailTestResult.success ? 'bg-emerald-950/30 border-emerald-500/20 text-emerald-300' : 'bg-rose-950/30 border-rose-500/20 text-rose-300'
                                        }`}>
                                            <p className="font-bold uppercase mb-1">{emailTestResult.success ? 'Success' : 'Failed'}</p>
                                            <p className="font-mono">{emailTestResult.message}</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Recent Delivery logs */}
                            <div className="bg-[#0D1017] border border-[#1E2533] rounded-3xl p-6 shadow-2xl space-y-4">
                                <h3 className="text-xs font-black uppercase text-white tracking-widest flex items-center gap-2 pb-3 border-b border-white/5">
                                    <FileText className="text-slate-400" size={16} />
                                    Recent Delivery Logs
                                </h3>

                                <div className="space-y-3.5 max-h-56 overflow-y-auto custom-scrollbar">
                                    {emailLogs.length === 0 ? (
                                        <div className="text-center py-8 text-slate-600 font-bold uppercase text-[9px] tracking-wider">
                                            No delivery logs found
                                        </div>
                                    ) : (
                                        emailLogs.map((log, i) => (
                                            <div key={i} className="p-3 bg-[#050816] border border-white/5 rounded-xl space-y-1">
                                                <div className="flex items-center justify-between text-[9px] font-bold">
                                                    <span className="text-slate-400 truncate max-w-[120px]">{log.to}</span>
                                                    <span className={`px-1.5 py-0.5 rounded border uppercase text-[8px] font-black ${
                                                        log.status === 'SENT' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25' : 'bg-rose-500/10 text-rose-400 border-rose-500/25'
                                                    }`}>{log.status}</span>
                                                </div>
                                                <p className="text-[10px] text-slate-200 truncate">{log.subject}</p>
                                                {log.error && (
                                                    <p className="text-[8px] text-rose-400/80 font-mono break-all bg-rose-950/20 p-1.5 rounded">{log.error}</p>
                                                )}
                                                <p className="text-[8px] text-slate-600 font-mono text-right">{new Date(log.sentAt).toLocaleTimeString()}</p>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* 6. DEVELOPER API KEYS TAB */}
                {activeTab === 'apikeys' && (
                    <div className="space-y-8 animate-in fade-in duration-300">
                        {/* New Key forms */}
                        <div className="bg-[#0D1017] border border-[#1E2533] rounded-3xl p-8 shadow-2xl space-y-6">
                            <h3 className="text-xs font-black uppercase text-white tracking-widest flex items-center gap-2 pb-4 border-b border-white/5">
                                <Key className="text-amber-500" size={16} />
                                Developer API Credentials Keys
                            </h3>

                            {createdKeyData && (
                                <div className="p-6 bg-emerald-950/40 border border-emerald-500/30 rounded-2xl space-y-4 animate-in zoom-in-95">
                                    <div className="flex items-center gap-3">
                                        <CheckCircle className="text-emerald-400" size={24} />
                                        <div>
                                            <h4 className="text-sm font-bold text-white uppercase tracking-wider">Credential Secret Generated</h4>
                                            <p className="text-xs text-emerald-300/80 mt-0.5">Please copy this secret key now. It will not be shown again.</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between p-3.5 bg-[#050816] rounded-xl border border-white/5 mt-3">
                                        <span className="font-mono text-xs text-slate-200 select-all font-bold break-all">{createdKeyData.key}</span>
                                        <button 
                                            onClick={() => {
                                                navigator.clipboard.writeText(createdKeyData.key);
                                                triggerAlert('success', 'Key copied to clipboard.');
                                            }}
                                            className="ml-3 px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[9px] font-black uppercase tracking-widest rounded transition-all cursor-pointer"
                                        >
                                            Copy
                                        </button>
                                    </div>
                                    <button 
                                        onClick={() => setCreatedKeyData(null)}
                                        className="py-1 text-slate-400 hover:text-white text-[9px] font-black uppercase tracking-widest underline block"
                                    >
                                        Acknowledge
                                    </button>
                                </div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end bg-[#050816] border border-white/5 p-6 rounded-2xl">
                                <div className="space-y-2">
                                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest pl-0.5">Credential Key Name</label>
                                    <input
                                        type="text"
                                        value={newKeyName}
                                        onChange={(e) => setNewKeyName(e.target.value)}
                                        placeholder="e.g. Production Webhook Gateway"
                                        className="w-full px-3 py-2 bg-[#0D1017] border border-[#1E2533] rounded-xl text-xs text-white focus:outline-none focus:border-primary-orange"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest pl-0.5">Rate Limit (Req/Min)</label>
                                    <input
                                        type="number"
                                        value={newKeyRateLimit}
                                        onChange={(e) => setNewKeyRateLimit(Number(e.target.value))}
                                        className="w-full px-3 py-2 bg-[#0D1017] border border-[#1E2533] rounded-xl text-xs font-mono text-white focus:outline-none focus:border-primary-orange"
                                    />
                                </div>
                                <button
                                    onClick={handleCreateApiKey}
                                    disabled={keyCreating}
                                    className="py-2 px-6 bg-primary-orange hover:bg-primary-orange-hover text-white font-black text-xs uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2"
                                >
                                    {keyCreating ? <Loader2 className="animate-spin" size={14} /> : <Plus size={14} />}
                                    Generate New Key
                                </button>
                            </div>

                            {/* Active Keys Table */}
                            <div className="border border-[#1E2533] rounded-2xl overflow-hidden mt-6">
                                <table className="w-full border-collapse text-left">
                                    <thead>
                                        <tr className="bg-[#050816] border-b border-[#1E2533] text-[9px] font-black uppercase text-slate-500 tracking-wider">
                                            <th className="p-4">Name</th>
                                            <th className="p-4">Key ID (Masked)</th>
                                            <th className="p-4">Rate Limit</th>
                                            <th className="p-4">Created At</th>
                                            <th className="p-4">Last Used</th>
                                            <th className="p-4">Status</th>
                                            <th className="p-4 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[#1E2533] text-xs">
                                        {apiKeys.length === 0 ? (
                                            <tr>
                                                <td colSpan={7} className="p-8 text-center text-slate-600 font-bold uppercase text-[9px]">No developer credentials found</td>
                                            </tr>
                                        ) : (
                                            apiKeys.map((keyRecord, idx) => (
                                                <tr key={idx} className="hover:bg-white/[0.01]">
                                                    <td className="p-4 font-bold text-slate-200">{keyRecord.name}</td>
                                                    <td className="p-4 font-mono text-[10px] text-slate-400 select-all">{keyRecord.key}</td>
                                                    <td className="p-4 font-mono text-slate-400">{keyRecord.rateLimit} req/min</td>
                                                    <td className="p-4 text-slate-500 font-mono text-[10px]">{new Date(keyRecord.createdAt).toLocaleDateString()}</td>
                                                    <td className="p-4 text-slate-500 font-mono text-[10px]">
                                                        {keyRecord.lastUsedAt ? new Date(keyRecord.lastUsedAt).toLocaleTimeString() : 'Never'}
                                                    </td>
                                                    <td className="p-4">
                                                        <span className={`px-2 py-0.5 rounded-full border text-[8px] font-black uppercase tracking-wider ${
                                                            keyRecord.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                                                        }`}>{keyRecord.status}</span>
                                                    </td>
                                                    <td className="p-4 text-right">
                                                        <div className="flex items-center justify-end gap-2">
                                                            {keyRecord.status === 'ACTIVE' && (
                                                                <button 
                                                                    onClick={() => handleRevokeApiKey(keyRecord._id)}
                                                                    className="px-2 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20 text-[8px] font-black uppercase tracking-wider rounded"
                                                                >
                                                                    Revoke
                                                                </button>
                                                            )}
                                                            <button 
                                                                onClick={() => handleRegenerateApiKey(keyRecord._id)}
                                                                className="px-2 py-1 bg-[#050816] hover:bg-white/[0.02] text-slate-300 border border-[#1E2533] text-[8px] font-black uppercase tracking-wider rounded"
                                                            >
                                                                Regen
                                                            </button>
                                                            <button 
                                                                onClick={() => handleDeleteApiKey(keyRecord._id)}
                                                                className="p-1 hover:bg-rose-500/10 text-rose-400 rounded"
                                                            >
                                                                <Trash2 size={13} />
                                                            </button>
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

                {/* 7. BACKUP & RESTORE TAB */}
                {activeTab === 'backups' && (
                    <div className="space-y-8 animate-in fade-in duration-300">
                        <div className="bg-[#0D1017] border border-[#1E2533] rounded-3xl p-8 shadow-2xl space-y-6">
                            <div className="flex items-center justify-between pb-4 border-b border-white/5">
                                <h3 className="text-xs font-black uppercase text-white tracking-widest flex items-center gap-2">
                                    <Database className="text-emerald-400" size={16} />
                                    Primary Configuration Backups Desk
                                </h3>
                                <button
                                    onClick={handleCreateBackup}
                                    disabled={saving}
                                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase tracking-widest rounded-xl transition-all flex items-center gap-2"
                                >
                                    {saving ? <Loader2 className="animate-spin" size={14} /> : <Plus size={14} />}
                                    Generate Restore Point
                                </button>
                            </div>

                            {/* Backups table */}
                            <div className="border border-[#1E2533] rounded-2xl overflow-hidden mt-6">
                                <table className="w-full border-collapse text-left">
                                    <thead>
                                        <tr className="bg-[#050816] border-b border-[#1E2533] text-[9px] font-black uppercase text-slate-500 tracking-wider">
                                            <th className="p-4">Restore File ID</th>
                                            <th className="p-4">Filesize</th>
                                            <th className="p-4">Created At</th>
                                            <th className="p-4">Restore Status</th>
                                            <th className="p-4 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[#1E2533] text-xs">
                                        {backups.length === 0 ? (
                                            <tr>
                                                <td colSpan={5} className="p-8 text-center text-slate-600 font-bold uppercase text-[9px]">No config restore points compiled</td>
                                            </tr>
                                        ) : (
                                            backups.map((bk, i) => (
                                                <tr key={i} className="hover:bg-white/[0.01]">
                                                    <td className="p-4 font-bold text-slate-200 select-all font-mono">{bk.file}</td>
                                                    <td className="p-4 font-mono text-slate-400">{bk.size}</td>
                                                    <td className="p-4 font-mono text-slate-500">{new Date(bk.time).toLocaleString()}</td>
                                                    <td className="p-4">
                                                        <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full text-[8px] font-black uppercase tracking-wider">SECURE</span>
                                                    </td>
                                                    <td className="p-4 text-right">
                                                        <button 
                                                            onClick={() => handleRestoreBackup(bk.file)}
                                                            className="px-3 py-1.5 bg-[#050816] hover:bg-white/[0.02] border border-[#1E2533] hover:border-emerald-500/30 text-[9px] font-black uppercase text-emerald-400 tracking-widest rounded"
                                                        >
                                                            Restore Point
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Dangerous purges */}
                        <div className="bg-rose-500/5 border border-rose-500/20 rounded-3xl p-6 space-y-4 ring-1 ring-rose-500/10">
                            <h4 className="text-rose-400 font-bold text-xs uppercase tracking-wider flex items-center gap-2">
                                <LockKeyhole size={16} />
                                Platform Danger Zone
                            </h4>
                            <p className="text-slate-500 text-[11px] leading-relaxed font-medium">
                                Warning: Executing Cache Purge immediately breaks active memory routes and logs out all dashboard accounts. Use only during emergencies.
                            </p>
                            <button
                                onClick={() => {
                                    if (confirm('Verify Cache purge action? This will flush RAM buffers.')) {
                                        triggerAlert('success', 'Platform caches cleared.');
                                    }
                                }}
                                className="px-5 py-3 border border-rose-500/30 text-rose-400 hover:bg-rose-600 hover:text-white text-[9px] font-black uppercase tracking-widest rounded-xl transition-all"
                            >
                                Purge RAM Buffers
                            </button>
                        </div>
                    </div>
                )}

                {/* 8. SETTINGS AUDIT LOGS TAB */}
                {activeTab === 'audit' && (
                    <div className="space-y-6 animate-in fade-in duration-300">
                        <div className="bg-[#0D1017] border border-[#1E2533] rounded-3xl p-8 shadow-2xl space-y-4">
                            <h3 className="text-xs font-black uppercase text-white tracking-widest flex items-center gap-2 pb-4 border-b border-white/5">
                                <History className="text-[#FF6B00]" size={16} />
                                Platform Administrative Audit Logs
                            </h3>

                            <div className="border border-[#1E2533] rounded-2xl overflow-hidden">
                                <table className="w-full border-collapse text-left">
                                    <thead>
                                        <tr className="bg-[#050816] border-b border-[#1E2533] text-[9px] font-black uppercase text-slate-500 tracking-wider">
                                            <th className="p-4">Authorizer Admin</th>
                                            <th className="p-4">Action</th>
                                            <th className="p-4">Severity</th>
                                            <th className="p-4">IP Address</th>
                                            <th className="p-4">Target</th>
                                            <th className="p-4 text-right">Timestamp</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[#1E2533] text-xs">
                                        {auditLogs.length === 0 ? (
                                            <tr>
                                                <td colSpan={6} className="p-8 text-center text-slate-600 font-bold uppercase text-[9px]">No admin logs found</td>
                                            </tr>
                                        ) : (
                                            auditLogs.map((log, i) => (
                                                <tr key={i} className="hover:bg-white/[0.01]">
                                                    <td className="p-4">
                                                        <p className="font-bold text-slate-200">{log.actorName}</p>
                                                        <p className="text-[9px] text-slate-500 uppercase font-black tracking-wider">{log.actorRole}</p>
                                                    </td>
                                                    <td className="p-4 font-mono font-bold text-[11px] text-slate-300">{log.actionType}</td>
                                                    <td className="p-4">
                                                        <span className={`px-2 py-0.5 rounded-full border text-[8px] font-black uppercase tracking-wider ${
                                                            log.severity === 'CRITICAL' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : 'bg-slate-800 text-slate-400 border-slate-700'
                                                        }`}>{log.severity}</span>
                                                    </td>
                                                    <td className="p-4 font-mono text-slate-400">{log.ipAddress}</td>
                                                    <td className="p-4 text-slate-500 font-bold">{log.targetType || 'SYSTEM'}</td>
                                                    <td className="p-4 text-right text-slate-500 font-mono text-[10px]">{new Date(log.createdAt).toLocaleString()}</td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
}

// GENERAL COMPONENT HELPERS

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

interface ColorPickerItemProps {
    label: string;
    value: string;
    onChange: (color: string) => void;
}

function ColorPickerItem({ label, value, onChange }: ColorPickerItemProps) {
    return (
        <div className="space-y-1.5 p-3.5 bg-[#050816] border border-white/5 rounded-2xl">
            <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest pl-0.5 font-mono">{label}</label>
            <div className="flex items-center gap-2">
                <input
                    type="color"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className="w-8 h-8 rounded-lg overflow-hidden border-0 cursor-pointer outline-none bg-transparent"
                />
                <input
                    type="text"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className="flex-1 w-20 px-2 py-1 bg-[#0D1017] border border-[#1E2533] rounded text-[10px] font-mono font-bold text-slate-300 focus:outline-none"
                />
            </div>
        </div>
    );
}

interface LogoUploadProps {
    label: string;
    type: string;
    currentUrl?: string;
    onUpload: (type: any, e: React.ChangeEvent<HTMLInputElement>) => void;
    disabled?: boolean;
}

function LogoUploadItem({ label, type, currentUrl, onUpload, disabled }: LogoUploadProps) {
    return (
        <div className="space-y-2 p-3 bg-[#050816] border border-white/5 rounded-2xl flex flex-col justify-between">
            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest pl-0.5 font-mono">{label}</p>
            
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#0D1017] border border-white/5 rounded-lg flex items-center justify-center overflow-hidden shrink-0">
                    {currentUrl ? (
                        <img src={currentUrl} alt="Asset" className="max-h-full max-w-full object-contain" />
                    ) : (
                        <span className="text-[9px] font-bold text-slate-600 font-mono">None</span>
                    )}
                </div>
                
                <label className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-[#0D1017] border border-[#1E2533] hover:border-primary-orange/30 rounded-xl transition-all text-[9px] font-black uppercase text-slate-400 hover:text-slate-200 ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}>
                    {!disabled && <input type="file" className="hidden" accept="image/*" onChange={(e) => onUpload(type, e)} />}
                    <Upload size={10} />
                    Upload
                </label>
            </div>
        </div>
    );
}

interface GatewayCardProps {
    name: string;
    code: string;
    checked: boolean;
    onChange: (val: boolean) => void;
    telemetry?: {
        lastUsed?: string;
        successRate?: number;
        errorRate?: number;
    };
    saving?: boolean;
    onToggle: () => void;
}

function GatewayCard({ name, code, checked, onChange, telemetry, saving, onToggle }: GatewayCardProps) {
    return (
        <div className={`p-6 border rounded-3xl space-y-4 transition-all duration-300 ${
            checked 
                ? 'bg-primary-orange-light/5 border-primary-orange/20 shadow-lg' 
                : 'bg-[#050816] border-[#1E2533] shadow-inner opacity-75'
        }`}>
            <div className="flex items-start justify-between">
                <div>
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-200">{name}</h4>
                    <p className="text-[9px] text-slate-500 font-mono uppercase mt-0.5">Integration Code: {code}</p>
                </div>
                <button
                    onClick={() => {
                        onChange(!checked);
                        // Trigger immediate settings save
                        setTimeout(() => onToggle(), 100);
                    }}
                    disabled={saving}
                    className={`w-10 h-5.5 rounded-full relative transition-all duration-300 shrink-0 cursor-pointer outline-none ${checked ? 'bg-primary-orange' : 'bg-slate-800'}`}
                >
                    <div className={`absolute top-0.5 w-4.5 h-4.5 rounded-full bg-white transition-all duration-300 shadow ${checked ? 'left-5' : 'left-0.5'}`} />
                </button>
            </div>

            <div className="h-px bg-white/5 my-2" />

            <div className="grid grid-cols-2 gap-2 text-[9px] font-mono text-slate-500">
                <div>
                    <p className="font-bold text-slate-600 uppercase">Success Rate</p>
                    <p className="text-xs font-black text-emerald-400 mt-0.5">{telemetry?.successRate ?? 100}%</p>
                </div>
                <div>
                    <p className="font-bold text-slate-600 uppercase">Error Rate</p>
                    <p className="text-xs font-black text-rose-400 mt-0.5">{telemetry?.errorRate ?? 0}%</p>
                </div>
                <div className="col-span-2 mt-1">
                    <p className="font-bold text-slate-600 uppercase">Last Transaction</p>
                    <p className="text-[10px] text-slate-400 mt-0.5 truncate">
                        {telemetry?.lastUsed && telemetry.lastUsed !== 'N/A' ? new Date(telemetry.lastUsed).toLocaleString() : 'No transactions recorded'}
                    </p>
                </div>
            </div>
        </div>
    );
}
