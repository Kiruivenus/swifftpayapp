"use client";

import React, { useState, useEffect, useCallback } from 'react';
import {
    Users,
    Search,
    Filter,
    MoreVertical,
    UserPlus,
    Shield,
    Ban,
    Unlock,
    Eye,
    Mail,
    Smartphone,
    ChevronLeft,
    ChevronRight,
    Loader2,
    CheckCircle2,
    AlertCircle,
    RefreshCcw,
    Download,
    Wallet,
    ArrowDownRight,
    ArrowUpRight
} from 'lucide-react';
import { adminService } from '@/services/admin.service';

export default function UsersPage() {
    const [users, setUsers] = useState<any[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [kycFilter, setKycFilter] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Modals & Drawers State
    const [showAddAdmin, setShowAddAdmin] = useState(false);
    const [selectedUser, setSelectedUser] = useState<any | null>(null);
    const [showFreezeModal, setShowFreezeModal] = useState<any | null>(null);

    const fetchUsers = useCallback(async () => {
        try {
            setLoading(true);
            const data = await adminService.getUsers({
                search,
                status: statusFilter,
                kycStatus: kycFilter,
                page,
                limit: 10
            });
            setUsers(data.users || []);
            setTotal(data.total || 0);
            setError(null);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [page, search, statusFilter, kycFilter]);

    useEffect(() => {
        const timer = setTimeout(() => fetchUsers(), 500);
        return () => clearTimeout(timer);
    }, [fetchUsers]);

    const handleBlockUnblock = async (user: any) => {
        const newStatus = user.status === 'BLOCKED' ? 'ACTIVE' : 'BLOCKED';
        if (!confirm(`Are you sure you want to ${newStatus.toLowerCase()} ${user.username}?`)) return;

        try {
            await adminService.updateUser(user._id, { status: newStatus });
            fetchUsers();
        } catch (err: any) {
            alert(err.message);
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-700 font-sans">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h2 className="text-3xl font-bold text-white tracking-tight">User Management</h2>
                    <p className="text-slate-400 mt-1">Search, manage, and monitor all platform users.</p>
                </div>
                <div className="flex items-center gap-3">
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="bg-[#0D1017] border border-[#1E2533] text-slate-300 rounded-xl px-4 py-2.5 text-xs font-bold uppercase tracking-wider outline-none focus:border-primary-orange transition-all cursor-pointer"
                    >
                        <option value="">All Status</option>
                        <option value="ACTIVE">Active</option>
                        <option value="BLOCKED">Blocked</option>
                        <option value="PENDING_VERIFICATION">Pending</option>
                    </select>
                    <select
                        value={kycFilter}
                        onChange={(e) => setKycFilter(e.target.value)}
                        className="bg-[#0D1017] border border-[#1E2533] text-slate-300 rounded-xl px-4 py-2.5 text-xs font-bold uppercase tracking-wider outline-none focus:border-primary-orange transition-all cursor-pointer"
                    >
                        <option value="">KYC: All</option>
                        <option value="NOT_STARTED">Not Started</option>
                        <option value="PENDING">Pending</option>
                        <option value="APPROVED">Approved</option>
                        <option value="REJECTED">Rejected</option>
                    </select>
                    <button
                        onClick={() => setShowAddAdmin(true)}
                        className="flex items-center gap-2 px-6 py-2.5 bg-primary-orange hover:bg-primary-orange-hover text-white text-xs font-black rounded-xl transition-all shadow-lg shadow-primary-orange/20 uppercase tracking-widest"
                    >
                        <UserPlus size={16} />
                        Add Admin
                    </button>
                </div>
            </div>

            {/* Search Bar */}
            <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search by name, email, or phone..."
                    className="w-full pl-12 pr-4 py-3 bg-[#0D1017]/60 border border-[#1E2533] rounded-2xl text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-primary-orange/50 focus:ring-1 focus:ring-primary-orange/20 transition-all font-medium text-sm backdrop-blur-md"
                />
            </div>

            {/* Users Table */}
            <div className="bg-[#0D1017]/80 border border-[#1E2533] rounded-3xl overflow-hidden backdrop-blur-md min-h-[400px] flex flex-col shadow-2xl">
                <div className="overflow-x-auto flex-1">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-white/[0.02] text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-[#1E2533]">
                                <th className="px-6 py-4">User Details</th>
                                <th className="px-6 py-4">Contact</th>
                                <th className="px-6 py-4">KYC Status</th>
                                <th className="px-6 py-4">Role</th>
                                <th className="px-6 py-4">Balances</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#1E2533]">
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="py-20 text-center">
                                        <Loader2 className="animate-spin text-primary-orange mx-auto" size={36} />
                                        <p className="text-slate-500 mt-4 font-bold uppercase tracking-widest text-[10px]">Fetching Platform Data...</p>
                                    </td>
                                </tr>
                            ) : users.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="py-20 text-center">
                                        <AlertCircle className="text-slate-700 mx-auto mb-4" size={40} />
                                        <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">No users found matching your criteria</p>
                                    </td>
                                </tr>
                            ) : (
                                users.map((user) => (
                                    <UserTableRow
                                        key={user._id}
                                        user={user}
                                        onView={() => setSelectedUser(user)}
                                        onFreeze={() => setShowFreezeModal(user)}
                                        onStatusChange={() => handleBlockUnblock(user)}
                                        onRefresh={fetchUsers}
                                    />
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Modals & Sidebar Components */}
                {showAddAdmin && (
                    <AddAdminModal
                        onClose={() => setShowAddAdmin(false)}
                        onSuccess={fetchUsers}
                    />
                )}
                {selectedUser && (
                    <UserDetailsDrawer
                        userId={selectedUser._id || selectedUser}
                        onClose={() => setSelectedUser(null)}
                    />
                )}
                {showFreezeModal && (
                    <FreezeFundsModal
                        user={showFreezeModal}
                        onClose={() => setShowFreezeModal(null)}
                        onSuccess={fetchUsers}
                    />
                )}

                {/* Pagination */}
                <div className="p-6 border-t border-[#1E2533] flex items-center justify-between">
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">
                        Showing {total === 0 ? 0 : (page - 1) * 10 + 1} to {Math.min(page * 10, total)} of {total} users
                    </p>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1}
                            className="p-2 text-slate-500 hover:text-white transition-colors disabled:opacity-30 hover:bg-white/[0.04] rounded-lg border border-transparent hover:border-white/5"
                        >
                            <ChevronLeft size={16} />
                        </button>
                        <div className="flex items-center gap-1 font-mono">
                            {Array.from({ length: Math.min(5, Math.ceil(total / 10)) }).map((_, i) => (
                                <button
                                    key={i}
                                    onClick={() => setPage(i + 1)}
                                    className={`w-8 h-8 rounded-lg font-bold text-xs flex items-center justify-center transition-all border ${page === i + 1 ? 'bg-primary-orange border-primary-orange text-white shadow-lg shadow-primary-orange/20' : 'text-slate-400 border-[#1E2533] hover:bg-white/[0.04]'
                                        }`}
                                >
                                    {i + 1}
                                </button>
                            ))}
                        </div>
                        <button
                            onClick={() => setPage(p => Math.min(Math.ceil(total / 10), p + 1))}
                            disabled={page >= Math.ceil(total / 10)}
                            className="p-2 text-slate-500 hover:text-white transition-colors hover:bg-white/[0.04] rounded-lg disabled:opacity-30 border border-transparent hover:border-[#1E2533]"
                        >
                            <ChevronRight size={16} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

function UserTableRow({ user, onView, onFreeze, onStatusChange, onRefresh }: any) {
    const [showMenu, setShowMenu] = useState(false);

    const kycColor = user.kycStatus === 'APPROVED' ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' :
        user.kycStatus === 'PENDING' ? 'text-amber-400 bg-amber-500/10 border-amber-500/20' :
            'text-rose-400 bg-rose-500/10 border-rose-500/20';

    const getRoleColor = (role: string) => {
        switch (role) {
            case 'super_admin': return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
            case 'admin': return 'bg-primary-orange-light text-primary-orange border-primary-orange-border';
            case 'finance': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
            case 'support': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
            case 'kyc_reviewer': return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
            case 'auditor': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
            default: return 'bg-white/[0.04] text-slate-400 border-white/5';
        }
    };

    return (
        <tr className="group hover:bg-white/[0.01] transition-all duration-300">
            <td className="px-6 py-5">
                <div className="flex items-center gap-4">
                    <div className="w-11 h-11 rounded-2xl bg-[#07090E] flex items-center justify-center font-black text-sm text-primary-orange border border-[#1E2533] group-hover:border-primary-orange/30 transition-all shadow-inner uppercase">
                        {user.username?.[0] || 'U'}
                    </div>
                    <div>
                        <p className="text-sm font-bold text-white leading-none mb-1 capitalize">{user.fullName || user.username}</p>
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">@{user.username}</p>
                    </div>
                </div>
            </td>
            <td className="px-6 py-5">
                <div className="space-y-1.5">
                    <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
                        <Mail size={12} className="text-slate-600" />
                        {user.email}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
                        <Smartphone size={12} className="text-slate-600" />
                        {user.phoneE164}
                    </div>
                </div>
            </td>
            <td className="px-6 py-5">
                <div className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-full border text-[9px] font-black uppercase tracking-widest ${kycColor}`}>
                    <div className={`w-1 h-1 rounded-full ${user.kycStatus === 'APPROVED' ? 'bg-emerald-400 shadow-[0_0_6px_rgba(16,185,129,0.5)]' : 'bg-current'}`} />
                    <span>{user.kycStatus}</span>
                </div>
                <p className="text-[10px] text-slate-600 mt-2 font-bold uppercase tracking-widest pl-1">Joined {new Date(user.createdAt).toLocaleDateString()}</p>
            </td>
            <td className="px-6 py-5">
                <div className={`inline-flex px-2.5 py-0.5 rounded-md border text-[9px] font-black uppercase tracking-widest ${getRoleColor(user.role)}`}>
                    {user.role}
                </div>
            </td>
            <td className="px-6 py-5 font-mono">
                <p className="text-xs font-bold text-white">KES {user.kesBalance?.toLocaleString() || 0}</p>
                <p className="text-[10px] font-bold text-slate-500 mt-0.5">{user.usdtBalance?.toLocaleString() || 0} USDT</p>
            </td>
            <td className="px-6 py-5 text-right">
                <div className="flex items-center justify-end gap-1 relative">
                    <button onClick={onView} className="p-2 text-slate-500 hover:text-primary-orange hover:bg-white/[0.04] rounded-lg border border-transparent hover:border-white/5 transition-all" title="View Profile">
                        <Eye size={18} />
                    </button>
                    <button onClick={onFreeze} className="p-2 text-slate-500 hover:text-amber-400 hover:bg-white/[0.04] rounded-lg border border-transparent hover:border-white/5 transition-all" title="Freeze Funds">
                        <Shield size={18} />
                    </button>
                    <button
                        onClick={onStatusChange}
                        className={`p-2 transition-all rounded-lg border border-transparent ${user.status === 'BLOCKED' ? 'text-emerald-400 hover:bg-emerald-500/10 hover:border-emerald-500/20' : 'text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 hover:border-rose-500/20'}`}
                        title={user.status === 'BLOCKED' ? 'Unblock User' : 'Block User'}
                    >
                        {user.status === 'BLOCKED' ? <Unlock size={18} /> : <Ban size={18} />}
                    </button>
                    <div className="w-px h-6 bg-[#1E2533] mx-1" />

                    <button
                        onClick={() => setShowMenu(!showMenu)}
                        className="p-2 text-slate-500 hover:text-white hover:bg-white/[0.04] rounded-lg border border-transparent hover:border-[#1E2533] transition-all"
                    >
                        <MoreVertical size={18} />
                    </button>

                    {showMenu && (
                        <>
                            <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
                            <div className="absolute right-0 top-full mt-2 w-48 bg-[#0D1017] border border-[#1E2533] rounded-xl shadow-2xl z-20 py-2 animate-in fade-in slide-in-from-top-2 duration-200 backdrop-blur-md">
                                <button className="w-full text-left px-4 py-2 text-xs font-bold text-slate-400 hover:text-white hover:bg-white/[0.04] transition-colors flex items-center gap-2">
                                    <RefreshCcw size={14} /> Reset Password
                                </button>
                                <button className="w-full text-left px-4 py-2 text-xs font-bold text-slate-400 hover:text-white hover:bg-white/[0.04] transition-colors flex items-center gap-2">
                                    <Download size={14} /> Export History
                                </button>
                                <button className="w-full text-left px-4 py-2 text-xs font-bold text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors flex items-center gap-2">
                                    <Ban size={14} /> Force Logout
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </td>
        </tr>
    );
}

function AddAdminModal({ onClose, onSuccess }: { onClose: () => void, onSuccess: () => void }) {
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [searching, setSearching] = useState(false);
    const [selectedUser, setSelectedUser] = useState<any | null>(null);
    const [role, setRole] = useState('admin');
    const [submitting, setSubmitting] = useState(false);

    const handleSearch = async () => {
        if (!searchQuery) return;
        try {
            setSearching(true);
            const data = await adminService.getUsers({ search: searchQuery, limit: 5 });
            setSearchResults(data.users || []);
        } catch (err) {
            console.error(err);
        } finally {
            setSearching(false);
        }
    };

    const handlePromote = async () => {
        if (!selectedUser) return;
        try {
            setSubmitting(true);
            await adminService.promoteAdmin(selectedUser._id, role);
            alert("Admin role assigned successfully");
            onSuccess();
            onClose();
        } catch (err: any) {
            alert(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
            <div className="bg-[#0D1017] border border-[#1E2533] rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
                <div className="p-6 border-b border-[#1E2533] flex items-center justify-between">
                    <h3 className="text-lg font-bold text-white uppercase tracking-wider">Promote to Admin</h3>
                    <button onClick={onClose} className="text-slate-500 hover:text-white font-bold text-lg">&times;</button>
                </div>
                <div className="p-6 space-y-6">
                    <div>
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2.5 block pl-1">Search User</label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Email or Username"
                                className="flex-1 bg-[#07090E] border border-[#1E2533] rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-primary-orange transition-all"
                            />
                            <button onClick={handleSearch} className="px-5 py-2.5 bg-white text-[#07090E] text-xs font-black rounded-xl hover:bg-slate-200 transition-colors uppercase tracking-widest shadow-sm">
                                {searching ? <Loader2 size={16} className="animate-spin" /> : 'Search'}
                            </button>
                        </div>
                    </div>
 
                    {searchResults.length > 0 && (
                        <div className="space-y-2 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                            {searchResults.map(u => (
                                <button
                                    key={u._id}
                                    onClick={() => setSelectedUser(u)}
                                    className={`w-full text-left p-3 rounded-xl border transition-all flex items-center gap-3 ${selectedUser?._id === u._id ? 'border-primary-orange bg-primary-orange-light' : 'border-[#1E2533] bg-[#07090E]/30 hover:border-white/10'
                                        }`}
                                >
                                    <div className="w-8 h-8 rounded-lg bg-[#07090E] border border-[#1E2533] flex items-center justify-center text-xs font-black text-primary-orange">
                                        {u.username[0].toUpperCase()}
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-white leading-none">{u.username}</p>
                                        <p className="text-[10px] text-slate-500 mt-1">{u.email}</p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}

                    {selectedUser && (
                        <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                            <select
                                value={role}
                                onChange={(e) => setRole(e.target.value)}
                                className="w-full bg-[#07090E] border border-[#1E2533] rounded-xl px-4 py-3 text-xs font-black uppercase tracking-wider text-slate-300 outline-none focus:border-primary-orange appearance-none cursor-pointer"
                            >
                                <option value="admin">Platform Admin</option>
                                <option value="finance">Finance Manager</option>
                                <option value="support">Customer Support</option>
                                <option value="kyc_reviewer">KYC Reviewer</option>
                                <option value="auditor">Internal Auditor</option>
                            </select>
                        </div>
                    )}
                </div>
                <div className="p-6 bg-white/[0.01] border-t border-[#1E2533] flex gap-3">
                    <button onClick={onClose} className="flex-1 py-3.5 text-xs font-black text-slate-500 hover:text-white transition-colors uppercase tracking-widest">Cancel</button>
                    <button
                        onClick={handlePromote}
                        disabled={!selectedUser || submitting}
                        className="flex-1 py-3.5 bg-primary-orange hover:bg-primary-orange-hover disabled:opacity-50 text-white text-xs font-black rounded-xl transition-all shadow-lg shadow-primary-orange/20 uppercase tracking-widest"
                    >
                        {submitting ? <Loader2 size={16} className="animate-spin mx-auto" /> : 'Confirm Promotion'}
                    </button>
                </div>
            </div>
        </div>
    );
}

function FreezeFundsModal({ user, onClose, onSuccess }: { user: any, onClose: () => void, onSuccess: () => void }) {
    const [currency, setCurrency] = useState('KES');
    const [amount, setAmount] = useState('');
    const [reason, setReason] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const handleFreeze = async () => {
        if (!amount || !reason || reason.length < 10) {
            alert("Please provide amount and a reason (min 10 chars)");
            return;
        }
        try {
            setSubmitting(true);
            await adminService.createHold(user._id, {
                currency,
                amount: parseFloat(amount),
                reason
            });
            alert("Funds locked successfully");
            onSuccess();
            onClose();
        } catch (err: any) {
            alert(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
            <div className="bg-[#0D1017] border border-[#1E2533] rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300 font-sans">
                <div className="p-6 border-b border-[#1E2533]">
                    <h3 className="text-lg font-bold text-white flex items-center gap-3 uppercase tracking-wider">
                        <Shield className="text-amber-500" size={22} />
                        Freeze User Funds
                    </h3>
                    <p className="text-[10px] text-slate-500 mt-1.5 uppercase font-bold tracking-widest">Acting on @{user.username}</p>
                </div>
                <div className="p-6 space-y-5">
                    <div className="grid grid-cols-2 gap-2 p-1 bg-[#07090E] border border-[#1E2533] rounded-xl">
                        {['KES', 'USDT'].map(c => (
                            <button
                                key={c}
                                onClick={() => setCurrency(c)}
                                className={`py-2 text-[10px] font-black rounded-lg transition-all ${currency === c ? 'bg-primary-orange text-white shadow-lg shadow-primary-orange/20' : 'text-slate-500 hover:text-white'}`}
                            >
                                {c}
                            </button>
                        ))}
                    </div>
                    <div>
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block pl-1">Amount to Lock</label>
                        <input
                            type="number"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder="0.00"
                            className="w-full bg-[#07090E] border border-[#1E2533] rounded-xl px-4 py-3 text-white font-mono text-base focus:border-primary-orange outline-none"
                        />
                    </div>
                    <div>
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block pl-1">Reason (Min 10 chars)</label>
                        <textarea
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            placeholder="Describe why funds are being restricted..."
                            rows={3}
                            className="w-full bg-[#07090E] border border-[#1E2533] rounded-xl px-4 py-3 text-xs text-white resize-none focus:border-primary-orange outline-none"
                        />
                    </div>
                </div>
                <div className="p-6 border-t border-[#1E2533] flex gap-3 bg-white/[0.01]">
                    <button onClick={onClose} className="flex-1 py-3 text-xs font-black text-slate-500 hover:text-white transition-colors uppercase tracking-widest">Cancel</button>
                    <button
                        onClick={handleFreeze}
                        disabled={submitting}
                        className="flex-1 py-3 bg-rose-600 hover:bg-rose-500 text-white text-xs font-black rounded-xl transition-all shadow-lg shadow-rose-600/20 uppercase tracking-widest border border-rose-500/20"
                    >
                        {submitting ? <Loader2 size={16} className="animate-spin mx-auto" /> : 'Freeze Funds'}
                    </button>
                </div>
            </div>
        </div>
    );
}

function UserDetailsDrawer({ userId, onClose }: { userId: string, onClose: () => void }) {
    const [summary, setSummary] = useState<any>(null);
    const [txs, setTxs] = useState<any[]>([]);
    const [holds, setHolds] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            try {
                setLoading(true);
                const [s, t, h] = await Promise.all([
                    adminService.getUserSummary(userId),
                    adminService.getUserTransactions(userId, { limit: 10 }),
                    adminService.getUserHolds(userId)
                ]);
                setSummary(s);
                setTxs(t.items || []);
                setHolds(h.items || []);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        if (userId) load();
    }, [userId]);

    const handleRelease = async (holdId: string) => {
        const reason = prompt("Reason for release:");
        if (reason === null) return;
        try {
            await adminService.releaseHold(holdId, reason);
            alert("Funds released");
            onClose(); // Refresh parent
        } catch (err: any) {
            alert(err.message);
        }
    };

    if (!userId) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-hidden flex justify-end animate-in fade-in duration-500 font-sans">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={onClose} />
            <div className="relative w-full max-w-2xl bg-[#0D1017] border-l border-[#1E2533] shadow-2xl border-white/5 flex flex-col h-full animate-in slide-in-from-right duration-500">
                <div className="p-6 border-b border-[#1E2533] flex items-center justify-between">
                    <h3 className="text-base font-bold text-white uppercase tracking-wider">User Intelligence Profile</h3>
                    <button onClick={onClose} className="p-2 text-slate-500 hover:text-white transition-colors text-xl font-bold">&times;</button>
                </div>
 
                <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
                    {loading ? (
                        <div className="h-full flex items-center justify-center"><Loader2 className="animate-spin text-primary-orange" size={36} /></div>
                    ) : (
                        <>
                            {/* Profile Header */}
                            <div className="flex items-center gap-6 p-6 bg-[#07090E]/40 rounded-3xl border border-[#1E2533] shadow-inner">
                                <div className="w-20 h-20 rounded-3xl bg-[#07090E] border border-[#1E2533] flex items-center justify-center text-4xl font-black text-primary-orange shadow-lg capitalize">
                                    {summary?.user?.username?.[0]}
                                </div>
                                <div>
                                    <h4 className="text-2xl font-black text-white capitalize leading-tight">{summary?.user?.username}</h4>
                                    <p className="text-slate-500 font-medium text-sm mt-0.5">{summary?.user?.email}</p>
                                    <div className={`inline-flex px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border mt-3 ${summary?.user?.status === 'ACTIVE' ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' : 'text-rose-400 bg-rose-500/10 border-rose-500/20'
                                        }`}>
                                        {summary?.user?.status}
                                    </div>
                                </div>
                            </div>
 
                            {/* Wallet Stats */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-5 bg-[#07090E]/30 border border-[#1E2533] rounded-2xl relative overflow-hidden group shadow-inner">
                                    <div className="absolute top-0 right-0 p-2 opacity-[0.02] text-white"><Wallet size={48} /></div>
                                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1.5 pl-0.5">KES Ledger</p>
                                    <p className="text-2xl font-black text-white font-mono leading-none">{(summary?.wallet?.kesBalance || 0).toLocaleString()}</p>
                                    {summary?.wallet?.lockedKES > 0 && (
                                        <div className="flex items-center gap-1.5 mt-3 text-rose-400 font-bold text-[10px]">
                                            <Shield size={12} />
                                            {summary.wallet.lockedKES.toLocaleString()} Frozen
                                        </div>
                                    )}
                                </div>
                                <div className="p-5 bg-[#07090E]/30 border border-[#1E2533] rounded-2xl relative overflow-hidden group shadow-inner">
                                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1.5 pl-0.5">USDT Ledger</p>
                                    <p className="text-2xl font-black text-primary-orange font-mono leading-none">{(summary?.wallet?.usdtBalance || 0).toLocaleString()}</p>
                                    {summary?.wallet?.lockedUSDT > 0 && (
                                        <div className="flex items-center gap-1.5 mt-3 text-rose-400 font-bold text-[10px]">
                                            <Shield size={12} />
                                            {summary.wallet.lockedUSDT.toLocaleString()} Frozen
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Active Holds */}
                            {holds.filter(h => h.status === 'ACTIVE').length > 0 && (
                                <div>
                                    <h5 className="text-[10px] font-black text-rose-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                        <Shield size={14} /> Active Restrictions
                                    </h5>
                                    <div className="space-y-3 font-mono">
                                        {holds.filter(h => h.status === 'ACTIVE').map(hold => (
                                            <div key={hold._id} className="p-4 bg-rose-500/5 border border-rose-500/10 rounded-2xl flex items-center justify-between group">
                                                <div>
                                                    <p className="text-xs font-black text-rose-400">{hold.currency} {hold.amount.toLocaleString()}</p>
                                                    <p className="text-[10px] text-slate-500 font-medium italic mt-1 font-sans">"{hold.reason}"</p>
                                                </div>
                                                <button
                                                    onClick={() => handleRelease(hold._id)}
                                                    className="px-3 py-1 bg-white hover:bg-slate-200 text-[#07090E] text-[9px] font-black rounded-lg transition-all opacity-0 group-hover:opacity-100"
                                                >
                                                    RELEASE
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
 
                            {/* Recent Transactions */}
                            <div>
                                <h5 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Financial History (Last 10)</h5>
                                <div className="space-y-2 font-mono">
                                    {txs.map(tx => (
                                        <div key={tx._id} className="p-3 bg-[#07090E]/20 border border-[#1E2533] rounded-xl flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${tx.type === 'DEPOSIT' ? 'text-emerald-400 bg-emerald-500/10' : 'text-primary-orange bg-primary-orange-light'
                                                    }`}>
                                                    {tx.type === 'DEPOSIT' ? <ArrowDownRight size={14} /> : <ArrowUpRight size={14} />}
                                                </div>
                                                <div>
                                                    <p className="text-xs font-bold text-white leading-none mb-1 font-sans">{tx.type}</p>
                                                    <p className="text-[9px] text-slate-500">{new Date(tx.createdAt).toLocaleDateString()}</p>
                                                </div>
                                            </div>
                                            <span className={`text-xs font-black ${tx.type === 'DEPOSIT' ? 'text-emerald-400' : 'text-primary-orange'}`}>
                                                {tx.currency} {tx.amount.toLocaleString()}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
