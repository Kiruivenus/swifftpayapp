import React from 'react';
import {
    History,
    Search,
    Filter,
    Download,
    User,
    Database,
    Terminal,
    ExternalLink,
    Calendar,
    Layers,
    Shield,
    Activity
} from 'lucide-react';

export default function AuditLogsPage() {
    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h2 className="text-3xl font-bold text-white tracking-tight">Audit Trail</h2>
                    <p className="text-slate-400 mt-1">Immutable record of all administrative actions and system events.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button className="flex items-center gap-2 px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-xl border border-slate-700 transition-all">
                        <Download size={18} />
                        Download CSV
                    </button>
                </div>
            </div>

            {/* Filter Bar */}
            <div className="flex flex-col lg:flex-row gap-4">
                <div className="flex-1 relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
                    <input
                        type="text"
                        placeholder="Search logs by admin, action, or target ID..."
                        className="w-full pl-12 pr-4 py-3 bg-slate-900/50 border border-slate-800 rounded-2xl text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/50 transition-all"
                    />
                </div>
                <div className="flex gap-4">
                    <button className="flex items-center gap-2 px-4 py-3 bg-slate-900/30 border border-slate-800 rounded-2xl text-slate-400 font-bold text-xs uppercase tracking-widest hover:border-slate-700 transition-all">
                        <Calendar size={18} />
                        Date Range
                    </button>
                    <button className="flex items-center gap-2 px-4 py-3 bg-slate-900/30 border border-slate-800 rounded-2xl text-slate-400 font-bold text-xs uppercase tracking-widest hover:border-slate-700 transition-all">
                        <Layers size={18} />
                        Action Type
                    </button>
                </div>
            </div>

            {/* Audit Table */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-3xl overflow-hidden backdrop-blur-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-800/30 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                <th className="px-6 py-4">Timestamp</th>
                                <th className="px-6 py-4">Administrator</th>
                                <th className="px-6 py-4">Action</th>
                                <th className="px-6 py-4">Target Entity</th>
                                <th className="px-6 py-4">IP Address</th>
                                <th className="px-6 py-4 text-right">Details</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                            <AuditLogRow
                                timestamp="Mar 1, 14:02:45"
                                admin="Patrick Kirui"
                                role="Super Admin"
                                action="UPDATE_RATE"
                                target="RATE_USDT_KES"
                                ip="197.232.14.85"
                                severity="low"
                            />
                            <AuditLogRow
                                timestamp="Mar 1, 13:45:10"
                                admin="Sarah Johnson"
                                role="Support"
                                action="BLOCK_USER"
                                target="USER_9284051"
                                ip="41.215.10.12"
                                severity="high"
                            />
                            <AuditLogRow
                                timestamp="Mar 1, 12:20:33"
                                admin="Alice Wambui"
                                role="KYC Reviewer"
                                action="APPROVE_KYC"
                                target="USER_5920204"
                                ip="102.34.5.110"
                                severity="medium"
                            />
                            <AuditLogRow
                                timestamp="Mar 1, 11:10:05"
                                admin="John Finance"
                                role="Finance"
                                action="APPROVE_WITHDRAWAL"
                                target="TX_4920285"
                                ip="197.232.20.15"
                                severity="medium"
                            />
                            <AuditLogRow
                                timestamp="Mar 1, 10:05:40"
                                admin="System Bot"
                                role="System"
                                action="MAINTENANCE_MODE_OFF"
                                target="SETTINGS_GLOBAL"
                                ip="Internal"
                                severity="high"
                            />
                        </tbody>
                    </table>
                </div>

                {/* Footer info */}
                <div className="p-6 border-t border-slate-800 flex items-center justify-between">
                    <p className="text-xs text-slate-500 font-medium">Audit logs are immutable and cryptographically hashed for security.</p>
                    <button className="text-xs font-bold text-indigo-400 hover:text-indigo-300 transition-colors uppercase tracking-widest">
                        Load Previous Activity
                    </button>
                </div>
            </div>

            {/* Activity Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-6 bg-slate-900/30 border border-slate-800 rounded-2xl flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                        <Activity size={20} />
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Total Logs (24h)</p>
                        <p className="text-lg font-bold text-white">452 Events</p>
                    </div>
                </div>
                <div className="p-6 bg-slate-900/30 border border-slate-800 rounded-2xl flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-orange-400 flex items-center justify-center">
                        <Shield size={20} />
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Critical Actions</p>
                        <p className="text-lg font-bold text-white">12 Events</p>
                    </div>
                </div>
                <div className="p-6 bg-slate-900/30 border border-slate-800 rounded-2xl flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                        <Terminal size={20} />
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">System Automation</p>
                        <p className="text-lg font-bold text-white">1,240 Tasks</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

function AuditLogRow({ timestamp, admin, role, action, target, ip, severity }: any) {
    const severityStyle = severity === 'high' ? 'text-rose-400 bg-rose-500/10 border-rose-500/20' :
        severity === 'medium' ? 'text-amber-400 bg-amber-500/10 border-amber-500/20' :
            'text-indigo-400 bg-indigo-500/10 border-indigo-500/20';

    return (
        <tr className="group hover:bg-slate-800/20 transition-all duration-300">
            <td className="px-6 py-5">
                <div className="flex items-center gap-3">
                    <Clock size={14} className="text-slate-600" />
                    <span className="text-xs font-bold text-slate-300">{timestamp}</span>
                </div>
            </td>
            <td className="px-6 py-5">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-[10px] font-bold text-slate-400">
                        {admin.split(' ').map((n: string) => n[0]).join('')}
                    </div>
                    <div>
                        <p className="text-xs font-bold text-white">{admin}</p>
                        <p className="text-[10px] text-slate-600 font-bold uppercase tracking-tight">{role}</p>
                    </div>
                </div>
            </td>
            <td className="px-6 py-5">
                <span className={`px-2 py-0.5 rounded border text-[9px] font-black uppercase tracking-widest ${severityStyle}`}>
                    {action}
                </span>
            </td>
            <td className="px-6 py-5">
                <div className="flex items-center gap-2 text-[11px] font-mono text-slate-500">
                    <Database size={10} />
                    {target}
                </div>
            </td>
            <td className="px-6 py-5 text-[11px] text-slate-600 font-medium">
                {ip}
            </td>
            <td className="px-6 py-5 text-right">
                <button className="p-2 text-slate-500 hover:text-white transition-colors">
                    <ExternalLink size={16} />
                </button>
            </td>
        </tr>
    );
}

function Clock({ size, className }: any) {
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
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
        </svg>
    );
}
