"use client";

import React from 'react';
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
    EyeOff
} from 'lucide-react';

export default function SettingsPage() {
    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h2 className="text-3xl font-bold text-white tracking-tight">System Settings</h2>
                    <p className="text-slate-400 mt-1">Global platform configuration, API integrations, and security policies.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl transition-all shadow-lg shadow-indigo-600/20">
                        <Save size={18} />
                        Save Changes
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Left: Configuration Sections */}
                <div className="lg:col-span-2 space-y-8">

                    {/* General / Maintenance */}
                    <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-8 backdrop-blur-sm">
                        <h3 className="text-lg font-bold text-white flex items-center gap-3 mb-8">
                            <Settings className="text-indigo-400" size={24} />
                            General Configuration
                        </h3>

                        <div className="space-y-6">
                            <div className="flex items-center justify-between p-4 bg-rose-500/5 border border-rose-500/10 rounded-2xl">
                                <div className="flex items-start gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center">
                                        <AlertTriangle size={20} />
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-bold text-white">Maintenance Mode</h4>
                                        <p className="text-xs text-slate-500 mt-1">When active, users cannot access the mobile app or web platform.</p>
                                    </div>
                                </div>
                                <button className="w-12 h-6 rounded-full bg-slate-800 relative transition-all">
                                    <div className="absolute top-1 left-1 w-4 h-4 rounded-full bg-slate-600" />
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1">Platform Name</label>
                                    <input
                                        type="text"
                                        defaultValue="SwiftPay"
                                        className="w-full px-4 py-2.5 bg-slate-950/50 border border-slate-800 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-indigo-500/50"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1">Support Email</label>
                                    <input
                                        type="text"
                                        defaultValue="support@swiftpay.ke"
                                        className="w-full px-4 py-2.5 bg-slate-950/50 border border-slate-800 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-indigo-500/50"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* API & Integration Keys */}
                    <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-8 backdrop-blur-sm">
                        <h3 className="text-lg font-bold text-white flex items-center gap-3 mb-8">
                            <Key className="text-amber-400" size={24} />
                            API & Integration Keys
                        </h3>

                        <div className="space-y-6">
                            <SettingsKeyItem label="M-Pesa Consumer Key" value="Pj...48x9" isSecret={true} />
                            <SettingsKeyItem label="M-Pesa Consumer Secret" value="Ak...29z1" isSecret={true} />
                            <SettingsKeyItem label="M-Pesa Passkey" value="bf...0e32" isSecret={true} />
                            <div className="h-px bg-slate-800 my-2" />
                            <SettingsKeyItem label="SendGrid API Key" value="SG...004x" isSecret={true} />
                            <SettingsKeyItem label="Binance Pay Secret" value="Bn...X821" isSecret={true} />
                        </div>

                        <div className="mt-8 p-4 bg-amber-500/5 border border-amber-500/20 rounded-2xl flex items-start gap-3">
                            <Shield className="text-amber-500 shrink-0 mt-0.5" size={16} />
                            <p className="text-[11px] text-amber-300/80 leading-relaxed font-medium">
                                Encryption Notice: All API keys are encrypted at rest with AES-256. Changing these values will require a system restart to re-initialize service providers.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Right: Brand & Visuals */}
                <div className="space-y-8">
                    <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-6 backdrop-blur-sm">
                        <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-3">
                            <ImageIcon className="text-indigo-400" size={20} />
                            Brand Assets
                        </h3>

                        <div className="space-y-6">
                            <div>
                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Main Platform Logo</p>
                                <div className="aspect-[3/1] bg-slate-950/50 border border-dashed border-slate-800 rounded-2xl flex items-center justify-center group cursor-pointer hover:border-indigo-500/50 transition-all overflow-hidden relative">
                                    <div className="text-center group-hover:scale-110 transition-transform flex items-center gap-3 px-6">
                                        <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center font-bold text-white">S</div>
                                        <span className="text-lg font-bold text-white">SwiftPay</span>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">App Favicon</p>
                                <div className="w-16 h-16 bg-slate-950/50 border border-dashed border-slate-800 rounded-2xl flex items-center justify-center group cursor-pointer hover:border-indigo-500/50 transition-all">
                                    <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center font-bold text-white text-xs">S</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-6 backdrop-blur-sm">
                        <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-3">
                            <Server className="text-emerald-400" size={20} />
                            System Health
                        </h3>
                        <div className="space-y-4">
                            <HealthItem label="Core API" status="online" />
                            <HealthItem label="Database Cluster" status="online" />
                            <HealthItem label="Redis Cache" status="online" />
                            <HealthItem label="M-Pesa Webhook" status="warning" />
                            <HealthItem label="Email SMTP" status="online" />
                        </div>
                    </div>

                    <div className="bg-rose-500/10 border border-rose-500/20 rounded-3xl p-6 backdrop-blur-sm">
                        <h4 className="text-rose-400 font-bold mb-3 flex items-center gap-2">
                            <Lock size={18} />
                            Danger Zone
                        </h4>
                        <p className="text-[11px] text-rose-300 font-medium leading-relaxed mb-6">
                            Irreversible actions that affect the entire platform. Authenticate with Super Admin password to proceed.
                        </p>
                        <button className="w-full py-3 border border-rose-500/50 text-rose-400 hover:bg-rose-500 hover:text-white font-black text-[10px] uppercase tracking-widest rounded-xl transition-all">
                            Flush Global Cache
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

function SettingsKeyItem({ label, value, isSecret }: any) {
    const [show, setShow] = React.useState(false);

    return (
        <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1">{label}</label>
            <div className="flex gap-2">
                <div className="flex-1 relative">
                    <input
                        type={show ? "text" : "password"}
                        defaultValue={value}
                        readOnly
                        className="w-full pl-4 pr-12 py-2.5 bg-slate-950/30 border border-slate-800 rounded-xl text-sm font-mono text-slate-400 focus:outline-none"
                    />
                    <button
                        onClick={() => setShow(!show)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-400 transition-colors"
                    >
                        {show ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                </div>
                <button className="px-4 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-all border border-slate-700">
                    Edit
                </button>
            </div>
        </div>
    );
}

function HealthItem({ label, status }: any) {
    return (
        <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">{label}</span>
            <div className="flex items-center gap-2">
                <span className={`text-[10px] font-bold uppercase tracking-widest ${status === 'online' ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {status}
                </span>
                <div className={`w-1.5 h-1.5 rounded-full ${status === 'online' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]'}`} />
            </div>
        </div>
    );
}
