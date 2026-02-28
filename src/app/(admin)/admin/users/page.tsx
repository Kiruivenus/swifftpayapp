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
    }, [page, search, statusFilter]);

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
        <div className="space-y-8 animate-in fade-in duration-700">
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
                        className="bg-slate-800 border-slate-700 text-white rounded-xl px-4 py-2.5 focus:ring-indigo-500/20 text-sm font-semibold outline-none"
                    >
                        <option value="">All Status</option>
                        <option value="ACTIVE">Active</option>
                        <option value="BLOCKED">Blocked</option>
                        <option value="PENDING_VERIFICATION">Pending</option>
                    </select>
                    <select
                        value={kycFilter}
                        onChange={(e) => setKycFilter(e.target.value)}
                        className="bg-slate-800 border-slate-700 text-white rounded-xl px-4 py-2.5 focus:ring-indigo-500/20 text-sm font-semibold outline-none"
                    >
                        <option value="">KYC: All</option>
                        <option value="NOT_STARTED">Not Started</option>
                        <option value="PENDING">Pending</option>
                        <option value="APPROVED">Approved</option>
                        <option value="REJECTED">Rejected</option>
                    </select>
                    <button
                        onClick={() => setShowAddAdmin(true)}
                        className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl transition-all shadow-lg shadow-indigo-600/20"
                    >
                        <UserPlus size={18} />
                        Add Admin
                    </button>
                </div>
            </div>

            {/* Search Bar */}
            <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
                <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search by name, email, or phone..."
                    className="w-full pl-12 pr-4 py-3 bg-slate-900/50 border border-slate-800 rounded-2xl text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 transition-all"
                />
            </div>

            {/* Users Table */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-3xl overflow-hidden backdrop-blur-sm min-h-[400px] flex flex-col">
                <div className="overflow-x-auto flex-1">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-800/30 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                <th className="px-6 py-4">User Details</th>
                                <th className="px-6 py-4">Contact</th>
                                <th className="px-6 py-4">KYC Status</th>
                                <th className="px-6 py-4">Role</th>
                                <th className="px-6 py-4">Balances</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="py-20 text-center">
                                        <Loader2 className="animate-spin text-indigo-500 mx-auto" size={40} />
                                        <p className="text-slate-500 mt-4 font-bold uppercase tracking-widest text-xs">Fetching Platform Data...</p>
                                    </td>
                                </tr>
                            ) : users.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="py-20 text-center">
                                        <AlertCircle className="text-slate-700 mx-auto mb-4" size={48} />
                                        <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">No users found matching your criteria</p>
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
                <div className="p-6 border-t border-slate-800 flex items-center justify-between">
                    <p className="text-sm text-slate-500 font-medium">
                        Showing {(page - 1) * 10 + 1} to {Math.min(page * 10, total)} of {total} users
                    </p>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1}
                            className="p-2 text-slate-500 hover:text-white transition-colors disabled:opacity-30 hover:bg-slate-800 rounded-lg"
                        >
                            <ChevronLeft size={20} />
                        </button>
                        <div className="flex items-center gap-1">
                            {Array.from({ length: Math.min(5, Math.ceil(total / 10)) }).map((_, i) => (
                                <button
                                    key={i}
                                    onClick={() => setPage(i + 1)}
                                    className={`w-8 h-8 rounded-lg font-bold text-xs flex items-center justify-center transition-all ${page === i + 1 ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-slate-400 hover:bg-slate-800'
                                        }`}
                                >
                                    {i + 1}
                                </button>
                            ))}
                        </div>
                        <button
                            onClick={() => setPage(p => Math.min(Math.ceil(total / 10), p + 1))}
                            disabled={page >= Math.ceil(total / 10)}
                            className="p-2 text-slate-500 hover:text-white transition-colors hover:bg-slate-800 rounded-lg disabled:opacity-30"
                        >
                            <ChevronRight size={20} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

