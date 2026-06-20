"use client";

import React, { useState, useEffect, useCallback } from 'react';
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
    Loader2,
    Trash2,
    Copy,
    RefreshCw,
    Calendar,
    Eye,
    TrendingUp,
    Shield,
    Clock,
    Lock,
    Coins,
    UserCheck,
    AlertTriangle,
    Info,
    ChevronDown,
    Activity,
    Terminal,
    Sparkles,
    Play,
    Compass,
    ShieldAlert,
    Award,
    ArrowUpRight,
    ArrowDownLeft,
    CheckSquare,
    EyeOff
} from 'lucide-react';
import { adminService } from '@/services/admin.service';

const AUDIENCE_SEGMENTS = [
    { value: 'ALL_USERS', label: 'All Users', desc: 'Every registered non-deleted client' },
    { value: 'VERIFIED_ONLY', label: 'Verified Only', desc: 'Users with approved KYC verification' },
    { value: 'UNVERIFIED_ONLY', label: 'Unverified Only', desc: 'Users with incomplete/no KYC checks' },
    { value: 'ACTIVE_USERS', label: 'Active Users (7d)', desc: 'Users with active sessions in last 7 days' },
    { value: 'INACTIVE_USERS', label: 'Inactive Users (30d)', desc: 'Users with no logins for 30+ days' },
    { value: 'NEW_USERS', label: 'New Users (48h)', desc: 'Clients registered in the last 48 hours' },
    { value: 'PREMIUM_USERS', label: 'Premium Balance', desc: 'Holdings above $1,000 equivalent' },
    { value: 'WITH_DEPOSITS', label: 'Active Depositors', desc: 'Completed at least 1 successful deposit' },
    { value: 'WITHOUT_DEPOSITS', label: 'Zero Deposits', desc: 'Registered users with no deposit history' },
    { value: 'HIGH_VALUE_USERS', label: 'High-Value Accounts', desc: 'Volume transacted > $500 or large balance' },
    { value: 'KYC_PENDING', label: 'Pending KYC Review', desc: 'KYC applications awaiting validation' },
    { value: 'KYC_REJECTED', label: 'Rejected KYC', desc: 'KYC verification attempts rejected' },
    { value: 'REFERRAL_USERS', label: 'Referral Signups', desc: 'Users participating in referral incentives' },
    { value: 'SUSPENDED_USERS', label: 'Suspended Users', desc: 'Blocked accounts restricted from transacting' }
];

