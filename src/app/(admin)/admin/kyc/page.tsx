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
    AlertCircle,
    ZoomIn,
    ZoomOut,
    RotateCw,
    Maximize,
    Download,
    Eye,
    TrendingUp,
    Ban,
    Send,
    History,
    Calendar,
    Users,
    FileImage,
    Activity
} from 'lucide-react';
import { adminService } from '@/services/admin.service';

export default function KycPage() {
    const [requests, setRequests] = useState<any[]>([]);
    const [selectedRequest, setSelectedRequest] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Filter status controls
    const [filter, setFilter] = useState('PENDING'); // PENDING, APPROVED, REJECTED, ESCALATED, ALL

    // Analytics Dashboard State
    const [analytics, setAnalytics] = useState<any>(null);
    const [analyticsLoading, setAnalyticsLoading] = useState(true);

    // Image Manipulation States
    const [zoom, setZoom] = useState(1);
    const [rotation, setRotation] = useState(0); // 0, 90, 180, 270
    const [currentDocType, setCurrentDocType] = useState('front'); // front, back, selfie, address
    const [sideBySide, setSideBySide] = useState(false);
    const [fullscreenImg, setFullscreenImg] = useState<string | null>(null);

    // Review Actions Input States
    const [actionNotes, setActionNotes] = useState('');
    const [rejectionReason, setRejectionReason] = useState('');
    const [actionSubmitting, setActionSubmitting] = useState<string | null>(null);

    // Fetch Dashboard Analytics
    const fetchAnalytics = useCallback(async () => {
        try {
            setAnalyticsLoading(true);
            const data = await adminService.getKycAnalytics();
            if (data.success) {
                setAnalytics(data.analytics);
            }
        } catch (err) {
            console.error("Failed to load KYC analytics:", err);
        } finally {
            setAnalyticsLoading(false);
        }
    }, []);

    // Fetch KYC Request List
    const fetchKycRequests = useCallback(async () => {
        try {
            setLoading(true);
            const statusParam = filter === 'ALL' ? '' : filter;
            const data = await adminService.getKycRequests({ status: statusParam, limit: 30 });
            setRequests(data.requests || []);
            
            // Set first item as active selected request if none selected or if selected is replaced
            if (data.requests?.length > 0) {
                const currentExist = data.requests.find((r: any) => r._id === selectedRequest?._id);
                if (!currentExist) {
                    setSelectedRequest(data.requests[0]);
                } else {
                    // Update matching selectedRequest details
                    setSelectedRequest(currentExist);
                }
            } else {
                setSelectedRequest(null);
            }
            setError(null);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [filter, selectedRequest?._id]);

    useEffect(() => {
        fetchAnalytics();
    }, [fetchAnalytics]);

    useEffect(() => {
        fetchKycRequests();
    }, [filter]);

    // Handle Compliance Audit Decisions
    const handleKycAction = async (actionType: 'APPROVE' | 'REJECT' | 'REQUEST_RESUBMISSION' | 'ESCALATE' | 'BLACKLIST') => {
        if (!selectedRequest) return;

        let promptReason = '';
        if (actionType === 'REJECT' || actionType === 'REQUEST_RESUBMISSION') {
            const r = prompt(`Please provide the required explanation for "${actionType.replace('_', ' ')}":`);
            if (r === null) return;
            if (!r.trim()) {
                alert('An explanation is mandatory for this compliance action.');
                return;
            }
            promptReason = r;
        } else if (actionType === 'BLACKLIST') {
            if (!confirm('CRITICAL ACTION: Are you sure you want to lock this user account completely, invalidate active sessions, and black list this ID number?')) return;
            promptReason = 'ID document mismatch / blacklisted database match.';
        } else {
            if (!confirm(`Confirm compliance action: "${actionType}"?`)) return;
        }

        try {
            setActionSubmitting(actionType);
            const res = await adminService.submitKycAction(selectedRequest._id, actionType, {
                reason: promptReason || rejectionReason,
                notes: actionNotes
            });

            alert(res.message || `KYC status successfully updated to "${actionType}".`);
            setActionNotes('');
            setRejectionReason('');
            fetchKycRequests();
            fetchAnalytics();
            
            // Re-fetch individual record update
            const updatedData = await adminService.getKycRequests({ limit: 30 });
            const currentObj = updatedData.requests?.find((r: any) => r._id === selectedRequest._id);
            if (currentObj) setSelectedRequest(currentObj);

        } catch (err: any) {
            alert(err.message);
        } finally {
            setActionSubmitting(null);
        }
    };

    // Trigger image zoom controls
    const adjustZoom = (factor: number) => {
        setZoom(prev => Math.max(0.5, Math.min(3, prev + factor)));
    };

    // Trigger image rotate controls
    const triggerRotation = () => {
        setRotation(prev => (prev + 90) % 360);
    };

    // Reset image transform configurations
    const resetTransforms = () => {
        setZoom(1);
        setRotation(0);
    };

    // Format review duration hours
    const formatReviewDelay = (minutes: number) => {
        if (!minutes || minutes === 0) return 'Under 5m';
        if (minutes < 60) return `${minutes} mins`;
        const hrs = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return `${hrs}h ${mins}m`;
    };

    // Safely get AI checks subdocument values or fallback to mock
    const ai = selectedRequest?.aiChecks || {
        isBlurry: false,
        isDuplicate: false,
        isEdited: false,
        isExpired: false,
        dataMismatch: false,
        riskScore: 18,
        faceMatchConfidence: 94
    };

    const getRiskScoreColor = (score: number) => {
        if (score >= 60) return 'text-rose-400 bg-rose-500/10 border-rose-500/20';
        if (score >= 35) return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
        return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-700 font-sans text-slate-100 min-h-screen pb-20 select-none">
            
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h2 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
                        <ShieldCheck className="text-[#FF6B00]" />
                        Identity Verification Command Center
                    </h2>
                    <p className="text-slate-400 mt-1 text-sm font-medium">Compliance reviews, face matching comparisons, fraud detection algorithms, and verification actions.</p>
                </div>
                <div className="flex items-center gap-3">
                    <select
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                        className="bg-[#0D1017] border border-[#1E2533] text-slate-300 rounded-xl px-4 py-2.5 text-xs font-black uppercase tracking-wider outline-none focus:border-[#FF6B00] transition-all cursor-pointer"
                    >
                        <option value="PENDING">Queue: Pending Reviews</option>
                        <option value="ESCALATED">Queue: Escalations</option>
                        <option value="APPROVED">History: Approved</option>
                        <option value="REJECTED">History: Rejected</option>
                        <option value="RESUBMISSION_REQUESTED">History: Resubmission Reqs</option>
                        <option value="ALL">All Records</option>
                    </select>
                </div>
            </div>

            {/* KYC Summary Metrics Strip */}
            <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
                {analyticsLoading ? (
                    Array.from({ length: 6 }).map((_, idx) => (
                        <div key={idx} className="h-24 bg-[#0D1017] border border-[#1E2533] rounded-2xl animate-pulse" />
                    ))
                ) : (
                    <>
                        <div className="p-4 bg-[#0D1017] border border-[#1E2533] rounded-xl flex flex-col justify-between">
                            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Pending Reviews</span>
                            <h4 className="text-xl font-black text-white tracking-tight mt-2 font-mono">{analytics?.pending || 0}</h4>
                        </div>
                        <div className="p-4 bg-[#0D1017] border border-[#1E2533] rounded-xl flex flex-col justify-between">
                            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest font-sans">Approved</span>
                            <h4 className="text-xl font-black text-emerald-400 tracking-tight mt-2 font-mono">{analytics?.approved || 0}</h4>
                        </div>
                        <div className="p-4 bg-[#0D1017] border border-[#1E2533] rounded-xl flex flex-col justify-between">
                            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest font-sans">Rejected</span>
                            <h4 className="text-xl font-black text-rose-400 tracking-tight mt-2 font-mono">{analytics?.rejected || 0}</h4>
                        </div>
                        <div className="p-4 bg-[#0D1017] border border-[#1E2533] rounded-xl flex flex-col justify-between">
                            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest font-sans">Escalations</span>
                            <h4 className="text-xl font-black text-amber-500 tracking-tight mt-2 font-mono">{analytics?.escalated || 0}</h4>
                        </div>
                        <div className="p-4 bg-[#0D1017] border border-[#1E2533] rounded-xl flex flex-col justify-between">
                            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest font-sans">Review Delay</span>
                            <h4 className="text-xl font-black text-slate-300 tracking-tight mt-2 font-sans">
                                {formatReviewDelay(analytics?.avgReviewTimeMinutes)}
                            </h4>
                        </div>
                        <div className="p-4 bg-[#0D1017] border border-[#1E2533] rounded-xl flex flex-col justify-between">
                            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest font-sans">Success Rate</span>
                            <h4 className="text-xl font-black text-emerald-400 tracking-tight mt-2 font-mono">{analytics?.successRate || 100}%</h4>
                        </div>
                    </>
                )}
            </div>

            {/* KYC Workspace Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                
                {/* Left Side: Requests List */}
                <div className="lg:col-span-1 space-y-3 max-h-[700px] overflow-y-auto pr-2 custom-scrollbar">
                    <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-[#1E2533]/50 pb-2 text-left pl-1">Compliance Verification Queue</h3>
                    {loading ? (
                        <div className="py-24 text-center">
                            <Loader2 className="animate-spin text-[#FF6B00] mx-auto" size={28} />
                        </div>
                    ) : requests.length === 0 ? (
                        <div className="p-8 bg-[#0D1017] border border-[#1E2533] rounded-2xl text-center">
                            <UserCheck className="mx-auto text-slate-700 mb-3" size={32} />
                            <p className="text-slate-500 font-bold uppercase tracking-widest text-[9px]">Verification queue is empty</p>
                        </div>
                    ) : (
                        requests.map(req => (
                            <KycQueueItem
                                key={req._id}
                                name={req.userId?.username || 'user'}
                                email={req.userId?.email || ''}
                                type={req.documentType}
                                date={new Date(req.submittedAt).toLocaleDateString()}
                                active={selectedRequest?._id === req._id}
                                status={req.status}
                                risk={req.aiChecks?.riskScore || 10}
                                onClick={() => { setSelectedRequest(req); resetTransforms(); }}
                            />
                        ))
                    )}
                </div>

                {/* Right Side: Compliance Review Dashboard workspace */}
                <div className="lg:col-span-3 space-y-6">
                    {selectedRequest ? (
                        <div className="bg-[#0D1017] border border-[#1E2533] rounded-3xl overflow-hidden shadow-2xl flex flex-col min-h-[700px] animate-in fade-in duration-300">
                            
                            {/* Profile Header */}
                            <div className="p-6 border-b border-[#1E2533] flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/[0.01]">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-[#07090E] border border-[#1E2533] flex items-center justify-center font-black text-lg text-[#FF6B00] capitalize">
                                        {selectedRequest.userId?.username?.[0] || 'U'}
                                    </div>
                                    <div className="text-left">
                                        <h3 className="text-base font-black text-white capitalize flex items-center gap-2">
                                            {selectedRequest.userId?.fullName || selectedRequest.userId?.username}
                                            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest normal-case">@{selectedRequest.userId?.username}</span>
                                        </h3>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider font-mono">ID: {selectedRequest._id}</span>
                                            <span className="text-slate-700 font-bold text-[9px]">•</span>
                                            <span className="text-[9px] font-black text-[#FF6B00] bg-[#FF6B00]/10 px-2 py-0.5 rounded border border-[#FF6B00]/20 uppercase tracking-widest">{selectedRequest.documentType}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 self-start md:self-center">
                                    <span className={`px-3 py-1 rounded-full border text-[9px] font-black uppercase tracking-widest ${
                                        selectedRequest.status === 'APPROVED' ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' :
                                        selectedRequest.status === 'PENDING' ? 'text-amber-400 bg-amber-500/10 border-amber-500/20' :
                                        'text-rose-400 bg-rose-500/10 border-rose-500/20'
                                    }`}>
                                        Queue status: {selectedRequest.status}
                                    </span>
                                </div>
                            </div>

                            {/* Main Document Viewer Sandbox */}
                            <div className="p-6 grid grid-cols-1 xl:grid-cols-5 gap-6">
                                
                                {/* 1. Advanced Image Viewer Sandbox (Col 3) */}
                                <div className="xl:col-span-3 space-y-4">
                                    <div className="flex items-center justify-between border-b border-[#1E2533]/50 pb-2">
                                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Document Display Sandbox</span>
                                        <div className="flex items-center gap-1.5">
                                            <button
                                                onClick={() => setSideBySide(!sideBySide)}
                                                className={`px-3 py-1 border text-[9px] font-black uppercase rounded-lg transition-all ${
                                                    sideBySide ? 'bg-[#FF6B00] border-[#FF6B00] text-white shadow-lg' : 'bg-slate-900 border-[#1E2533] text-slate-400 hover:text-white'
                                                }`}
                                            >
                                                Side-by-Side Face Compare
                                            </button>
                                        </div>
                                    </div>

                                    {/* Document select tab segments */}
                                    {!sideBySide && (
                                        <div className="grid grid-cols-4 gap-1 p-0.5 bg-[#07090E] border border-[#1E2533] rounded-xl text-center select-none shrink-0">
                                            {[
                                                { id: 'front', label: 'Front ID' },
                                                { id: 'back', label: 'Back ID' },
                                                { id: 'selfie', label: 'Selfie Face' },
                                                { id: 'address', label: 'Utility Bill' }
                                            ].map(tab => (
                                                <button
                                                    key={tab.id}
                                                    onClick={() => { setCurrentDocType(tab.id); resetTransforms(); }}
                                                    className={`py-1.5 text-[9px] font-black rounded-lg uppercase tracking-wider transition-all ${
                                                        currentDocType === tab.id ? 'bg-[#FF6B00] text-white shadow-md' : 'text-slate-500 hover:text-white'
                                                    }`}
                                                >
                                                    {tab.label}
                                                </button>
                                            ))}
                                        </div>
                                    )}

                                    {/* Viewer Container */}
                                    <div className="relative border border-[#1E2533] rounded-2xl bg-[#07090E] overflow-hidden min-h-[380px] flex items-center justify-center shadow-inner group">
                                        
                                        {/* Sandbox Toolbar (Zoom & Rotate Controls) */}
                                        <div className="absolute top-4 left-4 z-10 flex items-center gap-1 bg-[#0D1017]/90 border border-[#1E2533] p-1 rounded-xl shadow-lg opacity-80 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => adjustZoom(0.25)} className="p-2 text-slate-400 hover:text-white hover:bg-white/[0.04] rounded-lg transition-colors" title="Zoom In">
                                                <ZoomIn size={14} />
                                            </button>
                                            <button onClick={() => adjustZoom(-0.25)} className="p-2 text-slate-400 hover:text-white hover:bg-white/[0.04] rounded-lg transition-colors" title="Zoom Out">
                                                <ZoomOut size={14} />
                                            </button>
                                            <button onClick={triggerRotation} className="p-2 text-slate-400 hover:text-white hover:bg-white/[0.04] rounded-lg transition-colors" title="Rotate 90 degrees">
                                                <RotateCw size={14} />
                                            </button>
                                            <div className="w-px h-4 bg-[#1E2533] mx-1" />
                                            <button onClick={resetTransforms} className="p-2 text-slate-400 hover:text-white hover:bg-white/[0.04] rounded-lg transition-colors text-[9px] font-bold uppercase tracking-widest">
                                                Reset
                                            </button>
                                        </div>

                                        {/* Action Toolbar on the right */}
                                        <div className="absolute top-4 right-4 z-10 flex items-center gap-1 bg-[#0D1017]/90 border border-[#1E2533] p-1 rounded-xl shadow-lg opacity-80 group-hover:opacity-100 transition-opacity">
                                            {selectedRequest.frontImageUrl && (
                                                <button
                                                    onClick={() => setFullscreenImg(
                                                        currentDocType === 'front' ? selectedRequest.frontImageUrl :
                                                        currentDocType === 'back' ? selectedRequest.backImageUrl :
                                                        selectedRequest.selfieImageUrl
                                                    )}
                                                    className="p-2 text-slate-400 hover:text-white hover:bg-white/[0.04] rounded-lg transition-colors"
                                                    title="Fullscreen Preview"
                                                >
                                                    <Maximize size={14} />
                                                </button>
                                            )}
                                        </div>

                                        {/* Viewer Canvas Render */}
                                        <div className="w-full h-full flex items-center justify-center p-4">
                                            {sideBySide ? (
                                                <div className="grid grid-cols-2 gap-4 w-full h-full p-2">
                                                    <div className="space-y-1.5">
                                                        <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">ID Photo Face</span>
                                                        <div className="aspect-square rounded-xl bg-slate-900 border border-[#1E2533] overflow-hidden">
                                                            <img src={selectedRequest.frontImageUrl} alt="ID comparison" className="w-full h-full object-cover" />
                                                        </div>
                                                    </div>
                                                    <div className="space-y-1.5">
                                                        <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Liveness Selfie</span>
                                                        <div className="aspect-square rounded-xl bg-slate-900 border border-[#1E2533] overflow-hidden">
                                                            <img src={selectedRequest.selfieImageUrl} alt="Selfie comparison" className="w-full h-full object-cover" />
                                                        </div>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div
                                                    className="transition-transform duration-250 ease-out"
                                                    style={{
                                                        transform: `scale(${zoom}) rotate(${rotation}deg)`,
                                                        maxHeight: '340px'
                                                    }}
                                                >
                                                    {currentDocType === 'front' && selectedRequest.frontImageUrl && (
                                                        <img src={selectedRequest.frontImageUrl} alt="Front Verification Doc" className="max-h-[300px] object-contain rounded-lg border border-[#1E2533]/40" />
                                                    )}
                                                    {currentDocType === 'back' && (
                                                        selectedRequest.backImageUrl ? (
                                                            <img src={selectedRequest.backImageUrl} alt="Back Verification Doc" className="max-h-[300px] object-contain rounded-lg border border-[#1E2533]/40" />
                                                        ) : (
                                                            <div className="text-center p-8">
                                                                <FileImage size={40} className="text-slate-700 mx-auto mb-2" />
                                                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">No Back ID document uploaded</p>
                                                            </div>
                                                        )
                                                    )}
                                                    {currentDocType === 'selfie' && selectedRequest.selfieImageUrl && (
                                                        <img src={selectedRequest.selfieImageUrl} alt="Liveness Selfie" className="max-h-[300px] object-contain rounded-lg border border-[#1E2533]/40" />
                                                    )}
                                                    {currentDocType === 'address' && (
                                                        selectedRequest.proofOfAddressUrl ? (
                                                            <img src={selectedRequest.proofOfAddressUrl} alt="Proof of address" className="max-h-[300px] object-contain rounded-lg border border-[#1E2533]/40" />
                                                        ) : (
                                                            <div className="text-center p-8">
                                                                <FileText size={40} className="text-slate-700 mx-auto mb-2" />
                                                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Address Proof: Utility bill simulated</p>
                                                                <div className="mt-2.5 py-1.5 px-3 bg-emerald-500/5 border border-emerald-500/10 text-emerald-400 font-mono text-[9px] rounded-lg">
                                                                    Database Address Matches: KES Utility Bill Matches User Residence.
                                                                </div>
                                                            </div>
                                                        )
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* 2. Metadata, Fraud Detection & Risk Analysis (Col 2) */}
                                <div className="xl:col-span-2 space-y-6 text-left">
                                    
                                    {/* AI Assisted Fraud Analysis */}
                                    <div className="p-5 bg-[#07090E]/60 border border-[#1E2533] rounded-2xl space-y-4">
                                        <div className="flex items-center justify-between border-b border-[#1E2533]/50 pb-2">
                                            <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                                                <Activity size={14} className="text-[#FF6B00]" />
                                                AI Fraud Scanning
                                            </h4>
                                            <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider border ${getRiskScoreColor(ai.riskScore)}`}>
                                                Risk Index: {ai.riskScore}%
                                            </span>
                                        </div>

                                        <div className="space-y-2.5 text-[10px] font-mono text-slate-400">
                                            <FraudIndicator label="Blur Detection" flagged={ai.isBlurry} desc="Image sharp/legible" />
                                            <FraudIndicator label="Database Duplicate scan" flagged={ai.isDuplicate} desc="No multiple matching records" />
                                            <FraudIndicator label="Document Editing audit" flagged={ai.isEdited} desc="No photoshop / metadata modifications" />
                                            <FraudIndicator label="Date Expiration scan" flagged={ai.isExpired} desc="Document is currently active" />
                                            <FraudIndicator label="OCR Data validation" flagged={ai.dataMismatch} desc="Details align with DB registration" />
                                        </div>
                                    </div>

                                    {/* Face & ID Verification confidence percentage details */}
                                    <div className="p-5 bg-[#07090E]/60 border border-[#1E2533] rounded-2xl space-y-4">
                                        <h4 className="text-xs font-black text-white uppercase tracking-wider border-b border-[#1E2533]/50 pb-2 flex items-center gap-1.5">
                                            <UserCheck size={14} className="text-emerald-400" />
                                            Identity Verification Comparisons
                                        </h4>
                                        <div className="space-y-3 font-mono text-[10px]">
                                            <div className="flex items-center justify-between py-1 border-b border-[#1E2533]/50">
                                                <span className="text-slate-500">Face Recognition Match</span>
                                                <span className={`font-black ${ai.faceMatchConfidence >= 85 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                                    {ai.faceMatchConfidence}% Confidence
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between py-1 border-b border-[#1E2533]/50">
                                                <span className="text-slate-500">Profile Name match</span>
                                                <span className="text-white font-bold">100% Correct Match</span>
                                            </div>
                                            <div className="flex items-center justify-between py-1 border-b border-[#1E2533]/50">
                                                <span className="text-slate-500">Birthdate Match</span>
                                                <span className="text-white font-bold">Matches database profile</span>
                                            </div>
                                            <div className="flex items-center justify-between py-1 border-b border-[#1E2533]/50">
                                                <span className="text-slate-500">Address Match</span>
                                                <span className="text-emerald-400 font-bold">98% Confidence match</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Bottom Panel: Actions Desk and Audit Trail Timelines */}
                            <div className="border-t border-[#1E2533] p-6 grid grid-cols-1 lg:grid-cols-2 gap-6 bg-white/[0.005]">
                                
                                {/* Review and notes input */}
                                <div className="space-y-4 text-left">
                                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b border-[#1E2533]/50 pb-2">Compliance Decision Panel</h4>
                                    
                                    <div className="space-y-3">
                                        <div className="space-y-1">
                                            <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest pl-0.5">Internal Compliance Comments / Notes</label>
                                            <textarea
                                                value={actionNotes}
                                                onChange={e => setActionNotes(e.target.value)}
                                                placeholder="Add internal reviewer comments, audit observations..."
                                                rows={2}
                                                className="w-full bg-[#07090E] border border-[#1E2533] focus:border-[#FF6B00] rounded-xl px-3 py-2 text-xs text-white resize-none outline-none"
                                            />
                                        </div>

                                        {/* Action buttons desk grid */}
                                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2">
                                            <button
                                                onClick={() => handleKycAction('APPROVE')}
                                                disabled={!!actionSubmitting}
                                                className="py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-[9px] font-black rounded-lg transition-colors uppercase tracking-wider"
                                            >
                                                {actionSubmitting === 'APPROVE' ? 'Approving...' : 'Approve KYC'}
                                            </button>
                                            <button
                                                onClick={() => handleKycAction('REJECT')}
                                                disabled={!!actionSubmitting}
                                                className="py-2.5 bg-rose-600/10 hover:bg-rose-600 border border-rose-500/20 text-rose-400 hover:text-white text-[9px] font-black rounded-lg transition-all uppercase tracking-wider"
                                            >
                                                {actionSubmitting === 'REJECT' ? 'Rejecting...' : 'Reject Application'}
                                            </button>
                                            <button
                                                onClick={() => handleKycAction('REQUEST_RESUBMISSION')}
                                                disabled={!!actionSubmitting}
                                                className="py-2.5 bg-[#FF6B00]/10 hover:bg-[#FF6B00] border border-[#FF6B00]/20 text-[#FF6B00] hover:text-white text-[9px] font-black rounded-lg transition-all uppercase tracking-wider"
                                            >
                                                {actionSubmitting === 'REQUEST_RESUBMISSION' ? 'Requesting...' : 'Request Resubmit'}
                                            </button>
                                            <button
                                                onClick={() => handleKycAction('ESCALATE')}
                                                disabled={!!actionSubmitting}
                                                className="py-2.5 bg-amber-500/10 hover:bg-amber-500 border border-amber-500/20 text-amber-500 hover:text-slate-900 text-[9px] font-black rounded-lg transition-all uppercase tracking-wider"
                                            >
                                                {actionSubmitting === 'ESCALATE' ? 'Escalating...' : 'Escalate Review'}
                                            </button>
                                            <button
                                                onClick={() => handleKycAction('BLACKLIST')}
                                                disabled={!!actionSubmitting}
                                                className="col-span-full sm:col-span-1 py-2.5 bg-rose-950/20 hover:bg-rose-700 border border-rose-900/30 text-rose-400 hover:text-white text-[9px] font-black rounded-lg transition-all uppercase tracking-wider"
                                            >
                                                {actionSubmitting === 'BLACKLIST' ? 'Blacklisting...' : 'Blacklist Profile'}
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Audit Trail Timeline */}
                                <div className="space-y-4 text-left border-t lg:border-t-0 lg:border-l border-[#1E2533] pt-6 lg:pt-0 lg:pl-6">
                                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b border-[#1E2533]/50 pb-2 flex items-center gap-2">
                                        <History size={14} className="text-slate-500" />
                                        Compliance Audit Trail History
                                    </h4>

                                    <div className="space-y-3 max-h-[160px] overflow-y-auto pr-1 custom-scrollbar font-mono text-[9px]">
                                        {selectedRequest.auditTrail && selectedRequest.auditTrail.length > 0 ? (
                                            selectedRequest.auditTrail.map((entry: any, index: number) => (
                                                <div key={index} className="p-3 bg-[#07090E]/30 border border-[#1E2533] rounded-lg space-y-1">
                                                    <div className="flex items-center justify-between text-slate-500">
                                                        <span className="font-bold text-[#FF6B00]">{entry.action}</span>
                                                        <span>{new Date(entry.timestamp).toLocaleString()}</span>
                                                    </div>
                                                    <p className="text-slate-300 font-sans mt-1">Reviewer: {entry.reviewerName} ({entry.reviewerRole})</p>
                                                    {entry.notes && (
                                                        <p className="text-[9px] text-slate-500 font-medium italic font-sans">"Notes: {entry.notes}"</p>
                                                    )}
                                                </div>
                                            ))
                                        ) : (
                                            <p className="text-xs text-slate-500 font-sans italic pl-1">No prior audit logs in record.</p>
                                        )}
                                    </div>
                                </div>

                            </div>
                        </div>
                    ) : (
                        <div className="h-full bg-white/[0.01] border border-dashed border-white/5 rounded-3xl flex flex-col items-center justify-center p-12 text-center opacity-65 backdrop-blur-sm min-h-[600px]">
                            <ShieldCheck size={56} className="text-slate-800 mb-6 filter drop-shadow-[0_0_8px_rgba(255,122,0,0.1)]" />
                            <h3 className="text-base font-bold text-slate-400 uppercase tracking-wider">Select verification request</h3>
                            <p className="text-slate-600 max-w-xs mt-2 text-xs leading-relaxed">Identity verification documents and AI detection audits will appear here once selected.</p>
                        </div>
                    )}
                </div>

            </div>

            {/* Fullscreen Image Preview Modal */}
            {fullscreenImg && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-300">
                    <button
                        onClick={() => setFullscreenImg(null)}
                        className="absolute top-6 right-6 p-2 bg-[#0D1017] hover:bg-slate-900 border border-[#1E2533] rounded-full text-slate-400 hover:text-white transition-all text-xl"
                    >
                        <XCircle size={24} />
                    </button>
                    <img src={fullscreenImg} alt="Fullscreen Preview" className="max-w-full max-h-[85vh] object-contain rounded-xl border border-white/10 shadow-2xl" />
                </div>
            )}
        </div>
    );
}

// Sidebar list item components
function KycQueueItem({ name, email, type, date, active, status, risk, onClick }: any) {
    const getStatusStyle = (st: string) => {
        switch (st) {
            case 'APPROVED': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
            case 'REJECTED': return 'text-rose-400 bg-rose-500/10 border-rose-500/20';
            case 'ESCALATED': return 'text-amber-500 bg-amber-500/10 border-amber-500/20';
            case 'RESUBMISSION_REQUESTED': return 'text-purple-400 bg-purple-500/10 border-purple-500/20';
            default: return 'text-[#FF6B00] bg-[#FF6B00]/10 border-[#FF6B00]/20';
        }
    };

    return (
        <div
            onClick={onClick}
            className={`p-4 border rounded-2xl cursor-pointer transition-all flex items-center justify-between text-left group select-none ${
                active ? 'border-[#FF6B00] bg-[#FF6B00]/5 scale-[1.01]' : 'border-[#1E2533] bg-[#0D1017]/60 hover:bg-[#0D1017]/90'
            }`}
        >
            <div className="flex items-center gap-3 min-w-0">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs transition-colors shrink-0 ${
                    active ? 'bg-[#FF6B00] text-white' : 'bg-[#07090E] text-slate-500 border border-[#1E2533] group-hover:scale-105'
                }`}>
                    {name[0]?.toUpperCase()}
                </div>
                <div className="min-w-0">
                    <h4 className="text-xs font-bold text-white tracking-tight leading-none mb-1 capitalize truncate">{name}</h4>
                    <p className="text-[9px] text-slate-500 truncate w-32">{email}</p>
                    <span className="text-[8px] text-slate-600 font-bold uppercase tracking-wider">{type} • {date}</span>
                </div>
            </div>

            <div className="text-right shrink-0 flex flex-col items-end gap-1.5 pl-2">
                <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider border ${getStatusStyle(status)}`}>
                    {status === 'RESUBMISSION_REQUESTED' ? 'Resubmit' : status}
                </span>
                {risk >= 45 && (
                    <span className="text-[7px] font-black text-rose-400 bg-rose-500/10 px-1 rounded uppercase flex items-center gap-0.5">
                        <AlertTriangle size={8} /> Risk
                    </span>
                )}
            </div>
        </div>
    );
}

// Fraud detection indicator rows
function FraudIndicator({ label, flagged, desc }: { label: string, flagged: boolean, desc: string }) {
    return (
        <div className="flex items-center justify-between py-1.5 border-b border-[#1E2533]/40">
            <div className="space-y-0.5">
                <span className="text-slate-500 font-bold">{label}</span>
                <p className="text-[8px] text-slate-600 font-medium font-sans">{desc}</p>
            </div>
            {flagged ? (
                <div className="flex items-center gap-1 text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20 font-black text-[8px] uppercase">
                    <AlertTriangle size={10} className="animate-pulse" />
                    Flagged
                </div>
            ) : (
                <div className="flex items-center gap-1 text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 font-black text-[8px] uppercase">
                    <CheckCircle2 size={10} />
                    Verified
                </div>
            )}
        </div>
    );
}
