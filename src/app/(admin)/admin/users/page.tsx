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
    AlertCircle
} from 'lucide-react';
import { adminService } from '@/services/admin.service';

export default function UsersPage() {
    const [users, setUsers] = useState<any[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchUsers = useCallback(async () => {
        try {
            setLoading(true);
            const data = await adminService.getUsers({
                search,
                status: statusFilter,
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
                    <button className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl transition-all shadow-lg shadow-indigo-600/20">
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
                                        onStatusChange={() => handleBlockUnblock(user)}
                                    />
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

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

function UserTableRow({ user, onStatusChange }: any) {
    const kycColor = user.kycStatus === 'APPROVED' ? 'text-emerald-400 bg-emerald-500/10' :
        user.kycStatus === 'PENDING' ? 'text-amber-400 bg-amber-500/10' :
            'text-rose-400 bg-rose-500/10';

    const getRoleColor = (role: string) => {
        switch (role) {
            case 'admin': return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20';
            case 'finance': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
            case 'support': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
            case 'kyc_reviewer': return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
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
                <div className="w-16 h-1 bg-slate-800 rounded-full mt-2 overflow-hidden">
                    <div className="h-full bg-indigo-500 w-1/3 shadow-[0_0_8px_rgba(99,102,241,0.5)]" />
                </div>
            </td>
            <td className="px-6 py-5 text-right">
                <div className="flex items-center justify-end gap-1">
                    <button className="p-2 text-slate-500 hover:text-indigo-400 hover:bg-slate-800 rounded-lg transition-all" title="View Profile">
                        <Eye size={18} />
                    </button>
                    <button className="p-2 text-slate-500 hover:text-amber-400 hover:bg-slate-800 rounded-lg transition-all" title="Security / PIN">
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
                    <button className="p-2 text-slate-500 hover:text-white hover:bg-slate-800 rounded-lg transition-all">
                        <MoreVertical size={18} />
                    </button>
                </div>
            </td>
        </tr>
    );
}