export default function NotificationsPage() {
    // Campaign composer state
    const [title, setTitle] = useState('');
    const [body, setBody] = useState('');
    const [scope, setScope] = useState('ALL_USERS');
    const [channels, setChannels] = useState({ push: true, email: false, inApp: true });
    const [deliveryMode, setDeliveryMode] = useState<'now' | 'draft' | 'schedule'>('now');
    const [scheduledDate, setScheduledDate] = useState('');
    const [isRichFormatting, setIsRichFormatting] = useState(false);

    // Global dashboard states
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [recentBroadcasts, setRecentBroadcasts] = useState<any[]>([]);
    const [settings, setSettings] = useState<any>(null);
    const [analytics, setAnalytics] = useState<any>({
        sent: 0,
        delivered: 0,
        failed: 0,
        opened: 0,
        clicked: 0,
        deliveryRate: 98.4,
        ctr: 15.2,
        trends: { sent: '+0%', delivered: '+0%', opened: '+0%', clicked: '+0%' }
    });
    
    // Estimate state
    const [estimate, setEstimate] = useState<number | null>(null);
    const [estimating, setEstimating] = useState(false);

    // Filter dynamic states
    const [selectedSegmentFilter, setSelectedSegmentFilter] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');

    // Previews modal
    const [showPreviewModal, setShowPreviewModal] = useState(false);

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const res = await adminService.getCommunicationsOverview();
            setSettings(res.settings || null);
            setRecentBroadcasts(res.recentBroadcasts || []);
            if (res.analytics) {
                setAnalytics(res.analytics);
            }
        } catch (err: any) {
            console.error('Failed to load notification overview:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchEstimate = useCallback(async () => {
        try {
            setEstimating(true);
            const res = await adminService.getAudienceEstimate({ scope });
            setEstimate(res.targeted);
        } catch (err: any) {
            console.error('Error fetching estimate:', err);
        } finally {
            setEstimating(false);
        }
    }, [scope]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    useEffect(() => {
        const timer = setTimeout(() => fetchEstimate(), 300);
        return () => clearTimeout(timer);
    }, [fetchEstimate]);

    // Handle Send/Draft/Schedule submission
    const handleSend = async () => {
        if (!title.trim() || !body.trim()) {
            return alert("Please enter both a notification title and body message.");
        }

        if (deliveryMode === 'schedule' && !scheduledDate) {
            return alert("Please select a scheduled delivery date and time.");
        }

        const confirmMsg = deliveryMode === 'schedule'
            ? `Schedule this campaign for ${new Date(scheduledDate).toLocaleString()} targeting ${estimate || 0} users?`
            : deliveryMode === 'draft'
                ? `Save this campaign as a draft?`
                : `Broadcast this notification to ${estimate || 0} users immediately?`;

        if (!confirm(confirmMsg)) return;

        try {
            setSubmitting(true);
            const payload = {
                title,
                message: body,
                targetAudience: { scope },
                channels,
                sendNow: deliveryMode === 'now',
                ...(deliveryMode === 'schedule' ? { scheduledAt: new Date(scheduledDate) } : {})
            };

            await adminService.createBroadcast(payload);
            
            alert(deliveryMode === 'draft' ? "Campaign saved as draft!" : deliveryMode === 'schedule' ? "Campaign scheduled successfully!" : "Broadcast dispatched successfully!");
            
            // Clear fields
            setTitle('');
            setBody('');
            setDeliveryMode('now');
            setScheduledDate('');
            fetchData();
        } catch (err: any) {
            alert(err.message || "Failed to submit broadcast campaign.");
        } finally {
            setSubmitting(false);
        }
    };

    // Toggle admin alerts settings instantly
    const handleToggleSetting = async (key: string, value: boolean) => {
        try {
            const updated = { ...settings, [key]: value };
            setSettings(updated);
            
            const res = await fetch('/api/admin/communications/settings', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updated)
            });
            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.message || 'Settings sync failed');
            }
        } catch (err: any) {
            alert(`Error saving setting: ${err.message}`);
            fetchData(); // reload settings
        }
    };

    // UI actions on recent broadcasts
    const handleAction = async (action: 'resend' | 'delete' | 'duplicate', id: string, broadcastData?: any) => {
        if (action === 'delete') {
            if (!confirm("Are you sure you want to permanently delete this broadcast campaign?")) return;
            try {
                const res = await fetch(`/api/admin/communications/broadcasts/${id}`, { method: 'DELETE' });
                if (!res.ok) throw new Error("Delete failed");
                alert("Campaign removed.");
                fetchData();
            } catch (err: any) {
                alert(`Error deleting campaign: ${err.message}`);
            }
        } else if (action === 'duplicate' || action === 'resend') {
            setTitle(broadcastData.title || '');
            setBody(broadcastData.message || '');
            setScope(broadcastData.targetAudience?.scope || 'ALL_USERS');
            setChannels(broadcastData.channels || { push: true, email: false, inApp: true });
            setDeliveryMode('now');
            window.scrollTo({ top: 300, behavior: 'smooth' });
        }
    };

    // Helper text toolbar insertions
    const insertFormatting = (tag: string) => {
        const text = body;
        if (tag === 'bold') setBody(text + ' **bold text**');
        if (tag === 'italic') setBody(text + ' *italic text*');
        if (tag === 'code') setBody(text + ' `code snippet`');
        if (tag === 'link') setBody(text + ' [Link Title](https://swiftpay.ke)');
        if (tag === 'emoji') setBody(text + ' 😊');
    };

    if (loading && !settings) {
        return (
            <div className="flex items-center justify-center min-h-[500px]">
                <Loader2 className="animate-spin text-primary-orange" size={40} />
            </div>
        );
    }

    // Filter logs lists client-side
    const filteredBroadcasts = recentBroadcasts.filter(b => {
        const matchesQuery = b.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                             b.message?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesSegment = selectedSegmentFilter === 'all' || b.targetAudience?.scope === selectedSegmentFilter;
        return matchesQuery && matchesSegment;
    });

    return (
        <div className="space-y-8 animate-in fade-in duration-700 font-sans text-slate-300">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#1E2533] pb-6">
                <div>
                    <h2 className="text-3xl font-extrabold text-white tracking-tight">Communications Center</h2>
                    <p className="text-slate-400 mt-1">Multi-channel campaign broadcasting, user targeting, and automated alerts dashboard.</p>
                </div>
                <button
                    onClick={() => { fetchData(); fetchEstimate(); }}
                    className="flex items-center gap-2 px-4 py-2.5 bg-[#0D1017] hover:bg-[#0D1017]/80 text-slate-400 hover:text-white border border-[#1E2533] rounded-xl transition-all text-xs font-bold uppercase tracking-wider"
                >
                    <RefreshCw size={14} /> Refresh Data
                </button>
            </div>

            {/* Campaign Analytics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <AnalyticsCard title="Total Dispatched" value={analytics.sent} trend={analytics.trends?.sent} type="sent" />
                <AnalyticsCard title="Delivery Rate" value={`${analytics.deliveryRate}%`} trend={analytics.trends?.delivered} type="delivered" />
                <AnalyticsCard title="Open Rate (Email)" value={`${analytics.opened > 0 ? ((analytics.opened / analytics.delivered) * 100).toFixed(1) : '62.0'}%`} trend={analytics.trends?.opened} type="opened" />
                <AnalyticsCard title="Average CTR" value={`${analytics.ctr}%`} trend={analytics.trends?.clicked} type="clicked" />
            </div>

            {/* Main two-column dashboard */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Left: Campaign Composer & Visual Analytics */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-[#0D1017] border border-[#1E2533] rounded-2xl p-6 md:p-8 shadow-2xl relative">
                        <div className="flex items-center justify-between border-b border-[#1E2533] pb-4 mb-6">
                            <h3 className="text-base font-bold text-white uppercase tracking-wider flex items-center gap-3">
                                <Megaphone className="text-primary-orange animate-pulse" size={20} />
                                Campaign Composer
                            </h3>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setShowPreviewModal(true)}
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-[#07090E] border border-[#1E2533] text-slate-400 hover:text-white rounded-lg text-xs font-bold transition-all"
                                >
                                    <Eye size={12} /> Preview Template
                                </button>
                            </div>
                        </div>

                        <div className="space-y-6">
                            {/* Target Audience Dropdown */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-0.5">Target Audience Segment</label>
                                <div className="relative">
                                    <select
                                        value={scope}
                                        onChange={(e) => setScope(e.target.value)}
                                        className="w-full appearance-none px-4 py-3 bg-[#07090E] border border-[#1E2533] rounded-xl text-white font-bold text-sm focus:outline-none focus:border-primary-orange cursor-pointer pr-10"
                                    >
                                        {AUDIENCE_SEGMENTS.map(seg => (
                                            <option key={seg.value} value={seg.value}>
                                                {seg.label} — {seg.desc}
                                            </option>
                                        ))}
                                    </select>
                                    <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                                </div>
                            </div>

                            {/* Dynamic delivery channels */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-0.5">Delivery Channels</label>
                                <div className="flex flex-wrap gap-6 bg-[#07090E] p-4 border border-[#1E2533] rounded-xl">
                                    <ChannelToggle icon={<Smartphone size={16} />} label="Push Notifications" active={channels.push} onClick={() => setChannels({ ...channels, push: !channels.push })} />
                                    <div className="w-px h-8 bg-[#1E2533] hidden sm:block" />
                                    <ChannelToggle icon={<Mail size={16} />} label="Email Templates" active={channels.email} onClick={() => setChannels({ ...channels, email: !channels.email })} />
                                    <div className="w-px h-8 bg-[#1E2533] hidden sm:block" />
                                    <ChannelToggle icon={<Bell size={16} />} label="In-App Feed" active={channels.inApp} onClick={() => setChannels({ ...channels, inApp: !channels.inApp })} />
                                </div>
                            </div>

                            {/* Message inputs */}
                            <div className="space-y-4 pt-4 border-t border-[#1E2533]">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-0.5">Notification Title</label>
                                    <input
                                        type="text"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        placeholder="e.g. System Security Update"
                                        className="w-full px-4 py-3 bg-[#07090E] border border-[#1E2533] rounded-xl text-white placeholder:text-slate-600 focus:outline-none focus:border-primary-orange text-sm font-semibold"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <div className="flex justify-between items-center px-0.5">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Message Body</label>
                                        <div className="flex items-center gap-1 bg-[#07090E] border border-[#1E2533] rounded-lg p-0.5">
                                            <FormatBtn label="B" onClick={() => insertFormatting('bold')} />
                                            <FormatBtn label="I" onClick={() => insertFormatting('italic')} />
                                            <FormatBtn label="&lt;/&gt;" onClick={() => insertFormatting('code')} />
                                            <FormatBtn label="Link" onClick={() => insertFormatting('link')} />
                                            <FormatBtn label="😊" onClick={() => insertFormatting('emoji')} />
                                        </div>
                                    </div>
                                    <textarea
                                        rows={5}
                                        value={body}
                                        onChange={(e) => setBody(e.target.value)}
                                        placeholder="Enter markdown or plain text campaign messages..."
                                        className="w-full px-4 py-3 bg-[#07090E] border border-[#1E2533] rounded-xl text-white placeholder:text-slate-600 focus:outline-none focus:border-primary-orange text-sm font-medium resize-none font-sans"
                                    />
                                </div>
                            </div>

                            {/* Delivery Options & Dispatch settings */}
                            <div className="space-y-4 pt-4 border-t border-[#1E2533]">
                                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                                    <div className="flex items-center gap-2 bg-[#07090E] border border-[#1E2533] rounded-xl p-1">
                                        <ModeTab active={deliveryMode === 'now'} label="Send Now" onClick={() => setDeliveryMode('now')} />
                                        <ModeTab active={deliveryMode === 'draft'} label="Save Draft" onClick={() => setDeliveryMode('draft')} />
                                        <ModeTab active={deliveryMode === 'schedule'} label="Schedule" onClick={() => setDeliveryMode('schedule')} />
                                    </div>

                                    {deliveryMode === 'schedule' && (
                                        <div className="flex items-center gap-2 bg-[#07090E] border border-[#1E2533] px-3 py-1.5 rounded-xl text-xs font-bold w-full sm:w-auto">
                                            <Calendar size={14} className="text-primary-orange" />
                                            <input
                                                type="datetime-local"
                                                value={scheduledDate}
                                                onChange={(e) => setScheduledDate(e.target.value)}
                                                className="bg-transparent text-white focus:outline-none cursor-pointer w-full text-xs font-mono"
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Submit controls */}
                            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-[#1E2533]">
                                <div className="flex items-center gap-2 text-xs text-slate-500 font-bold bg-[#07090E] px-4 py-2.5 rounded-xl border border-[#1E2533] w-full sm:w-auto justify-center sm:justify-start">
                                    {estimating ? <Loader2 className="animate-spin text-primary-orange" size={14} /> : <Users size={14} className="text-primary-orange" />}
                                    Target Audience: <span className="text-white font-mono">{typeof estimate === 'number' ? estimate.toLocaleString() : 'Calculating...'}</span> Users
                                </div>
                                <button
                                    onClick={handleSend}
                                    disabled={submitting}
                                    className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3 bg-primary-orange hover:bg-primary-orange-hover text-white font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-primary-orange/20 disabled:opacity-50"
                                >
                                    {submitting ? (
                                        <>
                                            <Loader2 className="animate-spin" size={18} />
                                            <span>Processing...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Send size={18} />
                                            <span>
                                                {deliveryMode === 'draft' ? 'Save Campaign' : deliveryMode === 'schedule' ? 'Schedule Broadcast' : 'Send Broadcast Now'}
                                            </span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Chart Visualization Center */}
                    <div className="bg-[#0D1017] border border-[#1E2533] rounded-2xl p-6 shadow-2xl">
                        <div className="flex items-center justify-between border-b border-[#1E2533] pb-4 mb-6">
                            <h3 className="text-base font-bold text-white uppercase tracking-wider flex items-center gap-3">
                                <TrendingUp className="text-primary-orange" size={20} />
                                Delivery Analytics Graph
                            </h3>
                            <div className="flex items-center gap-1 bg-[#07090E] border border-[#1E2533] rounded-lg p-0.5 text-[10px] font-black uppercase tracking-wider">
                                <span className="px-2.5 py-1 bg-primary-orange text-white rounded">Weekly</span>
                                <span className="px-2.5 py-1 text-slate-400 cursor-pointer">Monthly</span>
                            </div>
                        </div>

                        {/* Custom Visual SVG chart */}
                        <div className="relative w-full h-[180px] bg-[#07090E]/40 border border-[#1E2533] rounded-xl p-4 flex flex-col justify-between">
                            <div className="absolute top-4 left-4 flex gap-4 text-xs font-mono">
                                <div className="flex items-center gap-1.5">
                                    <span className="w-2.5 h-2.5 rounded bg-primary-orange inline-block" />
                                    <span className="text-slate-400">Delivered</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <span className="w-2.5 h-2.5 rounded bg-rose-500 inline-block" />
                                    <span className="text-slate-400">Failed</span>
                                </div>
                            </div>
                            
                            {/* Graph drawing */}
                            <svg className="w-full h-[120px] mt-8" viewBox="0 0 600 100" preserveAspectRatio="none">
                                <defs>
                                    <linearGradient id="deliveredGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#FF7A00" stopOpacity="0.4" />
                                        <stop offset="100%" stopColor="#FF7A00" stopOpacity="0" />
                                    </linearGradient>
                                    <linearGradient id="failedGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#EF4444" stopOpacity="0.1" />
                                        <stop offset="100%" stopColor="#EF4444" stopOpacity="0" />
                                    </linearGradient>
                                </defs>
                                {/* Grid lines */}
                                <line x1="0" y1="0" x2="600" y2="0" stroke="#1E2533" strokeDasharray="4 4" />
                                <line x1="0" y1="50" x2="600" y2="50" stroke="#1E2533" strokeDasharray="4 4" />
                                <line x1="0" y1="100" x2="600" y2="100" stroke="#1E2533" />
                                
                                {/* Area and Lines paths */}
                                <path d="M 0 80 Q 100 20 200 45 T 400 15 T 600 25 L 600 100 L 0 100 Z" fill="url(#deliveredGrad)" />
                                <path d="M 0 80 Q 100 20 200 45 T 400 15 T 600 25" fill="none" stroke="#FF7A00" strokeWidth="2.5" />
                                
                                <path d="M 0 95 Q 100 85 200 90 T 400 93 T 600 98 L 600 100 L 0 100 Z" fill="url(#failedGrad)" />
                                <path d="M 0 95 Q 100 85 200 90 T 400 93 T 600 98" fill="none" stroke="#EF4444" strokeWidth="1.5" />
                            </svg>

                            <div className="flex justify-between items-center text-[10px] text-slate-500 font-bold uppercase tracking-wider font-mono">
                                <span>Mon</span>
                                <span>Tue</span>
                                <span>Wed</span>
                                <span>Thu</span>
                                <span>Fri</span>
                                <span>Sat</span>
                                <span>Sun</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right: Functional Settings Switched Dashboard */}
                <div className="space-y-6">
                    <div className="bg-[#0D1017] border border-[#1E2533] rounded-2xl p-6 shadow-2xl">
                        <div className="border-b border-[#1E2533] pb-4 mb-6">
                            <h3 className="text-base font-bold text-white uppercase tracking-wider flex items-center gap-2">
                                <Shield className="text-primary-orange" size={18} />
                                Automated Alerts
                            </h3>
                            <p className="text-slate-500 text-[10px] mt-1 uppercase tracking-widest font-black">Syncs instantly with API</p>
                        </div>
                        
                        <div className="space-y-4 max-h-[500px] overflow-y-auto custom-scrollbar pr-2">
                            <TriggerToggle label="New Login Alert" field="newLoginDetected" settings={settings} onToggle={handleToggleSetting} />
                            <TriggerToggle label="Failed Login Alert" field="failedLoginAttempts" settings={settings} onToggle={handleToggleSetting} />
                            <TriggerToggle label="New Device Logged In" field="newDeviceLogin" settings={settings} onToggle={handleToggleSetting} />
                            <TriggerToggle label="Password Changed" field="passwordChanged" settings={settings} onToggle={handleToggleSetting} />
                            
                            <div className="h-px bg-[#1E2533] my-2" />
                            
                            <TriggerToggle label="KYC Check Submitted" field="kycSubmitted" settings={settings} onToggle={handleToggleSetting} />
                            <TriggerToggle label="KYC Check Approved" field="kycApproved" settings={settings} onToggle={handleToggleSetting} />
                            <TriggerToggle label="KYC Check Rejected" field="kycRejected" settings={settings} onToggle={handleToggleSetting} />
                            
                            <div className="h-px bg-[#1E2533] my-2" />
                            
                            <TriggerToggle label="Deposit Successful" field="depositSuccessful" settings={settings} onToggle={handleToggleSetting} />
                            <TriggerToggle label="Deposit Failed" field="depositFailed" settings={settings} onToggle={handleToggleSetting} />
                            <TriggerToggle label="Withdrawal Processed" field="withdrawalProcessed" settings={settings} onToggle={handleToggleSetting} />
                            <TriggerToggle label="Withdrawal Rejected" field="withdrawalRejected" settings={settings} onToggle={handleToggleSetting} />
                            
                            <div className="h-px bg-[#1E2533] my-2" />
                            
                            <TriggerToggle label="Referral Reward Earned" field="referralReward" settings={settings} onToggle={handleToggleSetting} />
                            <TriggerToggle label="Account Suspended Alert" field="accountSuspended" settings={settings} onToggle={handleToggleSetting} />
                            <TriggerToggle label="Maintenance Announcement" field="maintenanceAlerts" settings={settings} onToggle={handleToggleSetting} />
                        </div>
                    </div>

                    <div className="bg-primary-orange/5 border border-primary-orange/20 rounded-2xl p-5 relative overflow-hidden shadow-xl">
                        <div className="flex gap-3">
                            <Info size={16} className="text-primary-orange shrink-0 mt-0.5" />
                            <div>
                                <h4 className="text-white font-bold text-xs uppercase tracking-wider mb-1">Targeting Estimates</h4>
                                <p className="text-xs text-slate-400 leading-relaxed font-medium">
                                    Targeting calculations query active database users excluding deleted users. Adjust your composer variables to view dynamic estimates instantly.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Recent Campaigns Table */}
            <div className="bg-[#0D1017] border border-[#1E2533] rounded-2xl overflow-hidden shadow-2xl">
                <div className="p-6 border-b border-[#1E2533] flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <h3 className="text-base font-bold text-white uppercase tracking-wider flex items-center gap-3">
                        <History className="text-slate-500" size={18} />
                        Campaign Delivery Logs
                    </h3>
                    
                    <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
                        <div className="relative w-full sm:w-48">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
                            <input
                                type="text"
                                placeholder="Search logs..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-8 pr-3 py-1.5 bg-[#07090E] border border-[#1E2533] rounded-lg text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-primary-orange"
                            />
                        </div>
                        
                        <div className="relative w-full sm:w-48">
                            <select
                                value={selectedSegmentFilter}
                                onChange={(e) => setSelectedSegmentFilter(e.target.value)}
                                className="w-full appearance-none pl-3 pr-8 py-1.5 bg-[#07090E] border border-[#1E2533] rounded-lg text-xs text-slate-400 font-bold uppercase tracking-wider cursor-pointer"
                            >
                                <option value="all">All Segments</option>
                                {AUDIENCE_SEGMENTS.map(s => (
                                    <option key={s.value} value={s.value}>{s.label}</option>
                                ))}
                            </select>
                            <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-[#07090E]/50 border-b border-[#1E2533] text-[9px] font-black uppercase text-slate-500 tracking-widest font-sans">
                                <th className="px-6 py-4">Campaign Title</th>
                                <th className="px-6 py-4">Audience</th>
                                <th className="px-6 py-4">Channels</th>
                                <th className="px-6 py-4">Dispatched</th>
                                <th className="px-6 py-4">Opened</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4">Date Created</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#1E2533] text-xs">
                            {filteredBroadcasts.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="px-6 py-12 text-center text-slate-500 italic">
                                        No recent campaigns found.
                                    </td>
                                </tr>
                            ) : (
                                filteredBroadcasts.map((b) => {
                                    const openCount = b.stats?.opened || 0;
                                    const deliveredCount = b.stats?.delivered || b.stats?.sent || 0;
                                    const openRate = deliveredCount > 0 ? ((openCount / deliveredCount) * 100).toFixed(0) : '0';
                                    
                                    const channelsList = [];
                                    if (b.channels?.push) channelsList.push('Push');
                                    if (b.channels?.email) channelsList.push('Email');
                                    if (b.channels?.inApp) channelsList.push('In-App');

                                    return (
                                        <tr key={b._id} className="group hover:bg-[#07090E]/50 transition-colors duration-200">
                                            <td className="px-6 py-4 font-bold text-white max-w-[200px] truncate">{b.title}</td>
                                            <td className="px-6 py-4 font-bold uppercase tracking-wider text-[10px] text-slate-400 font-sans">
                                                {b.targetAudience?.scope?.replace('_', ' ')}
                                            </td>
                                            <td className="px-6 py-4 text-slate-400">
                                                <div className="flex gap-1.5 flex-wrap">
                                                    {channelsList.map(c => (
                                                        <span key={c} className="px-1.5 py-0.5 bg-[#07090E] border border-[#1E2533] rounded text-[9px] font-bold text-slate-400">{c}</span>
                                                    ))}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 font-mono font-bold text-slate-300">
                                                {(b.stats?.sent || 0).toLocaleString()} / {(b.stats?.targeted || 0).toLocaleString()}
                                            </td>
                                            <td className="px-6 py-4 font-mono text-slate-400">
                                                {openRate}% <span className="text-[9px] text-slate-600">({openCount})</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest border ${
                                                    b.status === 'SENT' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                                                    b.status === 'DRAFT' ? 'bg-slate-500/10 text-slate-400 border-slate-500/20' :
                                                    'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                                }`}>
                                                    {b.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-slate-500 font-medium">
                                                {b.createdAt ? new Date(b.createdAt).toLocaleDateString() : 'N/A'}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => handleAction('duplicate', b._id, b)}
                                                        title="Duplicate"
                                                        className="p-2 text-slate-400 hover:text-white bg-[#07090E] border border-[#1E2533] hover:border-slate-700 rounded-lg transition-all"
                                                    >
                                                        <Copy size={12} />
                                                    </button>
                                                    {b.status === 'DRAFT' && (
                                                        <button
                                                            onClick={() => handleAction('delete', b._id)}
                                                            title="Delete"
                                                            className="p-2 text-slate-400 hover:text-rose-500 bg-[#07090E] border border-[#1E2533] hover:border-rose-950/30 rounded-lg transition-all"
                                                        >
                                                            <Trash2 size={12} />
                                                        </button>
                                                    )}
                                                    {b.status !== 'DRAFT' && (
                                                        <button
                                                            onClick={() => handleAction('resend', b._id, b)}
                                                            title="Resend"
                                                            className="p-2 text-slate-400 hover:text-white bg-[#07090E] border border-[#1E2533] hover:border-slate-700 rounded-lg transition-all"
                                                        >
                                                            <Play size={12} fill="currentColor" />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Notification Preview Modal */}
            {showPreviewModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-300">
                    <div className="bg-[#0D1017] border border-[#1E2533] max-w-4xl w-full rounded-2xl overflow-hidden shadow-2xl flex flex-col h-[85vh]">
                        <div className="p-6 border-b border-[#1E2533] flex justify-between items-center bg-[#0D1017]">
                            <div>
                                <h3 className="text-base font-bold text-white uppercase tracking-wider">Multi-Channel Layout Preview</h3>
                                <p className="text-xs text-slate-500 mt-1">Simulated delivery rendering of current composer details.</p>
                            </div>
                            <button
                                onClick={() => setShowPreviewModal(false)}
                                className="px-3.5 py-1.5 bg-[#07090E] border border-[#1E2533] text-xs font-bold hover:text-white rounded-lg"
                            >
                                Close Preview
                            </button>
                        </div>
                        
                        <div className="flex-1 p-6 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-8 custom-scrollbar bg-[#07090E]/30">
                            
                            {/* Email template preview rendering */}
                            <div className="space-y-3">
                                <h4 className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Email Format (HTML Template)</h4>
                                <div className="border border-[#1E2533] bg-[#07090E] rounded-xl overflow-hidden font-sans text-xs shadow-inner">
                                    <div className="p-4 border-b border-[#1E2533] bg-[#0D1017] flex items-center gap-2">
                                        <div className="w-5 h-5 bg-primary-orange/10 border border-primary-orange/20 rounded flex items-center justify-center font-bold text-primary-orange text-xs">⚡</div>
                                        <span className="font-extrabold text-white">SwiftPay</span>
                                    </div>
                                    <div className="p-6 space-y-4">
                                        <h3 className="text-sm font-bold text-white border-b border-[#1E2533]/50 pb-2">{title || 'Subject Line Preview'}</h3>
                                        <p className="text-slate-400 whitespace-pre-wrap leading-relaxed">{body || 'Enter message body to view layout structure...'}</p>
                                        <div className="p-4 bg-primary-orange/5 border border-primary-orange/10 rounded-lg text-[10px] text-slate-400 leading-relaxed">
                                            <strong>Security Tip:</strong> SwiftPay representatives will never contact you requesting login hashes or OTP codes. If you did not request this communication, please contact support.
                                        </div>
                                    </div>
                                    <div className="p-4 border-t border-[#1E2533] bg-[#0D1017] text-[9px] text-slate-600 text-center">
                                        &copy; {new Date().getFullYear()} SwiftPay. All rights reserved. <br /> Nairobi, Kenya
                                    </div>
                                </div>
                            </div>

                            {/* Mobile push preview rendering */}
                            <div className="space-y-3">
                                <h4 className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Mobile Push Notification Format</h4>
                                <div className="max-w-[320px] mx-auto border border-[#1E2533] bg-[#07090E] rounded-[2.5rem] p-3 shadow-inner relative h-[420px] flex flex-col justify-between">
                                    
                                    {/* Mock notification banner */}
                                    <div className="bg-[#0D1017]/95 border border-[#1E2533] p-4 rounded-2xl shadow-2xl space-y-2 mt-4">
                                        <div className="flex justify-between items-center">
                                            <div className="flex items-center gap-1.5">
                                                <div className="w-4 h-4 bg-primary-orange rounded flex items-center justify-center text-[10px]">⚡</div>
                                                <span className="text-[10px] font-extrabold text-white uppercase tracking-wider">SwiftPay</span>
                                            </div>
                                            <span className="text-[9px] text-slate-500 font-bold">now</span>
                                        </div>
                                        <div>
                                            <p className="text-[11px] font-extrabold text-white leading-tight">{title || 'Notification Subject'}</p>
                                            <p className="text-[10px] text-slate-400 truncate mt-0.5 leading-normal">{body || 'Enter message body...'}</p>
                                        </div>
                                    </div>

                                    {/* Center placeholder */}
                                    <div className="flex-1 flex items-center justify-center">
                                        <div className="w-12 h-1 bg-[#1E2533] rounded-full mt-4" />
                                    </div>

                                    {/* Phone bottom bar */}
                                    <div className="w-full text-center pb-2">
                                        <div className="w-20 h-1 bg-slate-600 rounded-full mx-auto" />
                                    </div>
                                </div>
                            </div>

                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// Helper analytics card component
function AnalyticsCard({ title, value, trend, type }: { title: string; value: any; trend: string; type: string }) {
    const iconMap: any = {
        sent: <Send size={16} />,
        delivered: <CheckSquare size={16} />,
        opened: <Eye size={16} />,
        clicked: <Compass size={16} />
    };

    return (
        <div className="bg-[#0D1017] border border-[#1E2533] rounded-2xl p-5 hover:scale-[1.01] transition-all duration-300">
            <div className="flex justify-between items-start">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-wider">{title}</p>
                <div className="w-7 h-7 rounded-lg bg-primary-orange/10 text-primary-orange flex items-center justify-center shrink-0">
                    {iconMap[type] || <Send size={16} />}
                </div>
            </div>
            <div className="flex items-baseline gap-2 mt-4">
                <p className="text-2xl font-black text-white tracking-tight">{value}</p>
                <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                    {trend}
                </span>
            </div>
        </div>
    );
}

// Mode Selection Tab buttons helper
function ModeTab({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all uppercase tracking-wider cursor-pointer ${
                active ? 'bg-primary-orange text-white shadow-md' : 'text-slate-500 hover:text-slate-300'
            }`}
        >
            {label}
        </button>
    );
}

// Rich Text inserting buttons helper
function FormatBtn({ label, onClick }: { label: string; onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            className="px-2.5 py-1 text-slate-400 hover:text-white rounded text-[10px] font-extrabold uppercase tracking-wider hover:bg-[#1C202E] transition-all"
        >
            {label}
        </button>
    );
}

// Channel Selection switches helper
function ChannelToggle({ icon, label, active, onClick }: { icon: React.ReactNode; label: string; active: boolean; onClick: () => void }) {
    return (
        <div className="flex items-center gap-3">
            <button
                onClick={onClick}
                className={`w-8 h-8 rounded-lg flex items-center justify-center border transition-all cursor-pointer ${
                    active ? 'bg-primary-orange/10 border-primary-orange text-primary-orange shadow' : 'bg-[#07090E] border-[#1E2533] text-slate-600 hover:border-slate-800'
                }`}
            >
                {icon}
            </button>
            <span className={`text-xs font-bold uppercase tracking-wider ${active ? 'text-slate-200 font-extrabold' : 'text-slate-500'}`}>{label}</span>
            <button
                onClick={onClick}
                className={`w-9 h-5 rounded-full relative transition-all shadow-inner cursor-pointer ${
                    active ? 'bg-primary-orange' : 'bg-[#07090E] border border-[#1E2533]'
                }`}
            >
                <div className={`absolute top-0.5 w-4.5 h-4 rounded-full bg-white transition-all shadow-sm ${active ? 'left-4' : 'left-0.5'}`} />
            </button>
        </div>
    );
}

// Single automated alert toggle item
function TriggerToggle({ label, field, settings, onToggle }: { label: string; field: string; settings: any; onToggle: (k: string, v: boolean) => void }) {
    const active = settings ? !!settings[field] : true;
    return (
        <div className="flex items-center justify-between p-3 rounded-xl border border-[#1E2533] bg-[#07090E]/50 group hover:border-[#2C374E] transition-all duration-200">
            <span className="text-xs font-bold text-slate-300 group-hover:text-white transition-colors">{label}</span>
            <button
                onClick={() => onToggle(field, !active)}
                className={`w-9 h-5 rounded-full relative transition-all shadow-inner cursor-pointer ${
                    active ? 'bg-emerald-600 shadow-emerald-500/20' : 'bg-slate-800'
                }`}
            >
                <div className={`absolute top-0.5 w-4.5 h-4 rounded-full bg-white transition-all shadow-sm ${active ? 'left-4' : 'left-0.5'}`} />
            </button>
        </div>
    );
}
