"use client";

import React, { useState } from 'react';
import {
    Bell,
    Send,
    Users,
    Target,
    Smartphone,
    Mail,
    History,
    Search,
    Filter,
    CheckCircle2,
    AlertCircle,
    Megaphone,
    Loader2
} from 'lucide-react';
import { adminService } from '@/services/admin.service';

export default function NotificationsPage() {
    const [title, setTitle] = useState('');
    const [body, setBody] = useState('');
    const [channels, setChannels] = useState({ push: true, email: false, inApp: true });
    const [scope, setScope] = useState('ALL_USERS');
    const [sending, setSending] = useState(false);
    const [loading, setLoading] = useState(true);
    const [estimate, setEstimate] = useState<number | null>(null);
    const [estimating, setEstimating] = useState(false);
    const [recentBroadcasts, setRecentBroadcasts] = useState<any[]>([]);
    const [settings, setSettings] = useState<any>(null);

    const fetchData = React.useCallback(async () => {
        try {
            setLoading(true);
            const res = await adminService.getCommunicationsOverview();
            setSettings(res.settings || null);
            setRecentBroadcasts(res.recentBroadcasts || []);
        } catch (err: any) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchEstimate = React.useCallback(async () => {
        try {
            setEstimating(true);
            const res = await adminService.getAudienceEstimate({ scope });
            setEstimate(res.targeted);
        } catch (err: any) {
            console.error(err);
        } finally {
            setEstimating(false);
        }
    }, [scope]);

    React.useEffect(() => {
        fetchData();
    }, [fetchData]);

    React.useEffect(() => {
        const timer = setTimeout(() => fetchEstimate(), 500);
        return () => clearTimeout(timer);
    }, [fetchEstimate]);

    const handleSend = async () => {
        if (!title || !body) return alert("Please fill in both title and message");
        if (!confirm(`Broadcast this message to ${estimate} users via selected channels?`)) return;

        try {
            setSending(true);
            await adminService.createBroadcast({
                title,
                message: body,
                targetAudience: { scope },
                channels,
                sendNow: true
            });
            alert("Broadcast queued successfully!");
            setTitle('');
            setBody('');
            fetchData();
        } catch (err: any) {
            alert(err.message);
        } finally {
            setSending(false);
        }
    };

    const handleToggleSetting = async (key: string, value: boolean) => {
        try {
            const newSettings = { ...settings, [key]: value };
            setSettings(newSettings);
            await adminService.updateNotificationSettings(newSettings);
        } catch (err: any) {
            alert(err.message);
            fetchData();
        }
    };

    if (loading && !settings) {
        return (
            <div className="flex items-center justify-center min-h-[400px] font-sans">
                <Loader2 className="animate-spin text-primary-orange" size={40} />
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-700 font-sans">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h2 className="text-3xl font-bold text-white tracking-tight">Communications</h2>
                    <p className="text-slate-400 mt-1">Manage announcements, push notifications, and automated alerts.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Left: Campaign Composer */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-[#0D1017] border border-[#1E2533] rounded-2xl p-6 md:p-8 shadow-2xl">
                        <h3 className="text-base font-bold text-white uppercase tracking-wider flex items-center gap-3 mb-8">
                            <Megaphone className="text-primary-orange" size={22} />
                            Broadcast Composer
                        </h3>

                        <div className="space-y-6">
                            {/* Target Group */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Target Audience</label>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                    <TargetOption icon={<Users size={16} />} label="All Users" active={scope === 'ALL_USERS'} onClick={() => setScope('ALL_USERS')} />
                                    <TargetOption icon={<Target size={16} />} label="Verified Only" active={scope === 'VERIFIED_ONLY'} onClick={() => setScope('VERIFIED_ONLY')} />
                                    <TargetOption icon={<AlertCircle size={16} />} label="Unverified Only" active={scope === 'UNVERIFIED_ONLY'} onClick={() => setScope('UNVERIFIED_ONLY')} />
                                </div>
                            </div>

                            {/* Channels */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Delivery Channels</label>
                                <div className="flex flex-wrap gap-6">
                                    <ChannelToggle icon={<Smartphone size={16} />} label="Push" active={channels.push} onClick={() => setChannels({ ...channels, push: !channels.push })} />
                                    <ChannelToggle icon={<Mail size={16} />} label="Email" active={channels.email} onClick={() => setChannels({ ...channels, email: !channels.email })} />
                                    <ChannelToggle icon={<Bell size={16} />} label="In-App" active={channels.inApp} onClick={() => setChannels({ ...channels, inApp: !channels.inApp })} />
                                </div>
                            </div>

                            {/* Message Content */}
                            <div className="space-y-4 pt-4 border-t border-[#1E2533]">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Notification Title</label>
                                    <input
                                        type="text"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        placeholder="e.g. Scheduled Maintenance"
                                        className="w-full px-4 py-3 bg-[#07090E] border border-[#1E2533] rounded-xl text-slate-200 focus:outline-none focus:border-primary-orange text-sm font-semibold"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Message Body</label>
                                    <textarea
                                        rows={4}
                                        value={body}
                                        onChange={(e) => setBody(e.target.value)}
                                        placeholder="Type your message here..."
                                        className="w-full px-4 py-3 bg-[#07090E] border border-[#1E2533] rounded-xl text-slate-200 focus:outline-none focus:border-primary-orange text-sm font-semibold resize-none"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center justify-between pt-4">
                                <div className="flex items-center gap-2 text-xs text-slate-500 font-bold bg-[#07090E] px-3 py-2 rounded-lg border border-[#1E2533] min-w-[150px]">
                                    {estimating ? <Loader2 className="animate-spin text-primary-orange" size={14} /> : <Target size={14} className="text-primary-orange" />}
                                    Reach: {typeof estimate === 'number' ? estimate.toLocaleString() : '...'} Users
                                </div>
                                <button
                                    onClick={handleSend}
                                    disabled={sending}
                                    className="flex items-center gap-2 px-8 py-3 bg-primary-orange hover:bg-primary-orange-hover text-white font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-primary-orange/20 disabled:opacity-50"
                                >
                                    {sending ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
                                    Send Notification Now
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Communication History */}
                    <div className="bg-[#0D1017] border border-[#1E2533] rounded-2xl overflow-hidden shadow-2xl">
                        <div className="p-6 border-b border-[#1E2533] flex items-center justify-between">
                            <h3 className="text-base font-bold text-white uppercase tracking-wider flex items-center gap-3">
                                <History className="text-slate-500" size={20} />
                                Recent Broadcasts
                            </h3>
                        </div>
                        <div className="divide-y divide-[#1E2533] min-h-[100px]">
                            {recentBroadcasts.length === 0 ? (
                                <div className="p-10 text-center text-slate-500 text-xs font-bold uppercase tracking-wider italic">No recent broadcasts found.</div>
                            ) : recentBroadcasts.map((b) => (
                                <HistoryItem
                                    key={b._id}
                                    title={b.title}
                                    date={b.createdAt ? new Date(b.createdAt).toLocaleString() : 'Just now'}
                                    reach={(b.stats?.targeted ?? 0).toLocaleString()}
                                    delivered={(b.stats?.delivered ?? 0).toLocaleString()}
                                    status={b.status}
                                />
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right: Automated Triggers & Templates */}
                <div className="space-y-6">
                    <div className="bg-[#0D1017] border border-[#1E2533] rounded-2xl p-6 shadow-2xl">
                        <h3 className="text-base font-bold text-white mb-6 uppercase tracking-wider">Automated Alerts</h3>
                        <div className="space-y-4">
                            <TriggerItem
                                label="New Login Detected"
                                active={settings?.newLoginDetected}
                                onToggle={(v: boolean) => handleToggleSetting('newLoginDetected', v)}
                            />
                            <TriggerItem
                                label="KYC Status Update"
                                active={settings?.kycStatusUpdates}
                                onToggle={(v: boolean) => handleToggleSetting('kycStatusUpdates', v)}
                            />
                            <TriggerItem
                                label="Deposit Successful"
                                active={settings?.depositSuccessful}
                                onToggle={(v: boolean) => handleToggleSetting('depositSuccessful', v)}
                            />
                            <TriggerItem
                                label="Withdrawal Processed"
                                active={settings?.withdrawalProcessed}
                                onToggle={(v: boolean) => handleToggleSetting('withdrawalProcessed', v)}
                            />
                        </div>
                    </div>

                    <div className="bg-primary-orange/5 border border-primary-orange/20 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
                        <h4 className="text-white font-bold text-xs uppercase tracking-wider mb-3 relative z-10">
                            Compliance Notice
                        </h4>
                        <p className="text-xs text-slate-400 leading-relaxed relative z-10 font-medium">
                            All promotional messages are logged for regulatory audit. Avoid sending links to third-party platforms in system notifications.
                        </p>
                        <div className="absolute -bottom-10 -right-10 w-24 h-24 bg-primary-orange/5 blur-2xl rounded-full" />
                    </div>
                </div>
            </div>
        </div>
    );
}

function TargetOption({ icon, label, active, onClick }: any) {
    return (
        <button
            onClick={onClick}
            className={`flex items-center justify-center gap-3 p-3 rounded-xl border transition-all text-xs font-black uppercase tracking-wider cursor-pointer outline-none ${active ? 'bg-primary-orange border-primary-orange text-white shadow-lg shadow-primary-orange/20' : 'bg-[#07090E] border-[#1E2533] text-slate-400 hover:border-[#2C374E]'}`}
        >
            {icon}
            {label}
        </button>
    );
}

function ChannelToggle({ icon, label, active, onClick }: any) {
    return (
        <div className="flex items-center gap-3">
            <button
                onClick={onClick}
                className={`w-8 h-8 rounded-lg flex items-center justify-center border transition-all cursor-pointer outline-none ${active ? 'bg-primary-orange/10 border-primary-orange text-primary-orange' : 'bg-[#07090E] border-[#1E2533] text-slate-600'}`}
            >
                {icon}
            </button>
            <span className={`text-xs font-bold uppercase tracking-wider ${active ? 'text-slate-200 font-black' : 'text-slate-500'}`}>{label}</span>
            <button
                onClick={onClick}
                className={`w-10 h-5 rounded-full relative transition-all shadow-inner cursor-pointer outline-none ${active ? 'bg-primary-orange shadow-primary-orange/10' : 'bg-[#07090E] border border-[#1E2533]'}`}
            >
                <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all shadow-sm ${active ? 'left-5.5' : 'left-0.5'}`} />
            </button>
        </div>
    );
}

function HistoryItem({ title, date, reach, delivered, status }: any) {
    const statusConfig: any = {
        'SENT': { label: 'Sent', color: 'emerald' },
        'QUEUED': { label: 'Queued', color: 'amber' },
        'SENDING': { label: 'Sending', color: 'blue' },
        'FAILED': { label: 'Failed', color: 'rose' },
        'PARTIAL': { label: 'Partial', color: 'orange' },
        'DRAFT': { label: 'Draft', color: 'slate' }
    };

    const config = statusConfig[status] || statusConfig['SENT'];

    // Map tailwind dynamic color variables safely
    const colorClasses: any = {
        emerald: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20 shadow-[0_0_8px_rgba(16,185,129,0.05)]',
        amber: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
        blue: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
        rose: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
        orange: 'text-primary-orange bg-primary-orange/10 border-primary-orange/20',
        slate: 'text-slate-400 bg-slate-500/10 border-slate-500/20'
    };

    const customClass = colorClasses[config.color] || colorClasses.slate;

    return (
        <div className="p-6 group hover:bg-[#07090E]/50 transition-colors">
            <div className="flex justify-between items-start mb-2">
                <h4 className="text-sm font-bold text-white group-hover:text-primary-orange transition-colors leading-snug">{title}</h4>
                <span className={`flex items-center gap-1 text-[9px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full border ${customClass}`}>
                    {config.label === 'Sent' && <CheckCircle2 size={10} />}
                    {config.label}
                </span>
            </div>
            <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider mb-4 font-mono">{date}</p>
            <div className="flex items-center gap-6 font-mono">
                <div>
                    <p className="text-[9px] text-slate-600 font-bold uppercase tracking-tighter font-sans">Targeted</p>
                    <p className="text-xs font-bold text-slate-300">{reach}</p>
                </div>
                <div className="w-px h-6 bg-[#1E2533]" />
                <div>
                    <p className="text-[9px] text-slate-600 font-bold uppercase tracking-tighter font-sans">Delivered</p>
                    <p className="text-xs font-bold text-slate-300">{delivered}</p>
                </div>
            </div>
        </div>
    );
}

function TriggerItem({ label, active, onToggle }: any) {
    return (
        <div className="flex items-center justify-between p-3.5 rounded-xl border border-[#1E2533] bg-[#07090E]/50">
            <span className="text-xs font-bold text-slate-300">{label}</span>
            <button
                onClick={() => onToggle(!active)}
                className={`w-10 h-5 rounded-full relative transition-all shadow-inner cursor-pointer outline-none ${active ? 'bg-emerald-600 shadow-emerald-500/20' : 'bg-slate-800'}`}
            >
                <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all shadow-sm ${active ? 'left-5.5' : 'left-0.5'}`} />
            </button>
        </div>
    );
}
