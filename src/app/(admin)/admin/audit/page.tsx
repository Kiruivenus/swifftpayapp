'use client';

import React, { useState, useEffect, useCallback } from 'react';
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
    Activity,
    Clock,
    X,
    ChevronDown,
    Loader2,
    RefreshCw
} from 'lucide-react';
import { adminService } from '@/services/admin.service';
import { format } from 'date-fns';

export default function AuditLogsPage() {
    const [logs, setLogs] = useState<any[]>([]);
    const [stats, setStats] = useState({
        last24h: 0,
        criticalLast24h: 0,
        automationLast24h: 0
    });
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [search, setSearch] = useState('');
    const [actionType, setActionType] = useState('');
    const [severity, setSeverity] = useState('');
    const [selectedLog, setSelectedLog] = useState<any>(null);
    const [showDetail, setShowDetail] = useState(false);

    const fetchLogs = useCallback(async (isLoadMore = false) => {
        try {
            if (isLoadMore) setLoadingMore(true);
            else setLoading(true);

            const res = await adminService.getAuditLogs({
                q: search,
                actionType,
                severity,
                page: isLoadMore ? page + 1 : 1,
                limit: 20
            });

            if (isLoadMore) {
                setLogs(prev => [...prev, ...res.items]);
                setPage(prev => prev + 1);
            } else {
                setLogs(res.items);
                setStats(res.stats);
                setTotalPages(res.totalPages);
                setPage(1);
            }
        } catch (error) {
            console.error('Failed to fetch audit logs:', error);
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    }, [search, actionType, severity, page]);

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchLogs();
        }, 500); // Debounce search
        return () => clearTimeout(timer);
    }, [search, actionType, severity]);

    const handleExport = () => {
        const url = adminService.getAuditExportUrl({ q: search, actionType, severity });
        window.open(url, '_blank');
    };

    const openDetails = (log: any) => {
        setSelectedLog(log);
        setShowDetail(true);
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h2 className="text-3xl font-bold text-white tracking-tight">Audit Trail</h2>
                    <p className="text-slate-400 mt-1">Immutable record of all administrative actions and system events.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => fetchLogs()}
                        disabled={loading}
                        className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-400 rounded-xl border border-slate-700 transition-all"
                    >
                        <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                    </button>
                    <button
                        onClick={handleExport}
                        className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl transition-all shadow-lg shadow-indigo-500/20"
                    >
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
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search logs by actor, action, target, or IP..."
                        className="w-full pl-12 pr-4 py-3 bg-slate-900/50 border border-slate-800 rounded-2xl text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/50 transition-all"
                    />
                </div>
                <div className="flex gap-4">
                    <div className="relative group">
                        <select
                            value={severity}
                            onChange={(e) => setSeverity(e.target.value)}
                            className="appearance-none flex items-center gap-2 px-4 py-3 bg-slate-900/30 border border-slate-800 rounded-2xl text-slate-400 font-bold text-xs uppercase tracking-widest hover:border-slate-700 transition-all focus:outline-none min-w-[140px]"
                        >
                            <option value="">All Severities</option>
                            <option value="INFO">Info</option>
                            <option value="WARNING">Warning</option>
                            <option value="CRITICAL">Critical</option>
                        </select>
                        <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600 pointer-events-none" />
                    </div>
                </div>
            </div>

            {/* Audit Table */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-3xl overflow-hidden backdrop-blur-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-800/30 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                <th className="px-6 py-4">Timestamp</th>
                                <th className="px-6 py-4">Administrator / Actor</th>
                                <th className="px-6 py-4">Action</th>
                                <th className="px-6 py-4">Target Entity</th>
                                <th className="px-6 py-4">IP Address</th>
                                <th className="px-6 py-4 text-right">Details</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                            {loading ? (
                                Array(5).fill(0).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan={6} className="px-6 py-5 bg-slate-800/5 h-16"></td>
                                    </tr>
                                ))
                            ) : logs.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center">
                                        <div className="flex flex-col items-center gap-3 text-slate-500">
                                            <History size={40} className="opacity-20" />
                                            <p className="text-sm font-medium">No audit activity found for the selected filters.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                logs.map((log) => (
                                    <AuditLogRow
                                        key={log._id}
                                        log={log}
                                        onViewDetails={() => openDetails(log)}
                                    />
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Footer info */}
                <div className="p-6 border-t border-slate-800 flex items-center justify-between">
                    <p className="text-xs text-slate-500 font-medium">Audit logs are immutable and server-verified for system integrity.</p>
                    {page < totalPages && (
                        <button
                            onClick={() => fetchLogs(true)}
                            disabled={loadingMore}
                            className="flex items-center gap-2 text-xs font-bold text-indigo-400 hover:text-indigo-300 transition-colors uppercase tracking-widest disabled:opacity-50"
                        >
                            {loadingMore ? <Loader2 size={14} className="animate-spin" /> : null}
                            Load Previous Activity
                        </button>
                    )}
                </div>
            </div>

            {/* Activity Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-6 bg-slate-900/30 border border-slate-800 rounded-2xl flex items-center gap-4 transition-transform hover:scale-[1.02]">
                    <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                        <Activity size={20} />
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Total Logs (24h)</p>
                        <p className="text-lg font-bold text-white">{stats.last24h.toLocaleString()} Events</p>
                    </div>
                </div>
                <div className="p-6 bg-slate-900/30 border border-slate-800 rounded-2xl flex items-center gap-4 transition-transform hover:scale-[1.02]">
                    <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-orange-400 flex items-center justify-center">
                        <Shield size={20} />
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Critical Actions</p>
                        <p className="text-lg font-bold text-white">{stats.criticalLast24h.toLocaleString()} Events</p>
                    </div>
                </div>
                <div className="p-6 bg-slate-900/30 border border-slate-800 rounded-2xl flex items-center gap-4 transition-transform hover:scale-[1.02]">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                        <Terminal size={20} />
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">System Automation</p>
                        <p className="text-lg font-bold text-white">{stats.automationLast24h.toLocaleString()} Tasks</p>
                    </div>
                </div>
            </div>

            {/* Detail Modal/Drawer */}
            {showDetail && selectedLog && (
                <div className="fixed inset-0 z-50 flex items-center justify-end bg-slate-950/40 backdrop-blur-sm p-4 animate-in fade-in duration-300">
                    <div className="w-full max-w-lg h-full bg-slate-900 border-l border-slate-800 shadow-2xl overflow-y-auto animate-in slide-in-from-right duration-500">
                        <div className="sticky top-0 p-6 border-b border-slate-800 bg-slate-900/80 backdrop-blur-md flex items-center justify-between z-10">
                            <div>
                                <h3 className="text-lg font-bold text-white">Log Details</h3>
                                <p className="text-xs text-slate-500 font-mono mt-1">ID: {selectedLog._id}</p>
                            </div>
                            <button onClick={() => setShowDetail(false)} className="p-2 text-slate-400 hover:text-white transition-colors">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-8 space-y-8">
                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-1">Timestamp</p>
                                    <p className="text-sm text-slate-200">{format(new Date(selectedLog.timestamp), 'MMM d, yyyy HH:mm:ss')}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-1">Severity</p>
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${selectedLog.severity === 'CRITICAL' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
                                            selectedLog.severity === 'WARNING' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                                                'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                                        }`}>
                                        {selectedLog.severity}
                                    </span>
                                </div>
                            </div>

                            <div className="p-4 bg-slate-950/50 rounded-2xl border border-slate-800">
                                <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-4">Actor Context</p>
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs text-slate-500">Name / ID</span>
                                        <span className="text-xs font-bold text-white">{selectedLog.actorName || selectedLog.actorId}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs text-slate-500">Role</span>
                                        <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">{selectedLog.actorRole}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs text-slate-500">IP Address</span>
                                        <span className="text-xs font-mono text-slate-300">{selectedLog.ipAddress}</span>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-3">Action Details</p>
                                <div className="p-4 bg-slate-950/50 rounded-2xl border border-slate-800 space-y-4">
                                    <div className="flex justify-between">
                                        <span className="text-xs text-slate-500">Type</span>
                                        <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest">{selectedLog.actionType}</span>
                                    </div>
                                    <div className="flex justify-between text-right">
                                        <span className="text-xs text-slate-500">Target</span>
                                        <span className="text-xs font-bold text-white">{selectedLog.targetType} / {selectedLog.targetId}</span>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-3">Changes Metadata</p>
                                <pre className="p-6 bg-slate-950 rounded-2xl border border-slate-800 text-[11px] text-indigo-300 font-mono overflow-x-auto whitespace-pre-wrap leading-relaxed">
                                    {JSON.stringify(selectedLog.details, null, 2)}
                                </pre>
                            </div>

                            <div>
                                <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-3">User Agent</p>
                                <p className="text-[11px] text-slate-500 leading-relaxed italic">
                                    {selectedLog.userAgent}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function AuditLogRow({ log, onViewDetails }: any) {
    const severityStyle =
        log.severity === 'CRITICAL' ? 'text-rose-400 bg-rose-500/10 border-rose-500/20' :
            log.severity === 'WARNING' ? 'text-amber-400 bg-amber-500/10 border-amber-500/20' :
                'text-indigo-400 bg-indigo-500/10 border-indigo-500/20';

    return (
        <tr className="group hover:bg-slate-800/20 transition-all duration-300">
            <td className="px-6 py-5">
                <div className="flex items-center gap-3">
                    <Clock size={14} className="text-slate-600" />
                    <span className="text-xs font-bold text-slate-300">
                        {format(new Date(log.timestamp), 'MMM d, HH:mm:ss')}
                    </span>
                </div>
            </td>
            <td className="px-6 py-5">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-[10px] font-bold text-slate-400">
                        {(log.actorName || 'S').split(' ').map((n: string) => n[0]).join('')}
                    </div>
                    <div>
                        <p className="text-xs font-bold text-white">{log.actorName || 'System'}</p>
                        <p className="text-[10px] text-slate-600 font-bold uppercase tracking-tight">{log.actorRole || 'Bot'}</p>
                    </div>
                </div>
            </td>
            <td className="px-6 py-5">
                <span className={`px-2 py-0.5 rounded border text-[9px] font-black uppercase tracking-widest ${severityStyle}`}>
                    {log.actionType}
                </span>
            </td>
            <td className="px-6 py-5">
                <div className="flex items-center gap-2 text-[11px] font-mono text-slate-500">
                    <Database size={10} />
                    {log.targetType} / {log.targetId?.slice(-6) || 'GLOBAL'}
                </div>
            </td>
            <td className="px-6 py-5 text-[11px] text-slate-600 font-medium whitespace-nowrap">
                {log.ipAddress}
            </td>
            <td className="px-6 py-5 text-right">
                <button
                    onClick={onViewDetails}
                    className="p-2 text-slate-500 hover:text-white transition-colors"
                >
                    <ExternalLink size={16} />
                </button>
            </td>
        </tr>
    );
}
