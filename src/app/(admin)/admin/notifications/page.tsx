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
    const [type, setType] = useState('push');
    const [target, setTarget] = useState('all');
    const [sending, setSending] = useState(false);

    const handleSend = async () => {
        if (!title || !body) return alert("Please fill in both title and message");
        if (!confirm(`Broadcast this message to ${target} users via ${type}?`)) return;

        try {
            setSending(true);
            await adminService.broadcastNotification({
                title,
                body,
                type: type.toUpperCase()
            });
            alert("Broadcast sent successfully!");
            setTitle('');
            setBody('');
        } catch (err: any) {
            alert(err.message);
        } finally {
            setSending(false);
        }
    };

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
                                    <TargetOption icon={<Users size={16} />} label="All Users" active={target === 'all'} onClick={() => setTarget('all')} />
                                    <TargetOption icon={<Target size={16} />} label="Verified Only" active={target === 'verified'} onClick={() => setTarget('verified')} />
                                    <TargetOption icon={<AlertCircle size={16} />} label="Unverified Only" active={target === 'unverified'} onClick={() => setTarget('unverified')} />
                                </div>
                            </div>

                            {/* Channels */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1">Delivery Channels</label>
                                <div className="flex flex-wrap gap-4">
                                    <ChannelToggle icon={<Smartphone size={16} />} label="Push Notification" active={type === 'push'} onClick={() => setType('push')} />
                                    <ChannelToggle icon={<Mail size={16} />} label="Email" active={type === 'email'} onClick={() => setType('email')} />
                                    <ChannelToggle icon={<Bell size={16} />} label="In-App Banner" active={type === 'in-app'} onClick={() => setType('in-app')} />
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
                                <div className="flex items-center gap-2 text-xs text-slate-500 font-medium bg-slate-800/50 px-3 py-1.5 rounded-lg border border-slate-700">
                                    <Target size={14} className="text-indigo-400" />
                                    Est. Reach: {target === 'all' ? '1,280' : target === 'verified' ? '840' : '440'} Users
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
                        <div className="divide-y divide-slate-800">
                            <HistoryItem
                                title="Platform Update v2.1"
                                date="Today at 10:00 AM"
                                reach="1,280"
                                clicks="940"
                                status="delivered"
                            />
                            <HistoryItem
                                title="New Verification Requirements"
                                date="Yesterday at 3:45 PM"
                                reach="1,240"
                                clicks="420"
                                status="delivered"
                            />
                        </div>
                    </div>
                </div>

                {/* Right: Automated Triggers & Templates */}
                <div className="space-y-6">
                    <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-6 backdrop-blur-sm">
                        <h3 className="text-lg font-bold text-white mb-6">Automated Alerts</h3>
                        <div className="space-y-4">
                            <TriggerItem label="New Login Detected" active={true} />
                            <TriggerItem label="KYC Status Update" active={true} />
                            <TriggerItem label="Deposit Successful" active={true} />
                            <TriggerItem label="Withdrawal Processed" active={true} />
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-indigo-900/20 to-blue-900/20 border border-indigo-500/20 rounded-3xl p-6 backdrop-blur-sm">
                        <h4 className="text-white font-bold mb-3 flex items-center gap-2">
                            Compliance Notice
                        </h4>
                        <p className="text-xs text-slate-400 leading-relaxed">
                            All promotional messages are logged for regulatory audit. Avoid sending links to third-party platforms in system notifications.
                        </p>
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

function HistoryItem({ title, date, reach, clicks }: any) {
    return (
        <div className="p-6 group hover:bg-slate-800/10 transition-colors">
            <div className="flex justify-between items-start mb-2">
                <h4 className="text-sm font-bold text-white group-hover:text-indigo-400 transition-colors">{title}</h4>
                <span className="flex items-center gap-1.5 text-[9px] font-black text-emerald-400 uppercase tracking-widest px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
                    <CheckCircle2 size={10} /> Delivered
                </span>
            </div>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-4">{date}</p>
            <div className="flex items-center gap-6">
                <div>
                    <p className="text-[9px] text-slate-600 font-bold uppercase tracking-tighter">Reach</p>
                    <p className="text-sm font-bold text-slate-300">{reach}</p>
                </div>
                <div className="w-px h-6 bg-slate-800" />
                <div>
                    <p className="text-[9px] text-slate-600 font-bold uppercase tracking-tighter">Clicks</p>
                    <p className="text-sm font-bold text-slate-300">{clicks}</p>
                </div>
            </div>
        </div>
    );
}

function TriggerItem({ label, active }: any) {
    return (
        <div className="flex items-center justify-between p-3 rounded-xl border border-slate-800 bg-slate-950/20">
            <span className="text-xs font-bold text-slate-300">{label}</span>
            <div className={`w-10 h-5 rounded-full relative transition-all cursor-pointer shadow-inner ${active ? 'bg-emerald-600' : 'bg-slate-800'}`}>
                <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all shadow-sm ${active ? 'left-6' : 'left-1'}`} />
            </div>
        </div>
    );
}
