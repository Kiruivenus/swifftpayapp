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
    }, [filter, selectedRequest]);

    useEffect(() => {
        fetchKycRequests();
    }, [filter]);

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
        <div className="space-y-8 animate-in fade-in duration-700 font-sans">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h2 className="text-3xl font-bold text-white tracking-tight">KYC Verification</h2>
                    <p className="text-slate-400 mt-1">Review and process user identity verification requests.</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex bg-[#0D1017] border border-[#1E2533] rounded-xl p-0.5 shadow-inner">
                        <button
                            onClick={() => setFilter('PENDING')}
                            className={`px-4 py-1.5 text-xs font-black rounded-lg transition-all uppercase tracking-widest ${filter === 'PENDING' ? 'bg-primary-orange text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
                        >
                            Pending ({requests.filter(r => r.status === 'PENDING').length})
                        </button>
                        <button
                            onClick={() => setFilter('APPROVED')}
                            className={`px-4 py-1.5 text-xs font-black rounded-lg transition-all uppercase tracking-widest ${filter === 'APPROVED' ? 'bg-primary-orange text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
                        >
                            History
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Grid: List and Detail Viewer */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">

                {/* Left Column: List of Requests */}
                <div className="xl:col-span-1 space-y-3 max-h-[700px] overflow-y-auto pr-2 custom-scrollbar">
                    {loading ? (
                        <div className="py-20 text-center">
                            <Loader2 className="animate-spin text-primary-orange mx-auto" size={32} />
                            <p className="text-slate-500 mt-4 text-[10px] font-bold uppercase tracking-widest">Loading queue...</p>
                        </div>
                    ) : requests.length === 0 ? (
                        <div className="p-8 bg-[#0D1017]/60 border border-[#1E2533] rounded-3xl text-center backdrop-blur-md">
                            <UserCheck className="mx-auto text-slate-700 mb-4" size={36} />
                            <p className="text-slate-500 font-bold uppercase tracking-widest text-[9px]">Verification queue is empty</p>
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
                        <div className="bg-[#0D1017]/60 border border-[#1E2533] rounded-3xl backdrop-blur-md overflow-hidden flex flex-col min-h-[600px] shadow-2xl animate-in fade-in duration-500">
                            {/* Card Header */}
                            <div className="p-6 border-b border-[#1E2533] bg-white/[0.01] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-primary-orange-light border border-primary-orange-border/30 text-primary-orange flex items-center justify-center font-black text-lg uppercase shadow-inner">
                                        {selectedRequest.userId.username[0]}
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-white capitalize">{selectedRequest.userId.username}</h3>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">ID: {selectedRequest.userId._id.slice(-8)}</span>
                                            <div className="w-1 h-1 rounded-full bg-slate-700" />
                                            <span className="text-[10px] text-primary-orange font-black uppercase tracking-widest">{selectedRequest.documentType}</span>
                                        </div>
                                    </div>
                                </div>
                                {selectedRequest.status === 'PENDING' && (
                                    <div className="flex items-center gap-3">
                                        <button
                                            onClick={handleReject}
                                            disabled={processing}
                                            className="flex items-center gap-2 px-4 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 font-bold text-xs uppercase tracking-wider rounded-xl border border-rose-500/20 transition-all disabled:opacity-50"
                                        >
                                            <XCircle size={14} />
                                            Reject
                                        </button>
                                        <button
                                            onClick={handleApprove}
                                            disabled={processing}
                                            className="flex items-center gap-2 px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-emerald-600/20 transition-all disabled:opacity-50"
                                        >
                                            {processing ? <Loader2 className="animate-spin" size={14} /> : <CheckCircle2 size={14} />}
                                            Approve KYC
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Document Display Area */}
                            <div className="flex-1 p-8 grid grid-cols-1 md:grid-cols-2 gap-8 overflow-y-auto">
                                <div className="space-y-6">
                                    <div>
                                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3.5 pl-0.5">Document Images</p>
                                        <div className="grid grid-cols-1 gap-4">
                                            {/* Front Image */}
                                            {selectedRequest.frontImageUrl && (
                                                <div className="space-y-2">
                                                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider pl-0.5">Front View</span>
                                                    <a href={selectedRequest.frontImageUrl} target="_blank" rel="noopener noreferrer" className="group block">
                                                        <div className="aspect-[1.6/1] bg-[#07090E] rounded-2xl border border-[#1E2533] flex items-center justify-center group-hover:border-primary-orange/50 transition-all overflow-hidden relative shadow-inner">
                                                            <img
                                                                src={selectedRequest.frontImageUrl}
                                                                alt="Front Document"
                                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                                                onError={(e: any) => e.target.src = '/placeholder-error.png'}
                                                            />
                                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                                <ExternalLink className="text-white" size={20} />
                                                            </div>
                                                        </div>
                                                    </a>
                                                </div>
                                            )}
 
                                            {/* Back Image (Optional) */}
                                            {selectedRequest.backImageUrl ? (
                                                <div className="space-y-2">
                                                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider pl-0.5">Back View</span>
                                                    <a href={selectedRequest.backImageUrl} target="_blank" rel="noopener noreferrer" className="group block">
                                                        <div className="aspect-[1.6/1] bg-[#07090E] rounded-2xl border border-[#1E2533] flex items-center justify-center group-hover:border-primary-orange/50 transition-all overflow-hidden relative shadow-inner">
                                                            <img
                                                                src={selectedRequest.backImageUrl}
                                                                alt="Back Document"
                                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                                            />
                                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                                <ExternalLink className="text-white" size={20} />
                                                            </div>
                                                        </div>
                                                    </a>
                                                </div>
                                            ) : selectedRequest.documentType !== 'PASSPORT' && (
                                                <div className="p-4 bg-amber-500/5 border border-amber-500/10 rounded-xl flex items-center gap-3">
                                                    <AlertCircle size={16} className="text-amber-500 animate-pulse" />
                                                    <p className="text-[9px] text-amber-400 font-black uppercase tracking-widest">Back image missing</p>
                                                </div>
                                            )}

                                            {/* Warning if front is also missing */}
                                            {!selectedRequest.frontImageUrl && (
                                                <div className="p-6 bg-white/[0.01] border border-dashed border-white/10 rounded-2xl text-center">
                                                    <AlertCircle className="mx-auto text-rose-500/50 mb-2" size={28} />
                                                    <p className="text-xs text-rose-400 font-bold uppercase tracking-wider">Image upload failed or missing</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-8">
                                    <div className="bg-[#07090E]/40 border border-[#1E2533] rounded-2xl p-6 space-y-5 shadow-inner">
                                        <h4 className="text-white font-bold text-xs uppercase tracking-wider border-b border-[#1E2533] pb-3">User Verification Data</h4>
                                        <MetaField label="Full Name" value={selectedRequest.userId.fullName || 'Not Provided'} match={!!selectedRequest.userId.fullName} />
                                        <MetaField label="Email" value={selectedRequest.userId.email} match={true} />
                                        <MetaField label="Username" value={`@${selectedRequest.userId.username}`} match={true} />
                                        <MetaField label="Nationality" value={selectedRequest.nationality || 'Not Provided'} match={!!selectedRequest.nationality} />
                                        <MetaField label="ID Number" value={selectedRequest.documentNumber} match={true} />

                                        {selectedRequest.rejectionReason && (
                                            <div className="mt-4 p-3 bg-rose-500/5 border border-rose-500/10 rounded-xl flex items-start gap-3">
                                                <AlertTriangle size={16} className="text-rose-400 shrink-0 mt-0.5" />
                                                <p className="text-[11px] text-rose-300 font-medium leading-relaxed">
                                                    Rejected: {selectedRequest.rejectionReason}
                                                </p>
                                            </div>
                                        )}
                                    </div>

                                    {selectedRequest.selfieImageUrl && (
                                        <div>
                                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 pl-0.5">Liveness Selfie</p>
                                            <a href={selectedRequest.selfieImageUrl} target="_blank" rel="noopener noreferrer" className="block w-48 h-48 bg-[#07090E] rounded-2xl border border-dashed border-[#1E2533] flex items-center justify-center group hover:border-primary-orange/50 transition-all overflow-hidden relative shadow-inner">
                                                <img src={selectedRequest.selfieImageUrl} alt="Liveness Selfie" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                    <ExternalLink className="text-white" size={18} />
                                                </div>
                                            </a>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="h-full bg-white/[0.01] border-2 border-dashed border-white/5 rounded-3xl flex flex-col items-center justify-center p-12 text-center opacity-65 backdrop-blur-sm min-h-[600px]">
                            <ShieldCheck size={56} className="text-slate-800 mb-6 filter drop-shadow-[0_0_8px_rgba(255,122,0,0.1)]" />
                            <h3 className="text-base font-bold text-slate-400 uppercase tracking-wider">Select a request to review</h3>
                            <p className="text-slate-600 max-w-xs mt-2.5 text-xs leading-relaxed font-medium">Identity documents will appear here for verification once a user is selected from the queue.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function KycListItem({ name, email, type, time, active, onClick, status }: any) {
    const statusColor = status === 'APPROVED' ? 'text-emerald-400' :
        status === 'PENDING' ? 'text-primary-orange' :
            'text-rose-400';

    return (
        <div
            onClick={onClick}
            className={`p-4 border rounded-2xl transition-all cursor-pointer group flex items-center justify-between ${active ? 'border-primary-orange bg-primary-orange-light shadow-lg shadow-primary-orange/5 scale-[1.02]' : 'border-[#1E2533] bg-[#0D1017]/60 hover:border-[#1E2533] hover:bg-[#0D1017]/80'}`}
        >
            <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all shadow-inner uppercase font-black text-xs ${active ? 'bg-primary-orange text-white' : 'bg-[#07090E] text-slate-500 border border-[#1E2533] group-hover:scale-105'}`}>
                    {name[0]}
                </div>
                <div className="min-w-0">
                    <h4 className="text-sm font-bold text-white tracking-tight capitalize leading-none mb-1.5">{name}</h4>
                    <p className="text-[10px] text-slate-500 font-medium truncate w-32">{email}</p>
                </div>
            </div>
            <div className="text-right shrink-0">
                <div className={`text-[9px] font-black uppercase tracking-widest ${statusColor}`}>{status}</div>
                <div className="mt-2 flex items-center justify-end gap-1 text-[9px] font-black text-slate-600 uppercase tracking-tighter">
                    {type}
                    {active && <ChevronRight size={10} className="text-primary-orange animate-pulse" />}
                </div>
            </div>
        </div>
    );
}

function MetaField({ label, value, match }: any) {
    return (
        <div className="flex items-center justify-between py-1 border-b border-[#1E2533]/50">
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
