import React from 'react';
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
    Filter
} from 'lucide-react';

export default function KycPage() {
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
                        <button className="px-4 py-1.5 text-xs font-bold bg-indigo-600 text-white rounded-lg shadow-sm">Pending (14)</button>
                        <button className="px-4 py-1.5 text-xs font-bold text-slate-400 hover:text-white transition-colors">History</button>
                    </div>
                    <button className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-700 transition-all">
                        <Filter size={18} />
                    </button>
                </div>
            </div>

            {/* Main Grid: List and Detail Viewer (Hidden by default for demo) */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">

                {/* Left Column: List of Pending Requests */}
                <div className="xl:col-span-1 space-y-4">
                    <KycListItem
                        name="Alice Wambui"
                        email="alice.w@outlook.com"
                        type="National ID"
                        time="20 mins ago"
                        priority="High"
                        active={true}
                    />
                    <KycListItem
                        name="David Mwangi"
                        email="davidm@gmail.com"
                        type="Passport"
                        time="2 hours ago"
                        priority="Normal"
                    />
                    <KycListItem
                        name="Sarah Atieno"
                        email="sarah.a@swiftpay.ke"
                        type="National ID"
                        time="5 hours ago"
                        priority="Normal"
                    />
                    <KycListItem
                        name="Kennedy Kiprop"
                        email="ken@kenya.co.ke"
                        type="National ID"
                        time="Yesterday"
                        priority="Low"
                    />
                </div>

                {/* Right Column: Detail Document Viewer */}
                <div className="xl:col-span-2 space-y-6">
                    <div className="bg-slate-900/50 border border-slate-800 rounded-3xl backdrop-blur-sm overflow-hidden flex flex-col min-h-[600px]">
                        {/* Card Header */}
                        <div className="p-6 border-b border-slate-800 bg-slate-800/20 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center font-bold text-lg">AW</div>
                                <div>
                                    <h3 className="text-lg font-bold text-white">Alice Wambui</h3>
                                    <div className="flex items-center gap-2 mt-0.5">
                                        <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">ID: 5920-AW-2024</span>
                                        <div className="w-1 h-1 rounded-full bg-slate-700" />
                                        <span className="text-xs text-indigo-400 font-bold uppercase tracking-widest">National ID</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <button className="flex items-center gap-2 px-4 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 font-bold text-sm rounded-xl border border-rose-500/20 transition-all">
                                    <XCircle size={16} />
                                    Reject
                                </button>
                                <button className="flex items-center gap-2 px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-emerald-600/20 transition-all">
                                    <CheckCircle2 size={16} />
                                    Approve KYC
                                </button>
                            </div>
                        </div>

                        {/* Document Display Area */}
                        <div className="flex-1 p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* ID Documents */}
                            <div className="space-y-6">
                                <div>
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Document Front</p>
                                    <div className="aspect-[1.6/1] bg-slate-800 rounded-2xl border-2 border-dashed border-slate-700 flex items-center justify-center group cursor-pointer hover:border-indigo-500/50 transition-all">
                                        <div className="text-center group-hover:scale-110 transition-transform">
                                            <FileText size={48} className="text-slate-600 mx-auto mb-2" />
                                            <p className="text-xs text-slate-500 font-medium">Front_ID_Alice.jpg</p>
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Document Back</p>
                                    <div className="aspect-[1.6/1] bg-slate-800 rounded-2xl border-2 border-dashed border-slate-700 flex items-center justify-center group cursor-pointer hover:border-indigo-500/50 transition-all">
                                        <div className="text-center group-hover:scale-110 transition-transform">
                                            <FileText size={48} className="text-slate-600 mx-auto mb-2" />
                                            <p className="text-xs text-slate-500 font-medium">Back_ID_Alice.jpg</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Info & Selfie */}
                            <div className="space-y-8">
                                <div className="bg-slate-950/40 border border-slate-800 rounded-2xl p-6 space-y-6">
                                    <h4 className="text-white font-bold text-sm border-b border-slate-800 pb-3">Metadata Matching</h4>
                                    <MetaField label="Full Name" value="Alice Wambui Maina" match={true} />
                                    <MetaField label="Date of Birth" value="14 July 1992" match={true} />
                                    <MetaField label="ID Number" value="29405822" match={false} />
                                    <MetaField label="Country" value="Kenya" match={true} />

                                    <div className="mt-4 p-3 bg-rose-500/5 border border-rose-500/20 rounded-xl flex items-start gap-3">
                                        <AlertTriangle size={16} className="text-rose-400 shrink-0 mt-0.5" />
                                        <p className="text-[11px] text-rose-300 font-medium leading-relaxed">
                                            ID Number mismatch: System found '29405822' on card text, but profile has '29405821'. Please verify manually.
                                        </p>
                                    </div>
                                </div>

                                <div>
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Liveness Selfie</p>
                                    <div className="aspect-square bg-slate-800 rounded-2xl border-2 border-dashed border-slate-700 flex items-center justify-center group cursor-pointer hover:border-indigo-500/50 transition-all overflow-hidden relative">
                                        <div className="text-center group-hover:scale-110 transition-transform z-10">
                                            <User size={48} className="text-slate-600 mx-auto mb-2" />
                                            <p className="text-xs text-slate-500 font-medium">Selfie_Verified.jpg</p>
                                        </div>
                                        {/* Shimmer effect for "scanning" feel */}
                                        <div className="absolute inset-0 bg-gradient-to-t from-indigo-500/10 via-transparent to-transparent pointer-events-none" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Card Footer Actions */}
                        <div className="p-6 border-t border-slate-800 bg-slate-800/10">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 text-xs text-slate-500">
                                    <Clock size={14} />
                                    First seen: March 1st, 2024 at 10:45 AM
                                </div>
                                <button className="text-xs font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1.5 uppercase tracking-widest">
                                    View Submission History <ExternalLink size={12} />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function KycListItem({ name, email, type, time, priority, active }: any) {
    const priorityColor = priority === 'High' ? 'text-rose-400' :
        priority === 'Normal' ? 'text-indigo-400' :
            'text-slate-400';

    return (
        <div className={`p-4 bg-slate-900 border rounded-2xl transition-all cursor-pointer group flex items-center justify-between ${active ? 'border-indigo-500 bg-indigo-500/5 shadow-lg shadow-indigo-500/10' : 'border-slate-800 hover:border-slate-700'}`}>
            <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${active ? 'bg-indigo-500 text-white' : 'bg-slate-800 text-slate-500 group-hover:scale-105'}`}>
                    <User size={20} />
                </div>
                <div>
                    <h4 className="text-sm font-bold text-white tracking-tight">{name}</h4>
                    <p className="text-[11px] text-slate-500 font-medium">{email}</p>
                </div>
            </div>
            <div className="text-right">
                <div className={`text-[10px] font-bold uppercase tracking-widest ${priorityColor}`}>{time}</div>
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
            <div className="flex items-center gap-2">
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
