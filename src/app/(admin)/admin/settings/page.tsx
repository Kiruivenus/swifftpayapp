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
    Gift
} from 'lucide-react';
import { adminService } from '@/services/admin.service';

export default function SettingsPage() {
    const [settings, setSettings] = useState<any>(null);
    const [health, setHealth] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Form States
    const [platformName, setPlatformName] = useState('');
    const [supportEmail, setSupportEmail] = useState('');
    const [maintenanceMode, setMaintenanceMode] = useState(false);
    const [maintenanceMessage, setMaintenanceMessage] = useState('');

    const [referralEnabled, setReferralEnabled] = useState(true);
    const [referralMinRewardUsd, setReferralMinRewardUsd] = useState(2);
    const [referralMaxRewardUsd, setReferralMaxRewardUsd] = useState(10);
    const [referralCardSpendRequirementUsd, setReferralCardSpendRequirementUsd] = useState(5);
    const [referralCardSpendDaysLimit, setReferralCardSpendDaysLimit] = useState(14);
    const [referralDepositRequirementUsd, setReferralDepositRequirementUsd] = useState(100);

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const [settingsRes, healthRes] = await Promise.all([
                adminService.getSettings(),
                adminService.getSystemHealth()
            ]);

            setSettings(settingsRes);
            setHealth(healthRes);

            setPlatformName(settingsRes.platformName);
            setSupportEmail(settingsRes.supportEmail);
            setMaintenanceMode(settingsRes.maintenanceMode);
            setMaintenanceMessage(settingsRes.maintenanceMessage || '');

            setReferralEnabled(settingsRes.referralEnabled ?? true);
            setReferralMinRewardUsd(settingsRes.referralMinRewardUsd ?? 2);
            setReferralMaxRewardUsd(settingsRes.referralMaxRewardUsd ?? 10);
            setReferralCardSpendRequirementUsd(settingsRes.referralCardSpendRequirementUsd ?? 5);
            setReferralCardSpendDaysLimit(settingsRes.referralCardSpendDaysLimit ?? 14);
            setReferralDepositRequirementUsd(settingsRes.referralDepositRequirementUsd ?? 100);
        } catch (err: any) {
            console.error('Failed to fetch settings:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleSaveGeneral = async () => {
        try {
            setSaving(true);
            await adminService.updateGeneralSettings({
                platformName,
                supportEmail,
                maintenanceMode,
                maintenanceMessage,
                referralEnabled,
                referralMinRewardUsd,
                referralMaxRewardUsd,
                referralCardSpendRequirementUsd,
                referralCardSpendDaysLimit,
                referralDepositRequirementUsd
            });
            alert("General settings updated successfully.");
            await fetchData();
        } catch (err: any) {
            alert(err.message);
        } finally {
            setSaving(false);
        }
    };

    const toggleMaintenance = () => {
        const action = !maintenanceMode ? "ACTIVATE" : "DEACTIVATE";
        if (confirm(`Are you sure you want to ${action} maintenance mode? This will affect all end-user operations immediately.`)) {
            setMaintenanceMode(!maintenanceMode);
        }
    };

    const handleUpload = async (type: 'logo' | 'favicon', e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onloadend = async () => {
            try {
                setSaving(true);
                await adminService.uploadBrandAsset(type, reader.result as string);
                alert(`${type} updated successfully.`);
                await fetchData();
            } catch (err: any) {
                alert(err.message);
            } finally {
                setSaving(false);
            }
        };
        reader.readAsDataURL(file);
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 font-sans">
                <Loader2 className="animate-spin text-primary-orange" size={40} />
                <p className="text-slate-500 font-bold uppercase tracking-widest text-xs animate-pulse">Loading system configuration...</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-700 pb-20 font-sans">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h2 className="text-3xl font-bold text-white tracking-tight">System Settings</h2>
                    <p className="text-slate-400 mt-1">Real-time platform configuration and integration management.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={fetchData}
                        className="p-2.5 bg-[#0D1017] hover:bg-white/[0.02] text-slate-400 rounded-xl border border-[#1E2533] transition-all outline-none"
                    >
                        <RefreshCw size={18} />
                    </button>
                    <button
                        onClick={handleSaveGeneral}
                        disabled={saving}
                        className="flex items-center gap-2 px-6 py-2.5 bg-primary-orange hover:bg-primary-orange-hover text-white font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-primary-orange/20 disabled:opacity-50"
                    >
                        {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                        Save Changes
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Left: Configuration Sections */}
                <div className="lg:col-span-2 space-y-8">

                    {/* General / Maintenance */}
                    <div className="bg-[#0D1017]/80 border border-[#1E2533] rounded-3xl p-8 backdrop-blur-md shadow-2xl">
                        <h3 className="text-base font-bold text-white flex items-center gap-3 mb-8 uppercase tracking-wider">
                            <Settings className="text-primary-orange" size={22} />
                            General Configuration
                        </h3>

                        <div className="space-y-6">
                            <div className={`flex items-center justify-between p-5 border rounded-2xl transition-all duration-500 ${maintenanceMode ? 'bg-rose-500/10 border-rose-500/30 ring-1 ring-rose-500/20 shadow-[0_0_12px_rgba(244,63,94,0.05)]' : 'bg-[#07090E]/40 border-[#1E2533] shadow-inner'}`}>
                                <div className="flex items-start gap-4">
                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${maintenanceMode ? 'bg-rose-500/20 text-rose-400 rotate-12 scale-105 border border-rose-500/35' : 'bg-[#07090E] border border-[#1E2533] text-slate-500'}`}>
                                        <AlertTriangle size={22} />
                                    </div>
                                    <div>
                                        <h4 className={`text-sm font-black uppercase tracking-wider ${maintenanceMode ? 'text-rose-400' : 'text-white'}`}>Maintenance Mode</h4>
                                        <p className="text-xs text-slate-500 mt-1 max-w-sm font-medium">Shut down user access across mobile and web for scheduled updates.</p>
                                    </div>
                                </div>
                                <button
                                    onClick={toggleMaintenance}
                                    className={`w-12 h-6 rounded-full relative transition-all duration-300 shadow-inner cursor-pointer outline-none ${maintenanceMode ? 'bg-rose-500' : 'bg-slate-800'}`}
                                >
                                    <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all duration-300 shadow-lg ${maintenanceMode ? 'left-6.5' : 'left-0.5'}`} />
                                </button>
                            </div>

                            {maintenanceMode && (
                                <div className="space-y-2 animate-in slide-in-from-top-4 duration-300">
                                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest pl-1">Public Maintenance Message</label>
                                    <textarea
                                        value={maintenanceMessage}
                                        onChange={(e) => setMaintenanceMessage(e.target.value)}
                                        placeholder="Display message for users..."
                                        rows={2}
                                        className="w-full px-4 py-3 bg-[#07090E] border border-[#1E2533] rounded-xl text-xs text-slate-200 focus:outline-none focus:border-rose-500/30 resize-none font-semibold"
                                    />
                                </div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                                <div className="space-y-2">
                                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest pl-1 font-mono">Platform Branding Name</label>
                                    <input
                                        type="text"
                                        value={platformName}
                                        onChange={(e) => setPlatformName(e.target.value)}
                                        className="w-full px-4 py-3 bg-[#07090E] border border-[#1E2533] rounded-xl text-xs text-slate-200 focus:outline-none focus:border-primary-orange font-bold uppercase tracking-wider"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest pl-1 font-mono">Global Support Email</label>
                                    <input
                                        type="email"
                                        value={supportEmail}
                                        onChange={(e) => setSupportEmail(e.target.value)}
                                        className="w-full px-4 py-3 bg-[#07090E] border border-[#1E2533] rounded-xl text-xs text-slate-200 focus:outline-none focus:border-primary-orange font-bold font-mono"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Referral Program Settings */}
                    <div className="bg-[#0D1017]/80 border border-[#1E2533] rounded-3xl p-8 backdrop-blur-md shadow-2xl">
                        <h3 className="text-base font-bold text-white flex items-center gap-3 mb-8 uppercase tracking-wider">
                            <Gift className="text-primary-orange" size={22} />
                            Referral Program Configuration
                        </h3>

                        <div className="space-y-6">
                            <div className={`flex items-center justify-between p-5 border rounded-2xl transition-all duration-500 ${referralEnabled ? 'bg-primary-orange/10 border-primary-orange/30 ring-1 ring-primary-orange/20 shadow-[0_0_12px_rgba(255,90,0,0.05)]' : 'bg-[#07090E]/40 border-[#1E2533] shadow-inner'}`}>
                                <div className="flex items-start gap-4">
                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${referralEnabled ? 'bg-primary-orange/20 text-primary-orange rotate-12 scale-105 border border-primary-orange/35' : 'bg-[#07090E] border border-[#1E2533] text-slate-500'}`}>
                                        <Gift size={22} />
                                    </div>
                                    <div>
                                        <h4 className={`text-sm font-black uppercase tracking-wider ${referralEnabled ? 'text-primary-orange' : 'text-white'}`}>Referral Program Status</h4>
                                        <p className="text-xs text-slate-500 mt-1 max-w-sm font-medium">Toggle user invitations and referral reward tracking globally.</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setReferralEnabled(!referralEnabled)}
                                    className={`w-12 h-6 rounded-full relative transition-all duration-300 shadow-inner cursor-pointer outline-none ${referralEnabled ? 'bg-primary-orange' : 'bg-slate-800'}`}
                                >
                                    <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all duration-300 shadow-lg ${referralEnabled ? 'left-6.5' : 'left-0.5'}`} />
                                </button>
                            </div>

                            {referralEnabled && (
                                <div className="space-y-6 animate-in slide-in-from-top-4 duration-300">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest pl-1 font-mono">Min Reward Amount (USD)</label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                value={referralMinRewardUsd}
                                                onChange={(e) => setReferralMinRewardUsd(Number(e.target.value))}
                                                className="w-full px-4 py-3 bg-[#07090E] border border-[#1E2533] rounded-xl text-xs text-slate-200 focus:outline-none focus:border-primary-orange font-bold font-mono"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest pl-1 font-mono">Max Reward Amount (USD)</label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                value={referralMaxRewardUsd}
                                                onChange={(e) => setReferralMaxRewardUsd(Number(e.target.value))}
                                                className="w-full px-4 py-3 bg-[#07090E] border border-[#1E2533] rounded-xl text-xs text-slate-200 focus:outline-none focus:border-primary-orange font-bold font-mono"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest pl-1 font-mono">Card Spend Required (USD)</label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                value={referralCardSpendRequirementUsd}
                                                onChange={(e) => setReferralCardSpendRequirementUsd(Number(e.target.value))}
                                                className="w-full px-4 py-3 bg-[#07090E] border border-[#1E2533] rounded-xl text-xs text-slate-200 focus:outline-none focus:border-primary-orange font-bold font-mono"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest pl-1 font-mono">Card Spend Limit (Days)</label>
                                            <input
                                                type="number"
                                                value={referralCardSpendDaysLimit}
                                                onChange={(e) => setReferralCardSpendDaysLimit(Number(e.target.value))}
                                                className="w-full px-4 py-3 bg-[#07090E] border border-[#1E2533] rounded-xl text-xs text-slate-200 focus:outline-none focus:border-primary-orange font-bold font-mono"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest pl-1 font-mono">Deposit Required (USD)</label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                value={referralDepositRequirementUsd}
                                                onChange={(e) => setReferralDepositRequirementUsd(Number(e.target.value))}
                                                className="w-full px-4 py-3 bg-[#07090E] border border-[#1E2533] rounded-xl text-xs text-slate-200 focus:outline-none focus:border-primary-orange font-bold font-mono"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* API & Integration Keys */}
                    <div className="bg-[#0D1017]/80 border border-[#1E2533] rounded-3xl p-8 backdrop-blur-md shadow-2xl">
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="text-base font-bold text-white flex items-center gap-3 uppercase tracking-wider">
                                <Key className="text-amber-500" size={22} />
                                Integration Secrets
                            </h3>
                            {!settings?.canEditSecrets && (
                                <div className="flex items-center gap-2 px-3 py-1 bg-white/[0.02] border border-[#1E2533] rounded-full text-[8px] font-black text-slate-500 uppercase tracking-widest">
                                    <Lock size={10} />
                                    Read-Only
                                </div>
                            )}
                        </div>

                        <div className="space-y-5">
                            <SecretItem label="M-Pesa Consumer Key" id="mpesaConsumerKey" value={settings?.mpesaConsumerKey} readonly={!settings?.canEditSecrets} onUpdate={fetchData} />
                            <SecretItem label="M-Pesa Consumer Secret" id="mpesaConsumerSecret" value={settings?.mpesaConsumerSecret} readonly={!settings?.canEditSecrets} onUpdate={fetchData} />
                            <SecretItem label="M-Pesa Passkey" id="mpesaPasskey" value={settings?.mpesaPasskey} readonly={!settings?.canEditSecrets} onUpdate={fetchData} />
                            <div className="h-px bg-[#1E2533] my-4" />
                            <SecretItem label="SendGrid API Key" id="sendgridApiKey" value={settings?.sendgridApiKey} readonly={!settings?.canEditSecrets} onUpdate={fetchData} />
                            <SecretItem label="SMTP Server Password" id="smtpPass" value={settings?.smtpPass} readonly={!settings?.canEditSecrets} onUpdate={fetchData} />
                        </div>

                        <div className="mt-10 p-5 bg-primary-orange-light/5 border border-primary-orange-border/30 rounded-2xl flex items-start gap-4 shadow-inner">
                            <Shield className="text-primary-orange shrink-0 mt-0.5" size={20} />
                            <div>
                                <p className="text-[9px] font-black text-primary-orange uppercase tracking-widest mb-1.5 pl-0.5">Security Architecture</p>
                                <p className="text-xs text-slate-500 leading-relaxed font-medium">
                                    Integration secrets are encrypted at rest using AES-256-GCM. For security, original values are never displayed in full. Editing a key will permanently overwrite the existing value.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right: Brand & Visuals */}
                <div className="space-y-8">
                    <div className="bg-[#0D1017]/80 border border-[#1E2533] rounded-3xl p-6 backdrop-blur-md shadow-2xl">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-base font-bold text-white flex items-center gap-3 uppercase tracking-wider">
                                <ImageIcon className="text-primary-orange" size={20} />
                                Brand Identity
                            </h3>
                        </div>

                        <div className="space-y-6">
                            <div>
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 pl-0.5">Login Platform Logo</p>
                                <label className={`aspect-[3/1] bg-[#07090E]/40 border border-dashed border-[#1E2533] rounded-2xl flex items-center justify-center group transition-all overflow-hidden relative shadow-inner ${settings?.canEditBrandAssets ? 'cursor-pointer hover:border-primary-orange/50' : ''}`}>
                                    {settings?.canEditBrandAssets && (
                                        <input type="file" className="hidden" accept="image/*" onChange={(e) => handleUpload('logo', e)} />
                                    )}
                                    {settings?.logoUrl ? (
                                        <img src={settings.logoUrl} alt="Logo" className="max-h-[60%] object-contain" />
                                    ) : (
                                        <div className="text-center group-hover:scale-105 transition-transform flex items-center gap-3 px-6 opacity-40">
                                            <div className="w-8 h-8 bg-[#07090E] rounded-lg flex items-center justify-center font-black text-slate-600">?</div>
                                            <span className="text-xs font-black text-slate-600 uppercase tracking-wider">No Logo</span>
                                        </div>
                                    )}
                                    {settings?.canEditBrandAssets && (
                                        <div className="absolute inset-0 bg-[#07090E]/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <span className="text-[9px] font-black text-white uppercase tracking-widest">Update Logo</span>
                                        </div>
                                    )}
                                </label>
                            </div>
 
                            <div>
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 pl-0.5">System Favicon</p>
                                <label className={`w-16 h-16 bg-[#07090E]/40 border border-dashed border-[#1E2533] rounded-2xl flex items-center justify-center group transition-all relative shadow-inner ${settings?.canEditBrandAssets ? 'cursor-pointer hover:border-primary-orange/50' : ''}`}>
                                    {settings?.canEditBrandAssets && (
                                        <input type="file" className="hidden" accept="image/*" onChange={(e) => handleUpload('favicon', e)} />
                                    )}
                                    {settings?.faviconUrl ? (
                                        <img src={settings.faviconUrl} alt="Fav" className="w-8 h-8 rounded" />
                                    ) : (
                                        <div className="w-8 h-8 bg-[#07090E] rounded-lg flex items-center justify-center font-black text-slate-600 opacity-40">?</div>
                                    )}
                                    {settings?.canEditBrandAssets && (
                                        <div className="absolute inset-0 bg-[#07090E]/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-2xl">
                                            <ImageIcon size={16} className="text-white" />
                                        </div>
                                    )}
                                </label>
                            </div>
                        </div>
                    </div>

                    <div className="bg-[#0D1017]/80 border border-[#1E2533] rounded-3xl p-6 backdrop-blur-md shadow-2xl">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-base font-bold text-white flex items-center gap-3 uppercase tracking-wider">
                                <Server className="text-emerald-400" size={20} />
                                System Pulse
                            </h3>
                            <div className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                            </div>
                        </div>
                        <div className="space-y-3 font-mono">
                            <HealthItem label="App Framework" status={health?.coreApi || 'offline'} />
                            <HealthItem label="Main Database" status={health?.database || 'offline'} />
                            <HealthItem label="M-Pesa Gateway" status={health?.mpesa || 'offline'} />
                            <HealthItem label="Communications" status={health?.email || 'offline'} />
                        </div>
                        <div className="mt-6 pt-5 border-t border-[#1E2533] flex items-center justify-center">
                            <p className="text-[9px] text-slate-600 font-black uppercase tracking-[0.2em]">Service Continuity: 99.98%</p>
                        </div>
                    </div>

                    <div className="bg-rose-500/10 border border-rose-500/20 rounded-3xl p-6 backdrop-blur-md shadow-lg shadow-rose-950/10 ring-1 ring-inset ring-rose-500/10">
                        <h4 className="text-rose-400 font-bold mb-3 flex items-center gap-2 text-xs uppercase tracking-wider">
                            <Lock size={18} />
                            Danger Zone
                        </h4>
                        <p className="text-[11px] text-rose-300/70 font-medium leading-relaxed mb-6">
                            Executing these actions will flush global caches and terminate all active sessions. Proceed with extreme caution.
                        </p>
                        <button className="w-full py-3.5 border border-rose-500/40 text-rose-400 hover:bg-rose-600 hover:text-white font-black text-[9px] uppercase tracking-[0.2em] rounded-xl transition-all shadow-lg active:scale-95 cursor-pointer outline-none">
                            Purge System Cache
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

function SecretItem({ label, id, value, readonly, onUpdate }: any) {
    const [editing, setEditing] = useState(false);
    const [newValue, setNewValue] = useState('');
    const [busy, setBusy] = useState(false);

    const handleSubmit = async () => {
        if (!newValue) return;
        try {
            setBusy(true);
            await adminService.updateIntegrationKeys({ [id]: newValue });
            alert(`${label} updated successfully.`);
            setEditing(false);
            setNewValue('');
            onUpdate();
        } catch (err: any) {
            alert(err.message);
        } finally {
            setBusy(false);
        }
    };

    return (
        <div className="space-y-2">
            <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest pl-1 font-mono">{label}</label>
            <div className="flex gap-2">
                <div className="flex-1 relative">
                    <input
                        type="password"
                        value={value}
                        readOnly
                        className="w-full pl-4 pr-12 py-3 bg-[#07090E]/40 border border-[#1E2533] rounded-xl text-xs font-mono text-slate-600 focus:outline-none"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-700">
                        <CheckCircle2 size={16} />
                    </div>
                </div>
                {!readonly && (
                    <button
                        onClick={() => setEditing(true)}
                        className="px-5 bg-[#0D1017] hover:bg-white/[0.03] text-slate-300 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border border-[#1E2533] hover:border-primary-orange/30 cursor-pointer outline-none"
                    >
                        Edit
                    </button>
                )}
            </div>

            {editing && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-300">
                    <div className="bg-[#0D1017] border border-[#1E2533] w-full max-w-md rounded-3xl p-8 shadow-2xl animate-in zoom-in-95 duration-300">
                        <h4 className="text-lg font-bold text-white uppercase tracking-wider mb-2">Update Secret</h4>
                        <p className="text-xs text-slate-500 mb-8 font-medium">Entering a new value for <span className="text-primary-orange font-bold">{label}</span> will overwrite the existing one immediately.</p>
 
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest pl-1">New Secret Value</label>
                                <input
                                    type="text"
                                    value={newValue}
                                    onChange={(e) => setNewValue(e.target.value)}
                                    autoFocus
                                    className="w-full px-5 py-4 bg-[#07090E] border border-[#1E2533] rounded-2xl text-xs text-white font-mono placeholder:text-slate-800 focus:outline-none focus:border-primary-orange transition-all ring-4 ring-primary-orange/5"
                                    placeholder="Paste new secret here..."
                                />
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => { setEditing(false); setNewValue(''); }}
                                    className="flex-1 py-3.5 bg-white/[0.02] border border-[#1E2533] hover:bg-white/[0.04] text-white font-bold text-xs uppercase tracking-widest rounded-2xl transition-all outline-none"
                                >
                                    Cancel
                                </button>
                                <button
                                    disabled={!newValue || busy}
                                    onClick={handleSubmit}
                                    className="flex-2 py-3.5 bg-primary-orange hover:bg-primary-orange-hover text-white font-black text-xs uppercase tracking-widest rounded-2xl transition-all shadow-lg shadow-primary-orange/20 disabled:opacity-50 flex items-center justify-center gap-2 outline-none"
                                >
                                    {busy ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                                    Commit Change
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function HealthItem({ label, status }: any) {
    const isOnline = status === 'online' || status === 'ONLINE';
    const isWarning = status === 'warning' || status === 'WARNING';

    return (
        <div className="flex items-center justify-between p-3.5 bg-[#07090E]/40 border border-[#1E2533] rounded-2xl group hover:border-white/10 transition-all duration-300">
            <span className="text-xs text-slate-400 font-bold group-hover:text-slate-200 transition-colors uppercase tracking-tight font-sans">{label}</span>
            <div className="flex items-center gap-3">
                <span className={`text-[9px] font-black uppercase tracking-widest ${isOnline ? 'text-emerald-400' : isWarning ? 'text-amber-400' : 'text-rose-400'}`}>
                    {status}
                </span>
                <div className={`w-2 h-2 rounded-full ring-4 ${isOnline ? 'bg-emerald-500 ring-emerald-500/10 shadow-[0_0_12px_rgba(16,185,129,0.4)] animate-pulse' :
                    isWarning ? 'bg-amber-500 ring-amber-500/10 shadow-[0_0_12px_rgba(245,158,11,0.4)]' :
                        'bg-rose-500 ring-rose-500/10 shadow-[0_0_12px_rgba(244,63,94,0.4)]'
                    }`} />
            </div>
        </div>
    );
}
