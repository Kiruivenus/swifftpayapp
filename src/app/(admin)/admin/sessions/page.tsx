import React from 'react';
import {
    ShieldAlert,
    Smartphone,
    Monitor,
    LogOut,
    Globe,
    Lock,
    UserX,
    History,
    Search,
    CheckCircle2,
    AlertTriangle,
    Fingerprint
} from 'lucide-react';

export default function SecuritySessionsPage() {
    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h2 className="text-3xl font-bold text-white tracking-tight">Security & Sessions</h2>
                    <p className="text-slate-400 mt-1">Monitor active connections, manage trusted devices, and handle security incidents.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button className="flex items-center gap-2 px-6 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-semibold rounded-xl transition-all shadow-lg shadow-rose-600/20">
                        <LogOut size={18} />
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
                                    placeholder="Filter by IP or User"
                                    className="pl-9 pr-4 py-2 bg-slate-950/50 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500/50"
                                />
                            </div>
                        </div>
                        <div className="divide-y divide-slate-800">
                            <SessionItem
                                user="Patrick Kirui (Admin)"
                                device="MacBook Pro · Chrome"
                                ip="197.232.14.85"
                                location="Nairobi, Kenya"
                                status="current"
                            />
                            <SessionItem
                                user="Sarah Johnson"
                                device="Windows PC · Edge"
                                ip="41.215.10.12"
                                location="Mombasa, Kenya"
                                status="active"
                            />
                            <SessionItem
                                user="Alex Mercer"
                                device="Linux · Firefox"
                                ip="102.34.5.110"
                                location="Dar es Salaam, TZ"
                                status="active"
                            />
                        </div>
                    </div>

                    <div className="bg-slate-900/50 border border-slate-800 rounded-3xl overflow-hidden backdrop-blur-sm">
                        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
                            <h3 className="text-lg font-bold text-white flex items-center gap-3">
                                <Smartphone className="text-indigo-400" size={24} />
                                Active Mobile Devices
                            </h3>
                        </div>
                        <div className="divide-y divide-slate-800">
                            <MobileDeviceItem
                                user="John Doe"
                                device="Samsung Galaxy S22"
                                os="Android 14"
                                lastActive="2 mins ago"
                                biometric={true}
                            />
                            <MobileDeviceItem
                                user="Jane Smith"
                                device="iPhone 15 Pro"
                                os="iOS 17.4"
                                lastActive="15 mins ago"
                                biometric={false}
                            />
                        </div>
                    </div>
                </div>

                {/* Right: Security Analytics & Alerts */}
                <div className="space-y-6">
                    <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-6 backdrop-blur-sm">
                        <h3 className="text-lg font-bold text-white mb-6">Security Pulse</h3>
                        <div className="space-y-6">
                            <SecurityMetric label="Failed Login Attempts" value="12" change="+2" trend="up" />
                            <SecurityMetric label="New Trusted Devices" value="45" change="+8" trend="up" />
                            <SecurityMetric label="Password Resets" value="8" change="-4" trend="down" />
                        </div>
                    </div>

                    <div className="bg-rose-500/10 border border-rose-500/20 rounded-3xl p-6 backdrop-blur-sm">
                        <h4 className="text-rose-400 font-bold mb-4 flex items-center gap-2">
                            <ShieldAlert size={18} />
                            Recent Security Alerts
                        </h4>
                        <div className="space-y-4">
                            <SecurityAlertItem
                                title="Brute-force Attempt"
                                desc="IP 182.4.52.19 blocked after 10 failed logins."
                                time="12h ago"
                                severity="high"
                            />
                            <SecurityAlertItem
                                title="New Admin Promotion"
                                desc="User 'sarah_j' promoted to support role."
                                time="Yesterday"
                                severity="medium"
                            />
                        </div>
                    </div>

                    <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-6 backdrop-blur-sm">
                        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                            <Lock size={18} className="text-slate-400" />
                            System Policies
                        </h3>
                        <div className="space-y-3">
                            <PolicyToggle label="Mandatory 2FA for Admins" active={true} />
                            <PolicyToggle label="Block Non-Kenyan IPs" active={false} />
                            <PolicyToggle label="Auto-expire Sessions (8h)" active={true} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function SessionItem({ user, device, ip, location, status }: any) {
    return (
        <div className="p-6 flex items-center justify-between group hover:bg-slate-800/10 transition-colors">
            <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-slate-500 group-hover:text-indigo-400 transition-colors">
                    <Monitor size={20} />
                </div>
                <div>
                    <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-white">{user}</h4>
                        {status === 'current' && (
                            <span className="text-[9px] font-black bg-indigo-500/10 text-indigo-400 px-1.5 py-0.5 rounded border border-indigo-500/20 uppercase tracking-widest">You</span>
                        )}
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">{device}</p>
                </div>
            </div>
            <div className="hidden md:flex flex-col items-center">
                <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium tracking-tight">
                    <Globe size={12} className="text-slate-600" />
                    {ip}
                </div>
                <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest mt-1">{location}</p>
            </div>
            <button className="p-2 text-slate-600 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all" title="Force Logout">
                <LogOut size={16} />
            </button>
        </div>
    );
}

function MobileDeviceItem({ user, device, os, lastActive, biometric }: any) {
    return (
        <div className="p-6 flex items-center justify-between group hover:bg-slate-800/10 transition-colors">
            <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-slate-500 group-hover:text-indigo-400 transition-colors">
                    <Smartphone size={20} />
                </div>
                <div>
                    <h4 className="text-sm font-bold text-white">{device}</h4>
                    <p className="text-xs text-slate-500 mt-0.5">User: {user} · {os}</p>
                </div>
            </div>
            <div className="flex items-center gap-8">
                <div className="text-right hidden sm:block">
                    <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest leading-none mb-1">Last Sync</p>
                    <p className="text-xs font-bold text-slate-400">{lastActive}</p>
                </div>
                <div className={`p-2 rounded-lg ${biometric ? 'bg-emerald-500/5 text-emerald-500/50' : 'bg-slate-800 text-slate-700'}`} title={biometric ? "Biometrics Enabled" : "PIN Only"}>
                    <Fingerprint size={18} />
                </div>
                <button className="p-2 text-slate-600 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all">
                    <UserX size={16} />
                </button>
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
            <div className={`text-[10px] font-black px-2 py-1 rounded-lg ${trend === 'up' ? 'text-rose-400 bg-rose-500/5' : 'text-emerald-400 bg-emerald-500/5'}`}>
                {change}
            </div>
        </div>
    );
}

function SecurityAlertItem({ title, desc, time, severity }: any) {
    return (
        <div className="space-y-1.5 py-1">
            <div className="flex items-center justify-between">
                <h5 className={`text-xs font-bold ${severity === 'high' ? 'text-rose-400' : 'text-amber-400'}`}>{title}</h5>
                <span className="text-[9px] font-bold text-slate-600">{time}</span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium leading-relaxed">{desc}</p>
        </div>
    );
}

function PolicyToggle({ label, active }: any) {
    return (
        <div className="flex items-center justify-between p-3 rounded-xl border border-slate-800 bg-slate-950/20">
            <span className="text-xs font-bold text-slate-300">{label}</span>
            <button className={`w-8 h-4 rounded-full relative transition-all ${active ? 'bg-emerald-600' : 'bg-slate-800'}`}>
                <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all ${active ? 'left-4.5' : 'left-0.5'}`} />
            </button>
        </div>
    );
}
