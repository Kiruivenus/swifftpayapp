"use client";

import React, { useState, useEffect, useCallback } from 'react';
import {
    ShieldAlert,
    AlertTriangle,
    CheckCircle2,
    XCircle,
    Search,
    Filter,
    RefreshCcw,
    ChevronLeft,
    ChevronRight,
    Loader2,
    ArrowUpRight,
    ArrowDownRight,
    User,
    Cpu,
    Calendar,
    Wallet,
    Info,
    Check,
    X,
    MessageSquare,
    Undo,
    Eye
} from 'lucide-react';
import { adminService } from '@/services/admin.service';

export default function AdminDisputesPage() {
    // Core States
    const [loading, setLoading] = useState(true);
    const [txLoading, setTxLoading] = useState(true);
    const [transactions, setTransactions] = useState<any[]>([]);
    const [disputes, setDisputes] = useState<any[]>([]);
    
    // Filters & Pagination
    const [search, setSearch] = useState('');
    const [filters, setFilters] = useState({
        status: '',
        currency: '',
        page: 1,
        limit: 20
    });
    
    // Overlay / Detail States
    const [selectedTx, setSelectedTx] = useState<any | null>(null);
    const [senderProfile, setSenderProfile] = useState<any | null>(null);
    const [recipientProfile, setRecipientProfile] = useState<any | null>(null);
    const [senderIntel, setSenderIntel] = useState<any | null>(null);
    const [recipientIntel, setRecipientIntel] = useState<any | null>(null);
    const [detailLoading, setDetailLoading] = useState(false);
    
    // Decision / Confirm Modal States
    const [confirmModal, setConfirmModal] = useState<{
        show: boolean;
        action: 'HOLD' | 'REVERSE' | 'RESOLVE_FAVOR_RECEIVER';
        txId: string;
        amount: string;
        currency: string;
    } | null>(null);
    const [actionReason, setActionReason] = useState('');
    const [processingAction, setProcessingAction] = useState(false);
    const [blockConfirmModal, setBlockConfirmModal] = useState<{
        show: boolean;
        userId: string;
        username: string;
    } | null>(null);

    // Fetch the filterable transaction list
    const fetchDisputesList = useCallback(async () => {
        try {
            setTxLoading(true);
            // Fetch transactions (disputes are filtered client-side to ensure all flagged & held items show)
            const res = await adminService.getTransactions({
                q: search,
                page: filters.page,
                limit: filters.limit,
                currency: filters.currency,
                status: filters.status || undefined // If status is selected, let API filter it
            });
            
            const rawItems = res.items || [];
            
            // If status filter is empty, restrict results to disputed transactions (HOLD, ESCALATED, REVERSED, or isFlagged)
            const filtered = !filters.status 
                ? rawItems.filter((t: any) => t.isFlagged || ['HOLD', 'ESCALATED', 'REVERSED'].includes(t.status))
                : rawItems;

            setTransactions(filtered);
        } catch (err) {
            console.error('Failed to load disputes ledger:', err);
        } finally {
            setTxLoading(false);
            setLoading(false);
        }
    }, [search, filters]);

    useEffect(() => {
        const timer = setTimeout(() => fetchDisputesList(), 400);
        return () => clearTimeout(timer);
    }, [fetchDisputesList]);

    // Handle selecting a dispute to pull Fraud Intelligence data
    const handleSelectDispute = async (tx: any) => {
        setSelectedTx(tx);
        setSenderProfile(null);
        setRecipientProfile(null);
        setSenderIntel(null);
        setRecipientIntel(null);
        setDetailLoading(true);

        try {
            // Fetch detailed sender & recipient profile intelligence
            if (tx.senderId) {
                const sProfile = await adminService.getUserSummary(tx.senderId).catch(() => null);
                setSenderProfile(sProfile?.user || null);
                
                const sIntel = await adminService.getUserIntelligence(tx.senderId).catch(() => null);
                setSenderIntel(sIntel || null);
            }
            
            if (tx.recipientId) {
                const rProfile = await adminService.getUserSummary(tx.recipientId).catch(() => null);
                setRecipientProfile(rProfile?.user || null);

                const rIntel = await adminService.getUserIntelligence(tx.recipientId).catch(() => null);
                setRecipientIntel(rIntel || null);
            }
        } catch (err) {
            console.error('Failed to fetch profiles or intelligence details:', err);
        } finally {
            setDetailLoading(false);
        }
    };

    // Confirm Resolution Handler
    const triggerConfirmModal = (action: 'HOLD' | 'REVERSE' | 'RESOLVE_FAVOR_RECEIVER', tx: any) => {
        setConfirmModal({
            show: true,
            action,
            txId: tx._id || tx.id,
            amount: tx.amount.toLocaleString(),
            currency: tx.currency
        });
        setActionReason('');
    };

    const processAction = async () => {
        if (!confirmModal) return;
        const { action, txId } = confirmModal;

        if (!actionReason.trim() || actionReason.trim().length < 5) {
            alert('A detailed explanation is required to resolve this dispute (minimum 5 characters).');
            return;
        }

        try {
            setProcessingAction(true);
            const res = await adminService.submitTransactionAction(txId, action, actionReason);
            alert(res.message || 'Dispute action processed successfully.');
            
            // Clean up states
            setConfirmModal(null);
            setSelectedTx(null);
            fetchDisputesList();
        } catch (err: any) {
            alert(err.message || 'Operation failed.');
        } finally {
            setProcessingAction(false);
        }
    };

    const handleBlockUser = async () => {
        if (!blockConfirmModal) return;
        const { userId } = blockConfirmModal;

        try {
            setProcessingAction(true);
            // 1. Mark status as BLOCKED via admin user update API
            await adminService.updateUser(userId, { status: 'BLOCKED' });
            
            // 2. Force logout user sessions to revoke active tokens immediately
            await adminService.forceUserLogout(userId).catch(() => null);
            
            alert('The user account has been successfully BLOCKED and all sessions revoked.');
            setBlockConfirmModal(null);
            
            // Reload transaction profiles
            if (selectedTx) {
                handleSelectDispute(selectedTx);
            }
        } catch (err: any) {
            alert(err.message || 'Failed to complete user block action.');
        } finally {
            setProcessingAction(false);
        }
    };

    // Calculate executive KPIs
    const holdsCount = transactions.filter(t => t.status === 'HOLD').length;
    const reversedCount = transactions.filter(t => t.status === 'REVERSED').length;
    const flaggedCount = transactions.filter(t => t.isFlagged).length;

    return (
        <div className="space-y-8 animate-in fade-in duration-500 text-slate-100 font-sans max-w-[1600px] mx-auto pb-20">
            {/* Header section */}
            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 border-b border-[#1E2533] pb-6">
                <div>
                    <h2 className="text-3xl font-black text-white tracking-tight uppercase">Disputes & Fraud Operations</h2>
                    <p className="text-slate-400 mt-1 text-xs font-semibold uppercase tracking-widest">Inspect disputed peer-to-peer transfers, review fraud logs, and resolve wallet holds.</p>
                </div>
                <div>
                    <button 
                        onClick={fetchDisputesList}
                        className="flex items-center gap-2 px-6 py-2.5 bg-[#FF6B00] hover:bg-[#E05E00] text-white font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-[#FF6B00]/20"
                    >
                        <RefreshCcw size={14} />
                        Refresh Ledger
                    </button>
                </div>
            </div>

            {/* KPI Ribbon */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="bg-[#0B1020] border border-[#1A233A] rounded-2xl p-5">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Active Funds Held</span>
                    <h4 className="text-2xl font-black text-white mt-1">{holdsCount} Transactions</h4>
                    <p className="text-[10px] text-slate-400 mt-1">Pending administrative dispute review</p>
                </div>
                <div className="bg-[#0B1020] border border-[#1A233A] rounded-2xl p-5">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Total Resolved (Reversed)</span>
                    <h4 className="text-2xl font-black text-rose-400 mt-1">{reversedCount} Transactions</h4>
                    <p className="text-[10px] text-slate-400 mt-1">Refunded to original senders</p>
                </div>
                <div className="bg-[#0B1020] border border-[#1A233A] rounded-2xl p-5">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Flagged Risk Alerts</span>
                    <h4 className="text-2xl font-black text-amber-400 mt-1">{flaggedCount} Cases</h4>
                    <p className="text-[10px] text-slate-400 mt-1">Auto-flagged or user-reported disputes</p>
                </div>
            </div>

            {/* Split Screen Layout: Disputes Ledger + Intelligence Panel */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                
                {/* Ledger Panel (Left 2 Columns) */}
                <div className="xl:col-span-2 bg-[#0D1017]/80 border border-[#1E2533] rounded-3xl overflow-hidden shadow-2xl flex flex-col min-h-[600px]">
                    <div className="p-6 border-b border-[#1E2533] flex flex-col gap-4 bg-gradient-to-r from-white/[0.005] to-transparent">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <h3 className="text-base font-bold text-white uppercase tracking-wider">Disputed Transactions Ledger</h3>
                            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">
                                Loaded: {transactions.length} entries
                            </span>
                        </div>

                        {/* Search & Filters */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                            <div className="relative">
                                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
                                <input 
                                    type="text"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Search by TxID or User..."
                                    className="w-full pl-9 pr-4 py-2.5 bg-[#07090E] border border-[#1E2533] rounded-xl text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-[#FF6B00]"
                                />
                            </div>
                            
                            <select 
                                value={filters.status}
                                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value, page: 1 }))}
                                className="bg-[#07090E] border border-[#1E2533] text-slate-300 rounded-xl px-3 py-2.5 text-xs font-bold uppercase tracking-wider outline-none focus:border-[#FF6B00] cursor-pointer"
                            >
                                <option value="">Disputes Queue (All)</option>
                                <option value="HOLD">Held</option>
                                <option value="ESCALATED">Escalated</option>
                                <option value="REVERSED">Reversed</option>
                                <option value="SUCCESS">Success (Released)</option>
                            </select>

                            <select 
                                value={filters.currency}
                                onChange={(e) => setFilters(prev => ({ ...prev, currency: e.target.value, page: 1 }))}
                                className="bg-[#07090E] border border-[#1E2533] text-slate-300 rounded-xl px-3 py-2.5 text-xs font-bold uppercase tracking-wider outline-none focus:border-[#FF6B00] cursor-pointer"
                            >
                                <option value="">All Currencies</option>
                                <option value="KES">KES</option>
                                <option value="USDT">USDT</option>
                            </select>
                        </div>
                    </div>

                    <div className="overflow-x-auto flex-1">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-white/[0.01] text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-[#1E2533]">
                                    <th className="px-6 py-4">Transaction Details</th>
                                    <th className="px-6 py-4">Sender / Recipient</th>
                                    <th className="px-6 py-4">Disputed Amount</th>
                                    <th className="px-6 py-4">Dispute Reason</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#1E2533]">
                                {txLoading ? (
                                    <tr>
                                        <td colSpan={6} className="py-28 text-center">
                                            <Loader2 className="animate-spin text-[#FF6B00] mx-auto" size={32} />
                                        </td>
                                    </tr>
                                ) : transactions.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="py-28 text-center text-slate-500 text-xs font-black uppercase tracking-widest">
                                            No dispute records matched selection
                                        </td>
                                    </tr>
                                ) : transactions.map(tx => {
                                    const senderName = tx.userId?.username || 'Unknown';
                                    const receiverName = tx.recipientUsername || tx.recipientId || 'Unknown';
                                    
                                    return (
                                        <tr key={tx._id} className={`hover:bg-white/[0.01] transition-all duration-300 ${selectedTx?._id === tx._id ? 'bg-[#FF6B00]/[0.03]' : ''}`}>
                                            <td className="px-6 py-4">
                                                <div>
                                                    <p className="text-xs font-bold text-white font-mono">{tx._id.slice(-10)}</p>
                                                    <p className="text-[9px] text-slate-500 font-bold mt-1 font-mono">{new Date(tx.createdAt).toLocaleDateString()}</p>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-xs font-bold text-slate-300">
                                                    <span className="text-white">{senderName}</span>
                                                    <p className="text-[9px] text-slate-500 mt-0.5">Recipient: {receiverName}</p>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 font-mono text-xs font-bold text-white">
                                                {tx.currency} {tx.amount.toLocaleString()}
                                            </td>
                                            <td className="px-6 py-4 max-w-[200px] truncate text-xs text-slate-400">
                                                {tx.flagReason || tx.description || 'N/A'}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border
                                                    ${tx.status === 'SUCCESS' ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' :
                                                      tx.status === 'HOLD' ? 'text-rose-400 bg-rose-500/10 border-rose-500/20' :
                                                      tx.status === 'ESCALATED' ? 'text-purple-400 bg-purple-500/10 border-purple-500/20' :
                                                      tx.status === 'REVERSED' ? 'text-blue-400 bg-blue-500/10 border-blue-500/20' :
                                                      'text-slate-400 bg-slate-500/10 border-slate-500/20'}
                                                `}>
                                                    {tx.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button 
                                                    onClick={() => handleSelectDispute(tx)}
                                                    className="px-3 py-1 bg-[#0D1017] hover:bg-white/[0.04] text-slate-400 hover:text-white border border-[#1E2533] text-[9px] font-black uppercase tracking-widest rounded-lg transition-all flex items-center gap-1.5"
                                                >
                                                    <Eye size={10} />
                                                    Inspect
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Fraud Intelligence Console (Right 1 Column) */}
                <div className="bg-[#0D1017]/80 border border-[#1E2533] rounded-3xl p-6 backdrop-blur-md shadow-2xl flex flex-col justify-between min-h-[600px]">
                    {!selectedTx ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-center py-20 text-slate-500">
                            <ShieldAlert className="text-slate-700 mb-3" size={40} />
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Dispute Console Idle</p>
                            <p className="text-[11px] mt-1.5 text-slate-600 max-w-[200px] leading-relaxed">Select a flagged transaction from the ledger to load fraud intelligence profiles.</p>
                        </div>
                    ) : detailLoading ? (
                        <div className="flex-1 flex items-center justify-center">
                            <Loader2 className="animate-spin text-[#FF6B00]" size={32} />
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col justify-between h-full space-y-6">
                            
                            {/* Intelligence Data Cards */}
                            <div className="space-y-6 overflow-y-auto max-h-[500px] pr-1 custom-scrollbar">
                                <div>
                                    <div className="flex justify-between items-start">
                                        <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                            Dispute Intelligence Context
                                        </h3>
                                        <span className="text-[9px] font-bold font-mono text-slate-400">{selectedTx._id.slice(-10)}</span>
                                    </div>
                                    <div className="mt-3 p-3.5 bg-[#07090E] border border-[#1E2533] rounded-2xl space-y-2 text-xs">
                                        <div className="flex justify-between">
                                            <span className="text-slate-500">Disputed Amount</span>
                                            <span className="font-bold text-white font-mono">{selectedTx.currency} {selectedTx.amount.toLocaleString()}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-slate-500">Timestamp</span>
                                            <span className="text-slate-300 font-mono">{new Date(selectedTx.createdAt).toLocaleString()}</span>
                                        </div>
                                        <div className="pt-2 border-t border-white/[0.03] text-slate-400">
                                            <span className="font-bold text-[10px] uppercase text-rose-400 block mb-1">Disputed Statement:</span>
                                            <p className="text-[11px] leading-relaxed italic">"{selectedTx.flagReason || selectedTx.description || 'No reason specified'}"</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Scam Heuristics & Risk Analysis Panel */}
                                {(() => {
                                    const senderRiskScore = senderIntel?.securitySummary?.riskScore || 0;
                                    const recipientRiskScore = recipientIntel?.securitySummary?.riskScore || 0;
                                    const hasWarnings = 
                                        (recipientIntel?.accountAgeDays !== undefined && recipientIntel.accountAgeDays < 15) ||
                                        (recipientIntel?.scamReportsReceivedCount !== undefined && recipientIntel.scamReportsReceivedCount > 0) ||
                                        (recipientIntel?.averageTransferSizeKES !== undefined && recipientIntel.averageTransferSizeKES > 0 && selectedTx.currency === 'KES' && selectedTx.amount > recipientIntel.averageTransferSizeKES * 5) ||
                                        (senderIntel?.reportedScamsCount !== undefined && senderIntel.reportedScamsCount > 5) ||
                                        ((senderIntel?.deviceMismatches || 0) > 0 || (recipientIntel?.deviceMismatches || 0) > 0);

                                    return (
                                        <div className="space-y-2">
                                            <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                                                <ShieldAlert size={12} className="text-[#FF6B00]" />
                                                Scam Heuristics & Risk Analysis
                                            </h4>
                                            <div className="p-3.5 bg-[#07090E] border border-[#1E2533] rounded-2xl space-y-3 text-xs">
                                                {/* Risk Scores Grid */}
                                                <div className="grid grid-cols-2 gap-2 text-center">
                                                    <div className="p-2.5 bg-white/[0.01] border border-[#1E2533] rounded-xl">
                                                        <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest block">Sender Risk</span>
                                                        <span className={`text-base font-black block mt-1 ${
                                                            senderRiskScore > 75 ? 'text-rose-500' :
                                                            senderRiskScore > 45 ? 'text-orange-500' :
                                                            senderRiskScore > 25 ? 'text-amber-500' :
                                                            'text-emerald-500'
                                                        }`}>{senderRiskScore}/100</span>
                                                        <span className="text-[9px] font-bold text-slate-400 capitalize">
                                                            {senderRiskScore > 75 ? 'Critical' :
                                                             senderRiskScore > 45 ? 'High' :
                                                             senderRiskScore > 25 ? 'Medium' :
                                                             'Low'}
                                                        </span>
                                                    </div>
                                                    <div className="p-2.5 bg-white/[0.01] border border-[#1E2533] rounded-xl">
                                                        <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest block">Recipient Risk</span>
                                                        <span className={`text-base font-black block mt-1 ${
                                                            recipientRiskScore > 75 ? 'text-rose-500' :
                                                            recipientRiskScore > 45 ? 'text-orange-500' :
                                                            recipientRiskScore > 25 ? 'text-amber-500' :
                                                            'text-emerald-500'
                                                        }`}>{recipientRiskScore}/100</span>
                                                        <span className="text-[9px] font-bold text-slate-400 capitalize">
                                                            {recipientRiskScore > 75 ? 'Critical' :
                                                             recipientRiskScore > 45 ? 'High' :
                                                             recipientRiskScore > 25 ? 'Medium' :
                                                             'Low'}
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Dynamic Alerts List */}
                                                {hasWarnings ? (
                                                    <div className="pt-2 border-t border-white/[0.03] space-y-2 text-left">
                                                        <span className="text-[8px] font-black text-rose-400 uppercase tracking-widest block">Active Risk Flags:</span>
                                                        
                                                        {recipientIntel?.accountAgeDays !== undefined && recipientIntel.accountAgeDays < 15 && (
                                                            <div className="flex items-start gap-1.5 text-[10px] text-amber-400 font-medium">
                                                                <AlertTriangle size={12} className="mt-0.5 shrink-0" />
                                                                <span>New Recipient: Account active only {recipientIntel.accountAgeDays} days. High money mule risk.</span>
                                                            </div>
                                                        )}

                                                        {recipientIntel?.scamReportsReceivedCount !== undefined && recipientIntel.scamReportsReceivedCount > 0 && (
                                                            <div className="flex items-start gap-1.5 text-[10px] text-rose-400 font-bold">
                                                                <ShieldAlert size={12} className="mt-0.5 shrink-0" />
                                                                <span>Serial Defendant: {recipientIntel.scamReportsReceivedCount} active scam disputes filed against them.</span>
                                                            </div>
                                                        )}

                                                        {recipientIntel?.averageTransferSizeKES !== undefined && recipientIntel.averageTransferSizeKES > 0 && selectedTx.currency === 'KES' && selectedTx.amount > recipientIntel.averageTransferSizeKES * 5 && (
                                                            <div className="flex items-start gap-1.5 text-[10px] text-amber-400 font-medium">
                                                                <AlertTriangle size={12} className="mt-0.5 shrink-0" />
                                                                <span>Anomalous Value: Transfer size is 5x larger than recipient's average transfer size ({Math.round(recipientIntel.averageTransferSizeKES).toLocaleString()} KES).</span>
                                                            </div>
                                                        )}

                                                        {senderIntel?.reportedScamsCount !== undefined && senderIntel.reportedScamsCount > 5 && (
                                                            <div className="flex items-start gap-1.5 text-[10px] text-purple-400 font-medium">
                                                                <AlertTriangle size={12} className="mt-0.5 shrink-0" />
                                                                <span>Dispute Abuse: Sender has filed {senderIntel.reportedScamsCount} disputes. Check for first-party fraud.</span>
                                                            </div>
                                                        )}

                                                        {((senderIntel?.deviceMismatches || 0) > 0 || (recipientIntel?.deviceMismatches || 0) > 0) && (
                                                            <div className="flex items-start gap-1.5 text-[10px] text-orange-400 font-medium">
                                                                <Cpu size={12} className="mt-0.5 shrink-0" />
                                                                <span>Session Mismatch: Multiple active or untrusted device sessions detected.</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <div className="pt-2 border-t border-white/[0.03] text-center text-slate-500 text-[9px] font-bold uppercase tracking-wider py-1">
                                                        No high-confidence risk flags triggered
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })()}

                                {/* Sender Profile */}
                                <div className="space-y-2">
                                    <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Sender Profile (Plaintiff)</h4>
                                    <div className="p-3.5 bg-[#07090E] border border-[#1E2533] rounded-2xl space-y-2.5 text-xs">
                                        <div className="flex justify-between items-center">
                                            <span className="font-bold text-white capitalize">{senderProfile?.username || 'Unknown'}</span>
                                            <span className={`text-[8px] px-1.5 py-0.5 rounded font-black tracking-widest uppercase border ${
                                                senderProfile?.kycStatus === 'APPROVED' ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' : 'text-slate-500 bg-slate-500/10 border-slate-500/20'
                                            }`}>
                                                KYC {senderProfile?.kycStatus || 'N/A'}
                                            </span>
                                        </div>
                                        <div className="space-y-1 text-[11px] text-slate-400 font-mono">
                                            <p>{senderProfile?.email}</p>
                                            <p>{senderProfile?.phone || 'No phone registered'}</p>
                                        </div>
                                        {senderIntel && (
                                            <div className="pt-2 border-t border-white/[0.03] grid grid-cols-2 gap-2 text-[10px]">
                                                <div>
                                                    <span className="text-slate-500 block">Total Volume</span>
                                                    <span className="font-bold text-slate-300">KES {Math.round(senderIntel.totalTransferVolumeKES || 0).toLocaleString()}</span>
                                                </div>
                                                <div>
                                                    <span className="text-slate-500 block">Disputes Filed</span>
                                                    <span className="font-bold text-slate-300">{senderIntel.reportedScamsCount || 0} disputes</span>
                                                </div>
                                                <div className="col-span-2 mt-1 pt-1 border-t border-white/[0.01] flex justify-between text-[9px] text-slate-500 font-mono">
                                                    <span>Account Age: {senderIntel.accountAgeDays || 0} days</span>
                                                    <span>24h Velocity: {senderIntel.recentVelocity24h || 0} txs</span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Recipient Profile */}
                                <div className="space-y-2">
                                    <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Recipient Profile (Defendant)</h4>
                                    <div className="p-3.5 bg-[#07090E] border border-[#1E2533] rounded-2xl space-y-2.5 text-xs">
                                        <div className="flex justify-between items-center">
                                            <span className="font-bold text-white capitalize">{recipientProfile?.username || 'Unknown'}</span>
                                            <span className={`text-[8px] px-1.5 py-0.5 rounded font-black tracking-widest uppercase border ${
                                                recipientProfile?.kycStatus === 'APPROVED' ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' : 'text-slate-500 bg-slate-500/10 border-slate-500/20'
                                            }`}>
                                                KYC {recipientProfile?.kycStatus || 'N/A'}
                                            </span>
                                        </div>
                                        <div className="space-y-1 text-[11px] text-slate-400 font-mono">
                                            <p>{recipientProfile?.email}</p>
                                            <p>{recipientProfile?.phone || 'No phone registered'}</p>
                                        </div>
                                        {recipientIntel && (
                                            <div className="pt-2 border-t border-white/[0.03] grid grid-cols-2 gap-2 text-[10px]">
                                                <div>
                                                    <span className="text-slate-500 block">Recipient Balance</span>
                                                    <span className="font-bold text-emerald-400">KES {Math.round(recipientProfile?.kesBalance || 0).toLocaleString()}</span>
                                                </div>
                                                <div>
                                                    <span className="text-slate-500 block">Avg. Transfer Size</span>
                                                    <span className="font-bold text-slate-300">KES {Math.round(recipientIntel.averageTransferSizeKES || 0).toLocaleString()}</span>
                                                </div>
                                                <div className="col-span-2 mt-1 pt-1 border-t border-white/[0.01] flex justify-between text-[9px] text-slate-500 font-mono">
                                                    <span>Account Age: {recipientIntel.accountAgeDays || 0} days</span>
                                                    <span>Disputes Against: {recipientIntel.scamReportsReceivedCount || 0}</span>
                                                </div>
                                            </div>
                                        )}

                                        {/* Block Action Button */}
                                        {recipientProfile && recipientProfile.status !== 'BLOCKED' ? (
                                            <button
                                                onClick={() => setBlockConfirmModal({
                                                    show: true,
                                                    userId: recipientProfile._id || recipientProfile.id,
                                                    username: recipientProfile.username || 'Unknown'
                                                })}
                                                className="w-full mt-2.5 py-2 bg-rose-955/20 hover:bg-rose-900/40 border border-rose-500/20 hover:border-rose-500/50 text-rose-400 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5"
                                            >
                                                <XCircle size={12} />
                                                Block Recipient Account
                                            </button>
                                        ) : recipientProfile && recipientProfile.status === 'BLOCKED' ? (
                                            <div className="w-full mt-2.5 py-2 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-center text-[10px] font-black uppercase tracking-widest rounded-xl flex items-center justify-center gap-1.5">
                                                <XCircle size={12} />
                                                Recipient Account Blocked
                                            </div>
                                        ) : null}
                                    </div>
                                </div>

                                {/* Device & IP context */}
                                {selectedTx.metadata && (
                                    <div className="space-y-2 font-mono text-[10px]">
                                        <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest font-sans">Request Context (Device / IP)</h4>
                                        <div className="p-3 bg-[#07090E] border border-[#1E2533] rounded-2xl space-y-1.5">
                                            <p className="truncate"><span className="text-slate-500">IP Address:</span> {selectedTx.metadata.ip || '127.0.0.1'}</p>
                                            <p className="truncate"><span className="text-slate-500">Client Agent:</span> {selectedTx.metadata.userAgent || 'Unknown Mobile App'}</p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Resolution Buttons */}
                            <div className="pt-6 border-t border-[#1E2533] space-y-3">
                                {selectedTx.status === 'HOLD' ? (
                                    <div className="flex gap-2">
                                        <button 
                                            onClick={() => triggerConfirmModal('REVERSE', selectedTx)}
                                            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all shadow-md"
                                        >
                                            <Undo size={12} />
                                            Refund Sender
                                        </button>
                                        <button 
                                            onClick={() => triggerConfirmModal('RESOLVE_FAVOR_RECEIVER', selectedTx)}
                                            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all shadow-md"
                                        >
                                            <CheckCircle2 size={12} />
                                            Release Hold
                                        </button>
                                    </div>
                                ) : (
                                    <div className="p-3.5 bg-slate-500/5 border border-slate-500/10 rounded-2xl text-center">
                                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">Resolution Status</span>
                                        <p className="text-xs font-bold text-slate-300">This dispute has already been resolved / {selectedTx.status}.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Decision Confirmation Modal Overlay */}
            {confirmModal && (
                <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
                    <div className="bg-[#0B1020] border border-[#1A233A] rounded-3xl max-w-md w-full p-6 space-y-6 shadow-2xl">
                        <div className="text-left">
                            <h3 className="text-lg font-black text-white uppercase tracking-wider flex items-center gap-2">
                                <AlertTriangle className="text-[#FF6B00]" size={20} />
                                Confirm Resolution Action
                            </h3>
                            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                                You are resolving dispute transaction <span className="font-mono text-white font-bold">{confirmModal.txId.slice(-8)}</span>. 
                                Action: <span className="font-bold text-white bg-white/5 px-2 py-0.5 rounded tracking-wider">{confirmModal.action}</span>
                            </p>
                        </div>

                        <div className="space-y-4">
                            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                                Enter explanation reason for audit logs:
                            </div>
                            <textarea 
                                value={actionReason}
                                onChange={(e) => setActionReason(e.target.value)}
                                placeholder="Describe the fraud audit decision or scam evaluation logic (minimum 5 characters)..."
                                className="w-full bg-[#07090E] border border-[#1E2533] rounded-2xl p-4 text-xs text-slate-200 focus:outline-none focus:border-[#FF6B00] min-h-[100px]"
                                disabled={processingAction}
                            />
                        </div>

                        <div className="flex gap-3 justify-end pt-2">
                            <button
                                onClick={() => setConfirmModal(null)}
                                className="px-4 py-2 bg-transparent hover:bg-white/5 border border-white/10 text-slate-300 font-bold text-xs uppercase tracking-wider rounded-xl transition-all"
                                disabled={processingAction}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={processAction}
                                className={`px-6 py-2 text-white font-black text-xs uppercase tracking-widest rounded-xl transition-all flex items-center gap-1.5 ${
                                    confirmModal.action === 'REVERSE' ? 'bg-rose-600 hover:bg-rose-700' : 'bg-emerald-600 hover:bg-emerald-700'
                                }`}
                                disabled={processingAction}
                            >
                                {processingAction ? (
                                    <Loader2 className="animate-spin" size={12} />
                                ) : (
                                    'Submit Decision'
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Block User Confirmation Modal Overlay */}
            {blockConfirmModal && (
                <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
                    <div className="bg-[#0B1020] border border-[#1A233A] rounded-3xl max-w-md w-full p-6 space-y-6 shadow-2xl">
                        <div className="text-left">
                            <h3 className="text-lg font-black text-white uppercase tracking-wider flex items-center gap-2">
                                <AlertTriangle className="text-rose-500" size={20} />
                                Confirm Permanent Block
                            </h3>
                            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                                You are about to block user account <span className="font-mono text-white font-bold">{blockConfirmModal.username}</span>.
                                This will restrict them from depositing, withdrawing, or transferring any funds, and terminate all active login sessions immediately.
                            </p>
                        </div>

                        <div className="flex gap-3 justify-end pt-2">
                            <button
                                onClick={() => setBlockConfirmModal(null)}
                                className="px-4 py-2 bg-transparent hover:bg-white/5 border border-white/10 text-slate-300 font-bold text-xs uppercase tracking-wider rounded-xl transition-all"
                                disabled={processingAction}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleBlockUser}
                                className="px-6 py-2 bg-rose-600 hover:bg-rose-700 text-white font-black text-xs uppercase tracking-widest rounded-xl transition-all flex items-center gap-1.5"
                                disabled={processingAction}
                            >
                                {processingAction ? (
                                    <Loader2 className="animate-spin" size={12} />
                                ) : (
                                    'Block User'
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// Sub-components
function KpiTile({ label, value, subtext, icon }: { label: string; value: string; subtext: string; icon: React.ReactNode }) {
    return (
        <div className="bg-[#0D1017]/80 border border-[#1E2533] rounded-3xl p-6 backdrop-blur-md shadow-lg flex justify-between items-start">
            <div className="space-y-1">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">{label}</span>
                <span className="text-2xl font-black text-white block">{value}</span>
                <span className="text-[10px] text-slate-400 font-medium block">{subtext}</span>
            </div>
            <div className="p-2 bg-white/[0.02] border border-white/5 rounded-xl">
                {icon}
            </div>
        </div>
    );
}

function TreasuryRow({ label, value, highlight = false, sub = false }: { label: string; value: string; highlight?: boolean; sub?: boolean }) {
    return (
        <div className={`flex justify-between py-2.5 border-b border-[#1E2533]/40 ${highlight ? 'text-white font-bold' : 'text-slate-400'}`}>
            <span className={`font-sans ${sub ? 'pl-4 text-slate-500' : ''}`}>{label}</span>
            <span className={highlight ? 'text-[#FF6B00]' : 'text-white'}>{value}</span>
        </div>
    );
}

function WithdrawalDetailRow({ label, value, isHighlight = false, isMonospace = false }: { label: string; value: string; isHighlight?: boolean; isMonospace?: boolean }) {
    return (
        <div className="flex justify-between py-1 text-[11px]">
            <span className="text-slate-500">{label}</span>
            <span className={`${isHighlight ? 'text-[#FF6B00] font-bold' : 'text-slate-300'} ${isMonospace ? 'font-mono' : ''}`}>{value}</span>
        </div>
    );
}
