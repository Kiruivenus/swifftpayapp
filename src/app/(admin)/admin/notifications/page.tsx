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
            setSettings(res.settings);
            setRecentBroadcasts(res.recentBroadcasts);
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
            setSettings(newSettings); // Optimistic UI
            await adminService.updateNotificationSettings(newSettings);
        } catch (err: any) {
            alert(err.message);
            fetchData(); // Revert on error
        }
    };

    if (loading && !settings) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="animate-spin text-indigo-500" size={40} />
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
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
                    <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-8 backdrop-blur-sm">
                        <h3 className="text-lg font-bold text-white flex items-center gap-3 mb-8">
                            <Megaphone className="text-indigo-400" size={24} />
                            Broadcast Composer
                        </h3>

                        <div className="space-y-6">
                            {/* Target Group */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1">Target Audience</label>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                    <TargetOption icon={<Users size={16} />} label="All Users" active={scope === 'ALL_USERS'} onClick={() => setScope('ALL_USERS')} />
                                    <TargetOption icon={<Target size={16} />} label="Verified Only" active={scope === 'VERIFIED_ONLY'} onClick={() => setScope('VERIFIED_ONLY')} />
                                    <TargetOption icon={<AlertCircle size={16} />} label="Unverified Only" active={scope === 'UNVERIFIED_ONLY'} onClick={() => setScope('UNVERIFIED_ONLY')} />
                                </div>
                            </div>

                            {/* Channels */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1">Delivery Channels</label>
                                <div className="flex flex-wrap gap-6">
                                    <ChannelToggle icon={<Smartphone size={16} />} label="Push" active={channels.push} onClick={() => setChannels({ ...channels, push: !channels.push })} />
                                    <ChannelToggle icon={<Mail size={16} />} label="Email" active={channels.email} onClick={() => setChannels({ ...channels, email: !channels.email })} />
                                    <ChannelToggle icon={<Bell size={16} />} label="In-App" active={channels.inApp} onClick={() => setChannels({ ...channels, inApp: !channels.inApp })} />
                                </div>
                            </div>

                            {/* Message Content */}
                            <div className="space-y-4 pt-4 border-t border-slate-800">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1">Notification Title</label>
                                    <input
                                        type="text"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        placeholder="e.g. Scheduled Maintenance"
                                        className="w-full px-4 py-3 bg-slate-950/50 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-indigo-500/50"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1">Message Body</label>
                                    <textarea
                                        rows={4}
                                        value={body}
                                        onChange={(e) => setBody(e.target.value)}
                                        placeholder="Type your message here..."
                                        className="w-full px-4 py-3 bg-slate-950/50 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-indigo-500/50 resize-none"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center justify-between pt-4">
                                <div className="flex items-center gap-2 text-xs text-slate-500 font-medium bg-slate-800/50 px-3 py-1.5 rounded-lg border border-slate-700 min-w-[150px]">
                                    {estimating ? <Loader2 className="animate-spin text-indigo-400" size={14} /> : <Target size={14} className="text-indigo-400" />}
                                    Est. Reach: {estimate !== null ? estimate.toLocaleString() : '...'} Users
                                </div>
                                <button
                                    onClick={handleSend}
                                    disabled={sending}
                                    className="flex items-center gap-2 px-8 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-indigo-600/30 disabled:opacity-50"
                                >
                                    {sending ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
                                    Send Notification Now
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Communication History */}
                    <div className="bg-slate-900/50 border border-slate-800 rounded-3xl overflow-hidden backdrop-blur-sm">
                        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
                            <h3 className="text-lg font-bold text-white flex items-center gap-3">
                                <History className="text-slate-400" size={20} />
                                Recent Broadcasts
                            </h3>
                        </div>
                        <div className="divide-y divide-slate-800 min-h-[100px]">
                            {recentBroadcasts.length === 0 ? (
                                <div className="p-10 text-center text-slate-500 text-xs">No recent broadcasts found.</div>
                            ) : recentBroadcasts.map((b) => (
                                <HistoryItem
                                    key={b._id}
                                    title={b.title}
                                    date={new Date(b.createdAt).toLocaleString()}
                                    reach={b.stats.targeted.toLocaleString()}
                                    delivered={b.stats.delivered.toLocaleString()}
                                    status={b.status}
                                />
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right: Automated Triggers & Templates */}
                <div className="space-y-6">
                    <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-6 backdrop-blur-sm">
                        <h3 className="text-lg font-bold text-white mb-6">Automated Alerts</h3>
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

                    <div className="bg-gradient-to-br from-indigo-900/20 to-blue-900/20 border border-indigo-500/20 rounded-3xl p-6 backdrop-blur-sm relative overflow-hidden">
                        <h4 className="text-white font-bold mb-3 flex items-center gap-2 relative z-10">
                            Compliance Notice
                        </h4>
                        <p className="text-xs text-slate-400 leading-relaxed relative z-10">
                            All promotional messages are logged for regulatory audit. Avoid sending links to third-party platforms in system notifications.
                        </p>
                        <div className="absolute -bottom-10 -right-10 w-24 h-24 bg-indigo-500/10 blur-2xl rounded-full" />
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
            className={`flex items-center gap-3 p-3 rounded-xl border transition-all text-xs font-bold ${active ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-600/20' : 'bg-slate-950/30 border-slate-800 text-slate-400 hover:border-slate-700'}`}
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
                className={`w-8 h-8 rounded-lg flex items-center justify-center border transition-all ${active ? 'bg-indigo-500/10 border-indigo-500 text-indigo-400' : 'bg-slate-900 border-slate-800 text-slate-600'}`}
            >
                {icon}
            </button>
            <span className={`text-xs font-bold ${active ? 'text-slate-200' : 'text-slate-500'}`}>{label}</span>
            <button
                onClick={onClick}
                className={`w-10 h-5 rounded-full relative transition-all shadow-inner ${active ? 'bg-indigo-600' : 'bg-slate-800'}`}
            >
                <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all shadow-sm ${active ? 'left-6' : 'left-1'}`} />
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

    return (
        <div className="p-6 group hover:bg-slate-800/10 transition-colors">
            <div className="flex justify-between items-start mb-2">
                <h4 className="text-sm font-bold text-white group-hover:text-indigo-400 transition-colors">{title}</h4>
                <span className={`flex items-center gap-1.5 text-[9px] font-black text-${config.color}-400 uppercase tracking-widest px-2 py-0.5 bg-${config.color}-500/10 border border-${config.color}-500/20 rounded-full`}>
                    {config.label === 'Sent' && <CheckCircle2 size={10} />}
                    {config.label}
                </span>
            </div>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-4">{date}</p>
            <div className="flex items-center gap-6">
                <div>
                    <p className="text-[9px] text-slate-600 font-bold uppercase tracking-tighter">Targeted</p>
                    <p className="text-sm font-bold text-slate-300">{reach}</p>
                </div>
                <div className="w-px h-6 bg-slate-800" />
                <div>
                    <p className="text-[9px] text-slate-600 font-bold uppercase tracking-tighter">Delivered</p>
                    <p className="text-sm font-bold text-slate-300">{delivered}</p>
                </div>
            </div>
        </div>
    );
}

function TriggerItem({ label, active, onToggle }: any) {
    return (
        <div className="flex items-center justify-between p-3 rounded-xl border border-slate-800 bg-slate-950/20">
            <span className="text-xs font-bold text-slate-300">{label}</span>
            <button
                onClick={() => onToggle(!active)}
                className={`w-10 h-5 rounded-full relative transition-all shadow-inner ${active ? 'bg-emerald-600' : 'bg-slate-800'}`}
            >
                <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all shadow-sm ${active ? 'left-6' : 'left-1'}`} />
            </button>
        </div>
    );
}
