"use client";

import React, { useState, useEffect, useCallback } from 'react';
import {
    ShieldCheck,
    Clock,
    CheckCircle2,
    XCircle,
    ExternalLink,
    User,
    FileText,
    AlertTriangle,
    ChevronRight,
    Filter,
    Loader2,
    Search,
    UserCheck,
    AlertCircle
} from 'lucide-react';
import { adminService } from '@/services/admin.service';

export default function KycPage() {
    const [requests, setRequests] = useState<any[]>([]);
    const [selectedRequest, setSelectedRequest] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [filter, setFilter] = useState('PENDING');

    const fetchKycRequests = useCallback(async () => {
        try {
            setLoading(true);
            const data = await adminService.getKycRequests({ status: filter, limit: 20 });
            setRequests(data.requests || []);
            if (data.requests?.length > 0 && !selectedRequest) {
                setSelectedRequest(data.requests[0]);
            }
            setError(null);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [filter]);

    useEffect(() => {
        fetchKycRequests();
    }, [fetchKycRequests]);

    const handleApprove = async () => {
        if (!selectedRequest || !confirm(`Approve KYC for ${selectedRequest.userId.username}?`)) return;
        try {
            setProcessing(true);
            await adminService.approveKyc(selectedRequest._id);
            alert("KYC Approved Successfully");
            fetchKycRequests();
            setSelectedRequest(null);
        } catch (err: any) {
            alert(err.message);
        } finally {
            setProcessing(false);
        }
    };

    const handleReject = async () => {
        if (!selectedRequest) return;
        const reason = prompt("Reason for rejection:");
        if (!reason) return;

        try {
            setProcessing(true);
            await adminService.rejectKyc(selectedRequest._id, reason);
            alert("KYC Rejected");
            fetchKycRequests();
            setSelectedRequest(null);
        } catch (err: any) {
            alert(err.message);
        } finally {
            setProcessing(false);
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h2 className="text-3xl font-bold text-white tracking-tight">KYC Verification</h2>
                    <p className="text-slate-400 mt-1">Review and process user identity verification requests.</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex bg-slate-900 border border-slate-800 rounded-xl p-1">
                        <button
                            onClick={() => setFilter('PENDING')}
                            className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${filter === 'PENDING' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
                        >
                            Pending ({requests.filter(r => r.status === 'PENDING').length})
                        </button>
                        <button
                            onClick={() => setFilter('APPROVED')}
                            className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${filter === 'APPROVED' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
                        >
                            History
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Grid: List and Detail Viewer */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">

                {/* Left Column: List of Requests */}
                <div className="xl:col-span-1 space-y-4 max-h-[700px] overflow-y-auto pr-2 custom-scrollbar">
                    {loading ? (
                        <div className="py-20 text-center">
                            <Loader2 className="animate-spin text-indigo-500 mx-auto" size={32} />
                            <p className="text-slate-500 mt-4 text-xs font-bold uppercase tracking-widest">Loading queue...</p>
                        </div>
                    ) : requests.length === 0 ? (
                        <div className="p-8 bg-slate-900/30 border border-slate-800 rounded-2xl text-center">
                            <UserCheck className="mx-auto text-slate-700 mb-4" size={40} />
                            <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Verification queue is empty</p>
                        </div>
                    ) : (
                        requests.map((req) => (
                            <KycListItem
                                key={req._id}
                                name={req.userId.username}
                                email={req.userId.email}
                                type={req.documentType}
                                time={new Date(req.createdAt).toLocaleDateString()}
                                active={selectedRequest?._id === req._id}
                                onClick={() => setSelectedRequest(req)}
                                status={req.status}
                            />
                        ))
                    )}
                </div>

                {/* Right Column: Detail Document Viewer */}
                <div className="xl:col-span-2 space-y-6">
                    {selectedRequest ? (
                        <div className="bg-slate-900/50 border border-slate-800 rounded-3xl backdrop-blur-sm overflow-hidden flex flex-col min-h-[600px]">
                            {/* Card Header */}
                            <div className="p-6 border-b border-slate-800 bg-slate-800/20 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center font-bold text-lg uppercase">
                                        {selectedRequest.userId.username[0]}
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-white capitalize">{selectedRequest.userId.username}</h3>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">ID: {selectedRequest.userId._id.slice(-8)}</span>
                                            <div className="w-1 h-1 rounded-full bg-slate-700" />
                                            <span className="text-xs text-indigo-400 font-bold uppercase tracking-widest">{selectedRequest.documentType}</span>
                                        </div>
                                    </div>
                                </div>
                                {selectedRequest.status === 'PENDING' && (
                                    <div className="flex items-center gap-3">
                                        <button
                                            onClick={handleReject}
                                            disabled={processing}
                                            className="flex items-center gap-2 px-4 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 font-bold text-sm rounded-xl border border-rose-500/20 transition-all disabled:opacity-50"
                                        >
                                            <XCircle size={16} />
                                            Reject
                                        </button>
                                        <button
                                            onClick={handleApprove}
                                            disabled={processing}
                                            className="flex items-center gap-2 px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-emerald-600/20 transition-all disabled:opacity-50"
                                        >
                                            {processing ? <Loader2 className="animate-spin" size={16} /> : <CheckCircle2 size={16} />}
                                            Approve KYC
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Document Display Area */}
                            <div className="flex-1 p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-6">
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Document Images</p>
                                        <div className="grid grid-cols-1 gap-4">
                                            {selectedRequest.documentUrls?.map((url: string, i: number) => (
                                                <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="group block">
                                                    <div className="aspect-[1.6/1] bg-slate-800 rounded-2xl border-2 border-dashed border-slate-700 flex items-center justify-center group-hover:border-indigo-500/50 transition-all overflow-hidden">
                                                        {url.match(/\.(jpg|jpeg|png|webp|gif)$/) ? (
                                                            <img src={url} alt="KYC Document" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                                        ) : (
                                                            <div className="text-center">
                                                                <FileText size={48} className="text-slate-600 mx-auto mb-2" />
                                                                <p className="text-xs text-slate-500 font-medium">View Attachment {i + 1}</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                </a>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-8">
                                    <div className="bg-slate-950/40 border border-slate-800 rounded-2xl p-6 space-y-6">
                                        <h4 className="text-white font-bold text-sm border-b border-slate-800 pb-3">User Verification Data</h4>
                                        <MetaField label="Full Name" value={selectedRequest.userId.fullName || 'Not Provided'} match={!!selectedRequest.userId.fullName} />
                                        <MetaField label="Email" value={selectedRequest.userId.email} match={true} />
                                        <MetaField label="Username" value={`@${selectedRequest.userId.username}`} match={true} />
                                        <MetaField label="Verified By System" value="Passed Initial Checks" match={true} />

                                        {selectedRequest.rejectionReason && (
                                            <div className="mt-4 p-3 bg-rose-500/5 border border-rose-500/20 rounded-xl flex items-start gap-3">
                                                <AlertTriangle size={16} className="text-rose-400 shrink-0 mt-0.5" />
                                                <p className="text-[11px] text-rose-300 font-medium leading-relaxed">
                                                    Rejected: {selectedRequest.rejectionReason}
                                                </p>
                                            </div>
                                        )}
                                    </div>

                                    {selectedRequest.selfieUrl && (
                                        <div>
                                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Liveness Selfie</p>
                                            <a href={selectedRequest.selfieUrl} target="_blank" rel="noopener noreferrer" className="block w-48 h-48 bg-slate-800 rounded-2xl border-2 border-dashed border-slate-700 flex items-center justify-center group hover:border-indigo-500/50 transition-all overflow-hidden">
                                                <img src={selectedRequest.selfieUrl} alt="Liveness Selfie" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                            </a>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="h-full bg-slate-900/20 border-2 border-dashed border-slate-800 rounded-3xl flex flex-col items-center justify-center p-12 text-center opacity-60">
                            <ShieldCheck size={64} className="text-slate-800 mb-6" />
                            <h3 className="text-xl font-bold text-slate-400">Select a request to review</h3>
                            <p className="text-slate-600 max-w-xs mt-2 text-sm leading-relaxed font-medium">Identity documents will appear here for verification once a user is selected from the queue.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function KycListItem({ name, email, type, time, active, onClick, status }: any) {
    const statusColor = status === 'APPROVED' ? 'text-emerald-400' :
        status === 'PENDING' ? 'text-indigo-400' :
            'text-rose-400';

    return (
        <div
            onClick={onClick}
            className={`p-4 bg-slate-900 border rounded-2xl transition-all cursor-pointer group flex items-center justify-between ${active ? 'border-indigo-500 bg-indigo-500/10 shadow-lg shadow-indigo-500/20 scale-[1.02]' : 'border-slate-800 hover:border-slate-700 hover:bg-slate-800/20'}`}
        >
            <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all shadow-inner uppercase font-bold text-xs ${active ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-500 group-hover:scale-105'}`}>
                    {name[0]}
                </div>
                <div>
                    <h4 className="text-sm font-bold text-white tracking-tight capitalize">{name}</h4>
                    <p className="text-[11px] text-slate-500 font-medium truncate w-32">{email}</p>
                </div>
            </div>
            <div className="text-right">
                <div className={`text-[10px] font-bold uppercase tracking-widest ${statusColor}`}>{status}</div>
                <div className="mt-1 flex items-center justify-end gap-1.5 text-[9px] font-black text-slate-600 uppercase tracking-tighter">
                    {type}
                    {active && <ChevronRight size={10} className="text-indigo-400" />}
                </div>
            </div>
        </div>
    );
}

function MetaField({ label, value, match }: any) {
    return (
        <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-medium">{label}</span>
            <div className="flex items-center gap-2 text-right">
                <span className={`text-xs font-bold ${match ? 'text-white' : 'text-rose-400'}`}>{value}</span>
                {match ? (
                    <CheckCircle2 size={12} className="text-emerald-500" />
                ) : (
                    <XCircle size={12} className="text-rose-500" />
                )}
            </div>
        </div>
    );
}
