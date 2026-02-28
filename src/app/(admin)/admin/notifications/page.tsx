import React from 'react';
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
    Megaphone
} from 'lucide-react';

export default function NotificationsPage() {
    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h2 className="text-3xl font-bold text-white tracking-tight">Communications</h2>
                    <p className="text-slate-400 mt-1">Manage announcements, push notifications, and automated alerts.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl transition-all shadow-lg shadow-indigo-600/20">
                        <Plus size={18} />
                        New Campaign
                    </button>
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
                                    <TargetOption icon={<Users size={16} />} label="All Users" active={true} />
                                    <TargetOption icon={<Target size={16} />} label="Verified Only" />
                                    <TargetOption icon={<AlertCircle size={16} />} label="Unverified Only" />
                                </div>
                            </div>

                            {/* Channels */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1">Delivery Channels</label>
                                <div className="flex flex-wrap gap-4">
                                    <ChannelToggle icon={<Smartphone size={16} />} label="Push Notification" active={true} />
                                    <ChannelToggle icon={<Mail size={16} />} label="Email" />
                                    <ChannelToggle icon={<Bell size={16} />} label="In-App Banner" />
                                </div>
                            </div>

                            {/* Message Content */}
                            <div className="space-y-4 pt-4 border-t border-slate-800">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1">Notification Title</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Scheduled Maintenance"
                                        className="w-full px-4 py-3 bg-slate-950/50 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-indigo-500/50"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1">Message Body</label>
                                    <textarea
                                        rows={4}
                                        placeholder="Type your message here..."
                                        className="w-full px-4 py-3 bg-slate-950/50 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-indigo-500/50 resize-none"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center justify-between pt-4">
                                <div className="flex items-center gap-2 text-xs text-slate-500 font-medium bg-slate-800/50 px-3 py-1.5 rounded-lg border border-slate-700">
                                    <Target size={14} className="text-indigo-400" />
                                    Est. Reach: 1,284 Users
                                </div>
                                <button className="flex items-center gap-2 px-8 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-indigo-600/30">
                                    <Send size={18} />
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
                                Sent Messages
                            </h3>
                            <button className="text-xs font-bold text-indigo-400 hover:text-indigo-300 transition-colors uppercase tracking-widest">
                                View Complete History
                            </button>
                        </div>
                        <div className="divide-y divide-slate-800">
                            <HistoryItem
                                title="System Maintenance Complete"
                                date="March 1, 2024 at 2:30 PM"
                                reach="1,284"
                                clicks="842"
                                status="delivered"
                            />
                            <HistoryItem
                                title="Update Your App for Better Security"
                                date="Feb 28, 2024 at 10:15 AM"
                                reach="956"
                                clicks="124"
                                status="delivered"
                            />
                            <HistoryItem
                                title="Welcome to SwiftPay v2.0"
                                date="Feb 25, 2024 at 9:00 AM"
                                reach="840"
                                clicks="620"
                                status="delivered"
                            />
                        </div>
                    </div>
                </div>

                {/* Right: Automated Triggers & Templates */}
                <div className="space-y-6">
                    <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-6 backdrop-blur-sm">
                        <h3 className="text-lg font-bold text-white mb-6">Triggered Alerts</h3>
                        <div className="space-y-4">
                            <TriggerItem label="New Login Detected" active={true} />
                            <TriggerItem label="KYC Status Update" active={true} />
                            <TriggerItem label="Deposit Successful" active={true} />
                            <TriggerItem label="Withdrawal Processed" active={true} />
                            <TriggerItem label="Large Transfer (>100k)" active={false} />
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-indigo-900/20 to-blue-900/20 border border-indigo-500/20 rounded-3xl p-6 backdrop-blur-sm">
                        <h4 className="text-white font-bold mb-3 flex items-center gap-2">
                            <ShieldAlert size={18} className="text-amber-400" />
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

function TargetOption({ icon, label, active }: any) {
    return (
        <button className={`flex items-center gap-3 p-3 rounded-xl border transition-all text-xs font-bold ${active ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-600/20' : 'bg-slate-950/30 border-slate-800 text-slate-400 hover:border-slate-700'}`}>
            {icon}
            {label}
        </button>
    );
}

function ChannelToggle({ icon, label, active }: any) {
    return (
        <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center border transition-all ${active ? 'bg-indigo-500/10 border-indigo-500 text-indigo-400' : 'bg-slate-900 border-slate-800 text-slate-600'}`}>
                {icon}
            </div>
            <span className={`text-xs font-bold ${active ? 'text-slate-200' : 'text-slate-500'}`}>{label}</span>
            <button className={`w-8 h-4 rounded-full relative transition-all ${active ? 'bg-indigo-600' : 'bg-slate-800'}`}>
                <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all ${active ? 'left-4.5' : 'left-0.5'}`} />
            </button>
        </div>
    );
}

function HistoryItem({ title, date, reach, clicks, status }: any) {
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
                <div className="w-px h-6 bg-slate-800" />
                <div>
                    <p className="text-[9px] text-slate-600 font-bold uppercase tracking-tighter">Engagement</p>
                    <p className="text-sm font-bold text-emerald-400">{Math.round((parseInt(clicks) / parseInt(reach)) * 100)}%</p>
                </div>
            </div>
        </div>
    );
}

function TriggerItem({ label, active }: any) {
    return (
        <div className="flex items-center justify-between p-3 rounded-xl border border-slate-800 bg-slate-950/20">
            <span className="text-xs font-bold text-slate-300">{label}</span>
            <div className={`w-8 h-4 rounded-full relative transition-all cursor-pointer ${active ? 'bg-emerald-600' : 'bg-slate-800'}`}>
                <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all ${active ? 'left-4.5' : 'left-0.5'}`} />
            </div>
        </div>
    );
}

function Plus({ size, className }: any) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            <path d="M5 12h14" />
            <path d="M12 5v14" />
        </svg>
    );
}

function ShieldAlert({ size, className }: any) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
            <path d="M12 8v4" />
            <path d="M12 16h.01" />
        </svg>
    );
}