function UserTableRow({ user, onView, onFreeze, onStatusChange, onRefresh }: any) {
    const [showMenu, setShowMenu] = useState(false);

    const kycColor = user.kycStatus === 'APPROVED' ? 'text-emerald-400 bg-emerald-500/10' :
        user.kycStatus === 'PENDING' ? 'text-amber-400 bg-amber-500/10' :
            'text-rose-400 bg-rose-500/10';

    const getRoleColor = (role: string) => {
        switch (role) {
            case 'super_admin': return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
            case 'admin': return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20';
            case 'finance': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
            case 'support': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
            case 'kyc_reviewer': return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
            case 'auditor': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
            default: return 'bg-slate-800 text-slate-400 border-slate-700';
        }
    };

    return (
        <tr className="group hover:bg-slate-800/20 transition-all duration-300">
            <td className="px-6 py-5">
                <div className="flex items-center gap-4">
                    <div className="w-11 h-11 rounded-2xl bg-slate-800 flex items-center justify-center font-bold text-sm text-indigo-400 border border-slate-700/50 group-hover:border-indigo-500/30 transition-all shadow-inner uppercase">
                        {user.username?.[0] || 'U'}
                    </div>
                    <div>
                        <p className="text-sm font-bold text-white leading-none mb-1">{user.fullName || user.username}</p>
                        <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">@{user.username}</p>
                    </div>
                </div>
            </td>
            <td className="px-6 py-5">
                <div className="space-y-1.5">
                    <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
                        <Mail size={12} className="text-slate-600" />
                        {user.email}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
                        <Smartphone size={12} className="text-slate-600" />
                        {user.phoneE164}
                    </div>
                </div>
            </td>
            <td className="px-6 py-5">
                <div className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-full border border-current opacity-80 ${kycColor}`}>
                    <div className={`w-1 h-1 rounded-full ${user.kycStatus === 'APPROVED' ? 'bg-emerald-400' : 'bg-current'}`} />
                    <span className="text-[10px] font-bold uppercase tracking-widest">{user.kycStatus}</span>
                </div>
                <p className="text-[10px] text-slate-600 mt-1.5 font-bold uppercase tracking-tight pl-1">Joined {new Date(user.createdAt).toLocaleDateString()}</p>
            </td>
            <td className="px-6 py-5">
                <div className={`inline-flex px-2 py-0.5 rounded-md border text-[10px] font-bold uppercase tracking-wider ${getRoleColor(user.role)}`}>
                    {user.role}
                </div>
            </td>
            <td className="px-6 py-5">
                <p className="text-xs font-bold text-white">KES {user.kesBalance?.toLocaleString() || 0}</p>
                <p className="text-[10px] font-bold text-slate-500 mt-0.5">{user.usdtBalance?.toLocaleString() || 0} USDT</p>
            </td>
            <td className="px-6 py-5 text-right">
                <div className="flex items-center justify-end gap-1 relative">
                    <button onClick={onView} className="p-2 text-slate-500 hover:text-indigo-400 hover:bg-slate-800 rounded-lg transition-all" title="View Profile">
                        <Eye size={18} />
                    </button>
                    <button onClick={onFreeze} className="p-2 text-slate-500 hover:text-amber-400 hover:bg-slate-800 rounded-lg transition-all" title="Freeze Funds">
                        <Shield size={18} />
                    </button>
                    <button
                        onClick={onStatusChange}
                        className={`p-2 transition-all rounded-lg ${user.status === 'BLOCKED' ? 'text-emerald-400 hover:bg-emerald-500/10' : 'text-slate-500 hover:text-rose-400 hover:bg-rose-500/10'}`}
                        title={user.status === 'BLOCKED' ? 'Unblock User' : 'Block User'}
                    >
                        {user.status === 'BLOCKED' ? <Unlock size={18} /> : <Ban size={18} />}
                    </button>
                    <div className="w-px h-6 bg-slate-800 mx-1" />

                    <button
                        onClick={() => setShowMenu(!showMenu)}
                        className="p-2 text-slate-500 hover:text-white hover:bg-slate-800 rounded-lg transition-all"
                    >
                        <MoreVertical size={18} />
                    </button>

                    {showMenu && (
                        <>
                            <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
                            <div className="absolute right-0 top-full mt-2 w-48 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl z-20 py-2 animate-in fade-in slide-in-from-top-2 duration-200">
                                <button className="w-full text-left px-4 py-2 text-xs font-bold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors flex items-center gap-2">
                                    <RefreshCcw size={14} /> Reset Password
                                </button>
                                <button className="w-full text-left px-4 py-2 text-xs font-bold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors flex items-center gap-2">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
                <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
                    <h3 className="text-xl font-bold text-white">Promote to Admin</h3>
                    <button onClick={onClose} className="text-slate-500 hover:text-white">&times;</button>
                </div>
                <div className="p-6 space-y-6">
                    <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 block">Search User</label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Email or Username"
                                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm text-white outline-none focus:border-indigo-500/50"
                            />
                            <button onClick={handleSearch} className="px-4 py-2 bg-slate-800 text-white text-xs font-bold rounded-xl hover:bg-slate-700 transition-colors">
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
                                    className={`w-full text-left p-3 rounded-xl border transition-all flex items-center gap-3 ${selectedUser?._id === u._id ? 'border-indigo-500 bg-indigo-500/5' : 'border-slate-800 bg-slate-950/50 hover:border-slate-700'
                                        }`}
                                >
                                    <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-xs font-bold text-indigo-400">
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
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 block">Assign Role</label>
                            <select
                                value={role}
                                onChange={(e) => setRole(e.target.value)}
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white font-bold outline-none focus:border-indigo-500/50 appearance-none"
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
                <div className="p-6 bg-slate-950/30 border-t border-slate-800 flex gap-3">
                    <button onClick={onClose} className="flex-1 py-3 text-xs font-bold text-slate-400 hover:text-white transition-colors uppercase tracking-widest">Cancel</button>
                    <button
                        onClick={handlePromote}
                        disabled={!selectedUser || submitting}
                        className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-black rounded-xl transition-all shadow-lg shadow-indigo-600/20 uppercase tracking-widest"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
                <div className="p-6 border-b border-slate-800">
                    <h3 className="text-xl font-bold text-white flex items-center gap-3">
                        <Shield className="text-amber-400" size={24} />
                        Freeze User Funds
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 uppercase font-bold tracking-widest">Acting on @{user.username}</p>
                </div>
                <div className="p-6 space-y-5">
                    <div className="grid grid-cols-2 gap-3 p-1 bg-slate-950 border border-slate-800 rounded-xl">
                        {['KES', 'USDT'].map(c => (
                            <button
                                key={c}
                                onClick={() => setCurrency(c)}
                                className={`py-2 text-[10px] font-black rounded-lg transition-all ${currency === c ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}
                            >
                                {c}
                            </button>
                        ))}
                    </div>
                    <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 block">Amount to Lock</label>
                        <input
                            type="number"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder="0.00"
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white font-mono text-lg focus:border-amber-500/50 outline-none"
                        />
                    </div>
                    <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 block">Reason (Min 10 chars)</label>
                        <textarea
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            placeholder="Describe why funds are being restricted..."
                            rows={3}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white resize-none focus:border-amber-500/50 outline-none"
                        />
                    </div>
                </div>
                <div className="p-6 border-t border-slate-800 flex gap-3 bg-slate-950/30">
                    <button onClick={onClose} className="flex-1 py-3 text-xs font-bold text-slate-400 uppercase tracking-widest">Cancel</button>
                    <button
                        onClick={handleFreeze}
                        disabled={submitting}
                        className="flex-1 py-3 bg-rose-600 hover:bg-rose-500 text-white text-xs font-black rounded-xl transition-all shadow-lg shadow-rose-600/20 uppercase tracking-widest"
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
        <div className="fixed inset-0 z-50 overflow-hidden flex justify-end animate-in fade-in duration-500">
            <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative w-full max-w-2xl bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col h-full animate-in slide-in-from-right duration-500">
                <div className="p-6 border-b border-slate-800 flex items-center justify-between">
                    <h3 className="text-xl font-bold text-white">User Intelligence Profile</h3>
                    <button onClick={onClose} className="p-2 text-slate-500 hover:text-white transition-colors">&times;</button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
                    {loading ? (
                        <div className="h-full flex items-center justify-center"><Loader2 className="animate-spin text-indigo-500" size={40} /></div>
                    ) : (
                        <>
                            {/* Profile Header */}
                            <div className="flex items-center gap-6 p-6 bg-slate-950/30 rounded-3xl border border-slate-800/50 shadow-inner">
                                <div className="w-20 h-20 rounded-3xl bg-slate-800 flex items-center justify-center text-4xl font-black text-indigo-500 border border-slate-700 shadow-lg capitalize">
                                    {summary?.user?.username?.[0]}
                                </div>
                                <div>
                                    <h4 className="text-3xl font-black text-white capitalize">{summary?.user?.username}</h4>
                                    <p className="text-slate-500 font-medium mb-2">{summary?.user?.email}</p>
                                    <div className={`inline-flex px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-current ${summary?.user?.status === 'ACTIVE' ? 'text-emerald-400 bg-emerald-500/10' : 'text-rose-400 bg-rose-500/10'
                                        }`}>
                                        {summary?.user?.status}
                                    </div>
                                </div>
                            </div>

                            {/* Wallet Stats */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 p-2 opacity-5"><Wallet size={48} /></div>
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">KES Ledger</p>
                                    <p className="text-2xl font-black text-white font-mono">{(summary?.wallet?.kesBalance || 0).toLocaleString()}</p>
                                    {summary?.wallet?.lockedKES > 0 && (
                                        <div className="flex items-center gap-1.5 mt-2 text-rose-400 font-bold text-[10px]">
                                            <Shield size={12} />
                                            {summary.wallet.lockedKES.toLocaleString()} Frozen
                                        </div>
                                    )}
                                </div>
                                <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl relative overflow-hidden group">
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">USDT Ledger</p>
                                    <p className="text-2xl font-black text-indigo-400 font-mono">{(summary?.wallet?.usdtBalance || 0).toLocaleString()}</p>
                                    {summary?.wallet?.lockedUSDT > 0 && (
                                        <div className="flex items-center gap-1.5 mt-2 text-rose-400 font-bold text-[10px]">
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
                                    <div className="space-y-3">
                                        {holds.filter(h => h.status === 'ACTIVE').map(hold => (
                                            <div key={hold._id} className="p-4 bg-rose-500/5 border border-rose-500/20 rounded-2xl flex items-center justify-between group">
                                                <div>
                                                    <p className="text-[11px] font-black text-rose-400">{hold.currency} {hold.amount.toLocaleString()}</p>
                                                    <p className="text-[10px] text-slate-500 font-medium italic mt-0.5">"{hold.reason}"</p>
                                                </div>
                                                <button
                                                    onClick={() => handleRelease(hold._id)}
                                                    className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-white text-[9px] font-black rounded-lg transition-all opacity-0 group-hover:opacity-100"
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
                                <div className="space-y-2">
                                    {txs.map(tx => (
                                        <div key={tx._id} className="p-3 bg-slate-950/50 border border-slate-800/50 rounded-xl flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${tx.type === 'DEPOSIT' ? 'text-emerald-400 bg-emerald-500/10' : 'text-indigo-400 bg-indigo-500/10'
                                                    }`}>
                                                    {tx.type === 'DEPOSIT' ? <ArrowDownRight size={14} /> : <ArrowUpRight size={14} />}
                                                </div>
                                                <div>
                                                    <p className="text-[11px] font-bold text-white">{tx.type}</p>
                                                    <p className="text-[9px] text-slate-500">{new Date(tx.createdAt).toLocaleDateString()}</p>
                                                </div>
                                            </div>
                                            <span className={`text-[11px] font-black ${tx.type === 'DEPOSIT' ? 'text-emerald-400' : 'text-indigo-400'}`}>
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

