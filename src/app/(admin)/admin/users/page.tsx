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
    ArrowUpRight,
    KeyRound,
    Activity,
    FileText,
    Send,
    Calendar,
    DollarSign,
    TrendingUp,
    Trash2,
    Fingerprint,
    MapPin,
    Ticket,
    X,
    UserCheck,
    Lock
} from 'lucide-react';
import { adminService } from '@/services/admin.service';

export default function UsersPage() {
    // List & Pagination State
    const [users, setUsers] = useState<any[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Advanced Search & Categorization
    const [search, setSearch] = useState('');
    const [searchType, setSearchType] = useState('ALL'); // ALL, ID, USERNAME, EMAIL, PHONE, REFERRAL, WALLET, TX

    // Filters Toggling & Values
    const [showFilters, setShowFilters] = useState(false);
    const [statusFilter, setStatusFilter] = useState('');
    const [kycFilter, setKycFilter] = useState('');
    const [countryFilter, setCountryFilter] = useState('');
    const [depositMin, setDepositMin] = useState('');
    const [depositMax, setDepositMax] = useState('');
    const [withdrawMin, setWithdrawMin] = useState('');
    const [withdrawMax, setWithdrawMax] = useState('');
    const [referralCountMin, setReferralCountMin] = useState('');
    const [referralCountMax, setReferralCountMax] = useState('');
    const [regDateStart, setRegDateStart] = useState('');
    const [regDateEnd, setRegDateEnd] = useState('');

    // Analytics State
    const [analytics, setAnalytics] = useState<any>(null);
    const [analyticsLoading, setAnalyticsLoading] = useState(true);

    // Custom Alert State
    const [statusAlert, setStatusAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    const triggerAlert = useCallback((type: 'success' | 'error', message: string) => {
        setStatusAlert({ type, message });
        setTimeout(() => setStatusAlert(null), 5000);
    }, []);

    // Modals & Drawer State
    const [showAddAdmin, setShowAddAdmin] = useState(false);
    const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
    const [showFreezeModal, setShowFreezeModal] = useState<any | null>(null);

    // Fetch Analytics Metrics
    const fetchAnalytics = useCallback(async () => {
        try {
            setAnalyticsLoading(true);
            const data = await adminService.getUserAnalytics();
            if (data.success) {
                setAnalytics(data.analytics);
            }
        } catch (err) {
            console.error("Failed to load user analytics:", err);
        } finally {
            setAnalyticsLoading(false);
        }
    }, []);

    // Fetch Users list with full parameters
    const fetchUsers = useCallback(async () => {
        try {
            setLoading(true);
            // Construct query parameters
            const params: any = {
                page,
                limit: 10,
                status: statusFilter,
                kycStatus: kycFilter,
                country: countryFilter,
                depositMin,
                depositMax,
                withdrawMin,
                withdrawMax,
                referralCountMin,
                referralCountMax,
                regDateStart,
                regDateEnd
            };

            // Setup search key based on categorization
            if (search.trim()) {
                if (searchType === 'ALL') {
                    params.search = search.trim();
                } else {
                    // For typed searches, we prefix or pass as standard query value
                    params.search = search.trim();
                }
            }

            const data = await adminService.getUsers(params);
            setUsers(data.users || []);
            setTotal(data.total || 0);
            setError(null);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [
        page,
        search,
        searchType,
        statusFilter,
        kycFilter,
        countryFilter,
        depositMin,
        depositMax,
        withdrawMin,
        withdrawMax,
        referralCountMin,
        referralCountMax,
        regDateStart,
        regDateEnd
    ]);

    useEffect(() => {
        fetchAnalytics();
    }, [fetchAnalytics]);

    useEffect(() => {
        const timer = setTimeout(() => fetchUsers(), 500);
        return () => clearTimeout(timer);
    }, [fetchUsers]);

    // Handle Quick Action Block/Unblock
    const handleBlockUnblock = async (user: any) => {
        const newStatus = user.status === 'BLOCKED' ? 'ACTIVE' : 'BLOCKED';
        if (!confirm(`Are you sure you want to ${newStatus.toLowerCase()} ${user.username}?`)) return;

        try {
            await adminService.updateUser(user._id, { status: newStatus });
            fetchUsers();
            fetchAnalytics();
            triggerAlert('success', `User successfully ${newStatus === 'ACTIVE' ? 'unsuspended' : 'suspended'}.`);
        } catch (err: any) {
            triggerAlert('error', err.message || 'Failed to update user status.');
        }
    };

    // Reset all filter options
    const resetFilters = () => {
        setStatusFilter('');
        setKycFilter('');
        setCountryFilter('');
        setDepositMin('');
        setDepositMax('');
        setWithdrawMin('');
        setWithdrawMax('');
        setReferralCountMin('');
        setReferralCountMax('');
        setRegDateStart('');
        setRegDateEnd('');
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-700 font-sans text-slate-100 min-h-screen pb-20 select-none">
            
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h2 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
                        <Users className="text-[#FF6B00]" />
                        User Operations Center
                    </h2>
                    <p className="text-slate-400 mt-1 text-sm font-medium">Lifecycle management, compliance audits, ledger control, and real-time security logs.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => { fetchUsers(); fetchAnalytics(); }}
                        className="p-3 bg-[#0D1017] hover:bg-slate-900 border border-[#1E2533] rounded-xl text-slate-400 hover:text-white transition-all"
                        title="Refresh Data"
                    >
                        <RefreshCcw size={16} />
                    </button>
                    <button
                        onClick={() => setShowAddAdmin(true)}
                        className="flex items-center gap-2 px-6 py-3 bg-[#FF6B00] hover:bg-[#FF7A00] text-white text-xs font-black rounded-xl transition-all shadow-lg shadow-[#FF6B00]/10 uppercase tracking-widest"
                    >
                        <UserPlus size={16} />
                        Add Admin
                    </button>
                </div>
            </div>

            {/* KPI Metrics Dashboard Panel */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                {analyticsLoading ? (
                    Array.from({ length: 5 }).map((_, idx) => (
                        <div key={idx} className="h-28 bg-[#0D1017] border border-[#1E2533] rounded-2xl animate-pulse" />
                    ))
                ) : (
                    <>
                        <div className="p-5 bg-[#0D1017] border border-[#1E2533] rounded-2xl shadow-xl flex flex-col justify-between">
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Total Users</span>
                                <div className="text-[9px] font-black text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full flex items-center gap-0.5">
                                    <TrendingUp size={10} />
                                    {analytics?.trends?.userTrend || '0%'}
                                </div>
                            </div>
                            <h4 className="text-2xl font-black tracking-tight text-white mt-3 font-mono">
                                {analytics?.totalUsers?.toLocaleString() || 0}
                            </h4>
                        </div>

                        <div className="p-5 bg-[#0D1017] border border-[#1E2533] rounded-2xl shadow-xl flex flex-col justify-between">
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Active Today</span>
                                <div className="text-[9px] font-black text-[#FF6B00] bg-[#FF6B00]/10 px-2 py-0.5 rounded-full">
                                    {analytics?.trends?.activeTrend || '0%'}
                                </div>
                            </div>
                            <h4 className="text-2xl font-black tracking-tight text-white mt-3 font-mono">
                                {analytics?.activeUsersToday?.toLocaleString() || 0}
                            </h4>
                        </div>

                        <div className="p-5 bg-[#0D1017] border border-[#1E2533] rounded-2xl shadow-xl flex flex-col justify-between">
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Verified (KYC)</span>
                                <div className="text-[9px] font-black text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                                    {((analytics?.verifiedUsers / analytics?.totalUsers) * 100 || 0).toFixed(0)}%
                                </div>
                            </div>
                            <h4 className="text-2xl font-black tracking-tight text-white mt-3 font-mono">
                                {analytics?.verifiedUsers?.toLocaleString() || 0}
                            </h4>
                        </div>

                        <div className="p-5 bg-[#0D1017] border border-[#1E2533] rounded-2xl shadow-xl flex flex-col justify-between">
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Pending KYC</span>
                                <div className="text-[9px] font-black text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full uppercase tracking-wider">
                                    {analytics?.pendingKycUsers || 0} Req
                                </div>
                            </div>
                            <h4 className="text-2xl font-black tracking-tight text-white mt-3 font-mono">
                                {analytics?.pendingKycUsers?.toLocaleString() || 0}
                            </h4>
                        </div>

                        <div className="p-5 bg-[#0D1017] border border-[#1E2533] rounded-2xl shadow-xl flex flex-col justify-between">
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Suspended</span>
                                <div className="text-[9px] font-black text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-full">
                                    {((analytics?.suspendedUsers / analytics?.totalUsers) * 100 || 0).toFixed(1)}%
                                </div>
                            </div>
                            <h4 className="text-2xl font-black tracking-tight text-white mt-3 font-mono">
                                {analytics?.suspendedUsers?.toLocaleString() || 0}
                            </h4>
                        </div>
                    </>
                )}
            </div>

            {/* Advanced Search & Filtering Command Center */}
            <div className="bg-[#0D1017]/80 border border-[#1E2533] rounded-2xl p-5 space-y-4 backdrop-blur-md">
                
                {/* Search Bar Input Group */}
                <div className="flex flex-col md:flex-row gap-3">
                    <div className="relative flex-1 flex">
                        {/* Search Type Dropdown Segment */}
                        <select
                            value={searchType}
                            onChange={(e) => setSearchType(e.target.value)}
                            className="bg-[#07090E] border-r-0 border-[#1E2533] text-slate-400 px-3 py-3 rounded-l-xl text-xs font-bold uppercase tracking-wider outline-none focus:border-slate-700 appearance-none cursor-pointer"
                            style={{ minWidth: '120px' }}
                        >
                            <option value="ALL">All Fields</option>
                            <option value="ID">User ID</option>
                            <option value="EMAIL">Email</option>
                            <option value="PHONE">Phone</option>
                            <option value="REFERRAL">Referral Code</option>
                            <option value="WALLET">USDT Address</option>
                        </select>
                        <div className="relative flex-1">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={18} />
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder={
                                    searchType === 'ALL' ? "Search by username, email, phone, name..." :
                                    searchType === 'ID' ? "Enter exact MongoDB User ID..." :
                                    searchType === 'EMAIL' ? "Enter email address..." :
                                    searchType === 'PHONE' ? "Enter phone number..." :
                                    searchType === 'REFERRAL' ? "Enter referral code..." :
                                    "Enter USDT ERC20/TRC20 Address..."
                                }
                                className="w-full pl-12 pr-4 py-3 bg-[#07090E] border border-[#1E2533] rounded-r-xl text-slate-200 placeholder:text-slate-700 focus:outline-none focus:border-[#FF6B00]/60 transition-all font-medium text-sm"
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className={`flex items-center gap-2 px-5 py-3 border rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                                showFilters ? 'bg-[#FF6B00]/10 border-[#FF6B00] text-[#FF6B00]' : 'bg-[#07090E] border-[#1E2533] text-slate-400 hover:text-white'
                            }`}
                        >
                            <Filter size={16} />
                            Advanced Filters
                        </button>
                    </div>
                </div>

                {/* Expandable Advanced Filters Accordion */}
                {showFilters && (
                    <div className="p-5 bg-[#07090E]/60 border border-[#1E2533]/80 rounded-xl grid grid-cols-1 md:grid-cols-4 gap-4 animate-in slide-in-from-top-2 duration-300">
                        
                        <div className="space-y-1">
                            <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest pl-1">KYC STATUS</label>
                            <select
                                value={kycFilter}
                                onChange={(e) => setKycFilter(e.target.value)}
                                className="w-full bg-[#07090E] border border-[#1E2533] text-slate-300 rounded-lg px-3 py-2 text-xs outline-none focus:border-[#FF6B00]"
                            >
                                <option value="">All Statuses</option>
                                <option value="NOT_STARTED">Not Started</option>
                                <option value="PENDING">Pending Review</option>
                                <option value="APPROVED">Approved</option>
                                <option value="REJECTED">Rejected</option>
                            </select>
                        </div>

                        <div className="space-y-1">
                            <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest pl-1">USER STATUS</label>
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="w-full bg-[#07090E] border border-[#1E2533] text-slate-300 rounded-lg px-3 py-2 text-xs outline-none focus:border-[#FF6B00]"
                            >
                                <option value="">All Account Status</option>
                                <option value="ACTIVE">Active</option>
                                <option value="BLOCKED">Suspended</option>
                                <option value="PENDING_VERIFICATION">Unverified</option>
                            </select>
                        </div>

                        <div className="space-y-1">
                            <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest pl-1">Country ISO Code</label>
                            <input
                                type="text"
                                placeholder="e.g. KE, UG, TZ"
                                value={countryFilter}
                                onChange={(e) => setCountryFilter(e.target.value)}
                                className="w-full bg-[#07090E] border border-[#1E2533] text-slate-300 rounded-lg px-3 py-2 text-xs outline-none focus:border-[#FF6B00]"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-1">
                                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest pl-1">MIN DEPOSIT</label>
                                <input
                                    type="number"
                                    placeholder="Min"
                                    value={depositMin}
                                    onChange={(e) => setDepositMin(e.target.value)}
                                    className="w-full bg-[#07090E] border border-[#1E2533] text-slate-300 rounded-lg px-3 py-2 text-xs outline-none focus:border-[#FF6B00]"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest pl-1">MAX DEPOSIT</label>
                                <input
                                    type="number"
                                    placeholder="Max"
                                    value={depositMax}
                                    onChange={(e) => setDepositMax(e.target.value)}
                                    className="w-full bg-[#07090E] border border-[#1E2533] text-slate-300 rounded-lg px-3 py-2 text-xs outline-none focus:border-[#FF6B00]"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-1">
                                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest pl-1">MIN WITHDRAWAL</label>
                                <input
                                    type="number"
                                    placeholder="Min"
                                    value={withdrawMin}
                                    onChange={(e) => setWithdrawMin(e.target.value)}
                                    className="w-full bg-[#07090E] border border-[#1E2533] text-slate-300 rounded-lg px-3 py-2 text-xs outline-none focus:border-[#FF6B00]"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest pl-1">MAX WITHDRAWAL</label>
                                <input
                                    type="number"
                                    placeholder="Max"
                                    value={withdrawMax}
                                    onChange={(e) => setWithdrawMax(e.target.value)}
                                    className="w-full bg-[#07090E] border border-[#1E2533] text-slate-300 rounded-lg px-3 py-2 text-xs outline-none focus:border-[#FF6B00]"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-1">
                                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest pl-1">MIN REFERRALS</label>
                                <input
                                    type="number"
                                    placeholder="0"
                                    value={referralCountMin}
                                    onChange={(e) => setReferralCountMin(e.target.value)}
                                    className="w-full bg-[#07090E] border border-[#1E2533] text-slate-300 rounded-lg px-3 py-2 text-xs outline-none focus:border-[#FF6B00]"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest pl-1">MAX REFERRALS</label>
                                <input
                                    type="number"
                                    placeholder="100+"
                                    value={referralCountMax}
                                    onChange={(e) => setReferralCountMax(e.target.value)}
                                    className="w-full bg-[#07090E] border border-[#1E2533] text-slate-300 rounded-lg px-3 py-2 text-xs outline-none focus:border-[#FF6B00]"
                                />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest pl-1">REGISTRATION START</label>
                            <input
                                type="date"
                                value={regDateStart}
                                onChange={(e) => setRegDateStart(e.target.value)}
                                className="w-full bg-[#07090E] border border-[#1E2533] text-slate-300 rounded-lg px-3 py-2 text-xs outline-none focus:border-[#FF6B00]"
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest pl-1">REGISTRATION END</label>
                            <input
                                type="date"
                                value={regDateEnd}
                                onChange={(e) => setRegDateEnd(e.target.value)}
                                className="w-full bg-[#07090E] border border-[#1E2533] text-slate-300 rounded-lg px-3 py-2 text-xs outline-none focus:border-[#FF6B00]"
                            />
                        </div>

                        <div className="col-span-full flex justify-end gap-3 mt-2 border-t border-[#1E2533]/50 pt-4">
                            <button
                                onClick={resetFilters}
                                className="px-4 py-2 bg-transparent text-slate-500 hover:text-slate-300 text-xs font-bold uppercase tracking-wider"
                            >
                                Reset Filters
                            </button>
                            <button
                                onClick={() => setShowFilters(false)}
                                className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-black rounded-lg transition-colors uppercase tracking-wider"
                            >
                                Apply & Close
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Responsive User Operations Listing Panel */}
            <div className="bg-[#0D1017]/80 border border-[#1E2533] rounded-3xl overflow-hidden backdrop-blur-md min-h-[400px] flex flex-col shadow-2xl">
                
                {/* Desktop View Table */}
                <div className="hidden md:block overflow-x-auto flex-1">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-white/[0.02] text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-[#1E2533]">
                                <th className="px-6 py-4">User Details</th>
                                <th className="px-6 py-4">Contact</th>
                                <th className="px-6 py-4">KYC Status</th>
                                <th className="px-6 py-4">Role</th>
                                <th className="px-6 py-4">Ledger Balance</th>
                                <th className="px-6 py-4 text-right">Quick Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#1E2533]">
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="py-24 text-center">
                                        <Loader2 className="animate-spin text-[#FF6B00] mx-auto" size={32} />
                                        <p className="text-slate-500 mt-4 font-bold uppercase tracking-widest text-[9px]">Querying User Ledger Collections...</p>
                                    </td>
                                </tr>
                            ) : users.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="py-24 text-center">
                                        <AlertCircle className="text-slate-700 mx-auto mb-3" size={36} />
                                        <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">No users found matching query constraints</p>
                                    </td>
                                </tr>
                            ) : (
                                users.map((user) => (
                                    <UserTableRow
                                        key={user._id}
                                        user={user}
                                        onView={() => setSelectedUserId(user._id)}
                                        onFreeze={() => setShowFreezeModal(user)}
                                        onStatusChange={() => handleBlockUnblock(user)}
                                        onRefresh={fetchUsers}
                                    />
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Mobile View Card Grid */}
                <div className="block md:hidden flex-1 p-4 space-y-4">
                    {loading ? (
                        <div className="py-24 text-center">
                            <Loader2 className="animate-spin text-[#FF6B00] mx-auto" size={32} />
                        </div>
                    ) : users.length === 0 ? (
                        <div className="py-24 text-center">
                            <AlertCircle className="text-slate-700 mx-auto mb-3" size={36} />
                            <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">No matches found</p>
                        </div>
                    ) : (
                        users.map((user) => (
                            <UserMobileCard
                                key={user._id}
                                user={user}
                                onView={() => setSelectedUserId(user._id)}
                                onFreeze={() => setShowFreezeModal(user)}
                                onStatusChange={() => handleBlockUnblock(user)}
                            />
                        ))
                    )}
                </div>

                {/* Modals & Sidebar Containers */}
                {showAddAdmin && (
                    <AddAdminModal
                        onClose={() => setShowAddAdmin(false)}
                        onSuccess={() => { fetchUsers(); fetchAnalytics(); }}
                        triggerAlert={triggerAlert}
                    />
                )}
                {selectedUserId && (
                    <UserDetailsDrawer
                        userId={selectedUserId}
                        onClose={() => setSelectedUserId(null)}
                        onRefresh={() => { fetchUsers(); fetchAnalytics(); }}
                        triggerAlert={triggerAlert}
                    />
                )}
                {showFreezeModal && (
                    <FreezeFundsModal
                        user={showFreezeModal}
                        onClose={() => setShowFreezeModal(null)}
                        onSuccess={() => { fetchUsers(); fetchAnalytics(); }}
                        triggerAlert={triggerAlert}
                    />
                )}

                {/* Pagination Controls */}
                <div className="p-6 border-t border-[#1E2533] flex items-center justify-between bg-white/[0.01]">
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">
                        Showing {total === 0 ? 0 : (page - 1) * 10 + 1} to {Math.min(page * 10, total)} of {total} users
                    </p>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1}
                            className="p-2.5 text-slate-500 hover:text-white transition-colors disabled:opacity-20 hover:bg-white/[0.04] rounded-lg border border-[#1E2533]/50"
                        >
                            <ChevronLeft size={16} />
                        </button>
                        <div className="flex items-center gap-1 font-mono">
                            {Array.from({ length: Math.min(5, Math.ceil(total / 10)) }).map((_, i) => (
                                <button
                                    key={i}
                                    onClick={() => setPage(i + 1)}
                                    className={`w-9 h-9 rounded-lg font-bold text-xs flex items-center justify-center transition-all border ${
                                        page === i + 1 ? 'bg-[#FF6B00] border-[#FF6B00] text-white shadow-lg shadow-[#FF6B00]/10' : 'text-slate-400 border-[#1E2533] hover:bg-white/[0.04]'
                                    }`}
                                >
                                    {i + 1}
                                </button>
                            ))}
                        </div>
                        <button
                            onClick={() => setPage(p => Math.min(Math.ceil(total / 10), p + 1))}
                            disabled={page >= Math.ceil(total / 10)}
                            className="p-2.5 text-slate-500 hover:text-white transition-colors disabled:opacity-20 hover:bg-white/[0.04] rounded-lg border border-[#1E2533]/50"
                        >
                            <ChevronRight size={16} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Global Warning Status Alert Popup */}
            {statusAlert && (
                <div className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-6 py-4 rounded-2xl border backdrop-blur-md shadow-2xl animate-in slide-in-from-top-6 duration-300 ${
                    statusAlert.type === 'success' ? 'bg-emerald-950/90 border-emerald-500/30 text-emerald-300' : 'bg-rose-950/90 border-rose-500/30 text-rose-300'
                }`}>
                    <AlertCircle size={18} className={statusAlert.type === 'success' ? 'text-emerald-400' : 'text-rose-400'} />
                    <p className="text-xs font-bold uppercase tracking-wider">{statusAlert.message}</p>
                </div>
            )}
        </div>
    );
}

// Row layout component for large viewports
function UserTableRow({ user, onView, onFreeze, onStatusChange }: any) {
    const kycColors: Record<string, string> = {
        APPROVED: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
        PENDING: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
        REJECTED: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
        NOT_STARTED: 'text-slate-400 bg-slate-500/10 border-slate-500/20'
    };

    const getRoleColor = (role: string) => {
        const key = role?.toLowerCase();
        switch (key) {
            case 'super_admin': return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
            case 'admin': return 'bg-[#FF6B00]/10 text-[#FF6B00] border-[#FF6B00]/20';
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
                    <div className="w-11 h-11 rounded-2xl bg-[#07090E] flex items-center justify-center font-black text-sm text-[#FF6B00] border border-[#1E2533] group-hover:border-[#FF6B00]/30 transition-all shadow-inner uppercase">
                        {user.username?.[0] || 'U'}
                    </div>
                    <div>
                        <p className="text-sm font-bold text-white leading-none mb-1.5 capitalize">{user.fullName || user.username}</p>
                        <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">@{user.username}</span>
                            {user.status === 'BLOCKED' && (
                                <span className="text-[8px] font-black text-rose-400 bg-rose-500/10 px-1 py-0.5 rounded border border-rose-500/20 uppercase">Suspended</span>
                            )}
                        </div>
                    </div>
                </div>
            </td>
            <td className="px-6 py-5">
                <div className="space-y-1">
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
                <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[9px] font-black uppercase tracking-widest ${kycColors[user.kycStatus] || kycColors.NOT_STARTED}`}>
                    <div className={`w-1 h-1 rounded-full ${user.kycStatus === 'APPROVED' ? 'bg-emerald-400 shadow-[0_0_6px_rgba(16,185,129,0.5)]' : 'bg-current'}`} />
                    <span>{user.kycStatus?.replace('_', ' ')}</span>
                </div>
                <p className="text-[9px] text-slate-600 mt-2 font-bold uppercase tracking-widest">Joined {new Date(user.createdAt).toLocaleDateString()}</p>
            </td>
            <td className="px-6 py-5">
                <div className={`inline-flex px-2 py-0.5 rounded border text-[9px] font-black uppercase tracking-widest ${getRoleColor(user.role)}`}>
                    {user.role}
                </div>
            </td>
            <td className="px-6 py-5 font-mono">
                <p className="text-xs font-bold text-white">KES {user.kesBalance?.toLocaleString() || 0}</p>
                <p className="text-[10px] font-bold text-slate-500 mt-0.5">{user.usdtBalance?.toLocaleString() || 0} USDT</p>
            </td>
            <td className="px-6 py-5 text-right">
                <div className="flex items-center justify-end gap-1">
                    <button onClick={onView} className="p-2 text-slate-500 hover:text-[#FF6B00] hover:bg-white/[0.04] rounded-lg border border-transparent hover:border-white/5 transition-all" title="Open Operations Profile">
                        <Eye size={18} />
                    </button>
                    <button onClick={onFreeze} className="p-2 text-slate-500 hover:text-amber-400 hover:bg-white/[0.04] rounded-lg border border-transparent hover:border-white/5 transition-all" title="Freeze Funds">
                        <Shield size={18} />
                    </button>
                    <button
                        onClick={onStatusChange}
                        className={`p-2 transition-all rounded-lg border border-transparent ${user.status === 'BLOCKED' ? 'text-emerald-400 hover:bg-emerald-500/10 hover:border-emerald-500/20' : 'text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 hover:border-rose-500/20'}`}
                        title={user.status === 'BLOCKED' ? 'Unsuspend User' : 'Suspend User'}
                    >
                        {user.status === 'BLOCKED' ? <Unlock size={18} /> : <Ban size={18} />}
                    </button>
                </div>
            </td>
        </tr>
    );
}

// Card grid component for mobile screen sizes
function UserMobileCard({ user, onView, onFreeze, onStatusChange }: any) {
    return (
        <div className="bg-[#0D1017] border border-[#1E2533] rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-[#1E2533]/50 pb-3">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#07090E] border border-[#1E2533] flex items-center justify-center font-black text-[#FF6B00]">
                        {user.username?.[0]?.toUpperCase()}
                    </div>
                    <div>
                        <h4 className="text-sm font-bold text-white capitalize">{user.fullName || user.username}</h4>
                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider">@{user.username}</span>
                    </div>
                </div>
                <div className="flex items-center gap-1.5">
                    <span className="text-[9px] font-black px-2 py-0.5 rounded bg-white/[0.04] text-slate-400 border border-white/5 uppercase">
                        {user.role}
                    </span>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-left">
                <div className="space-y-1">
                    <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Contact Info</span>
                    <p className="text-xs text-slate-300 font-medium truncate">{user.email}</p>
                    <p className="text-[10px] text-slate-400 font-mono">{user.phoneE164}</p>
                </div>
                <div className="space-y-1">
                    <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Balances</span>
                    <p className="text-xs text-white font-mono font-bold">KES {user.kesBalance?.toLocaleString()}</p>
                    <p className="text-[10px] text-slate-400 font-mono">{user.usdtBalance} USDT</p>
                </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-[#1E2533]/50">
                <div className={`inline-flex px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${
                    user.kycStatus === 'APPROVED' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                }`}>
                    KYC: {user.kycStatus}
                </div>

                <div className="flex gap-2">
                    <button onClick={onView} className="px-3 py-1.5 bg-[#FF6B00]/10 border border-[#FF6B00]/20 hover:border-[#FF6B00] text-[#FF6B00] rounded-lg text-[9px] font-black uppercase tracking-wider transition-all">
                        Manage Profile
                    </button>
                    <button onClick={onFreeze} className="p-1.5 bg-slate-800 border border-[#1E2533] text-slate-300 hover:text-white rounded-lg">
                        <Shield size={14} />
                    </button>
                    <button onClick={onStatusChange} className={`p-1.5 border rounded-lg ${user.status === 'BLOCKED' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-rose-500/10 border-rose-500/20 text-rose-400'}`}>
                        {user.status === 'BLOCKED' ? <Unlock size={14} /> : <Ban size={14} />}
                    </button>
                </div>
            </div>
        </div>
    );
}

// User Promotion to Admin Modal
function AddAdminModal({ onClose, onSuccess, triggerAlert }: { onClose: () => void, onSuccess: () => void, triggerAlert: (type: 'success' | 'error', message: string) => void }) {
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
            triggerAlert("success", "Admin role assigned successfully");
            onSuccess();
            onClose();
        } catch (err: any) {
            triggerAlert("error", err.message || "Failed to assign admin role.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-300 select-none">
            <div className="bg-[#0D1017] border border-[#1E2533] rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
                <div className="p-6 border-b border-[#1E2533] flex items-center justify-between">
                    <h3 className="text-lg font-black text-white uppercase tracking-wider">Promote Platform Administrator</h3>
                    <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors text-2xl font-bold">&times;</button>
                </div>
                <div className="p-6 space-y-6">
                    <div>
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2.5 block pl-1">Search User Accounts</label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Email or Username"
                                className="flex-1 bg-[#07090E] border border-[#1E2533] rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-[#FF6B00] transition-all"
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
                                    className={`w-full text-left p-3 rounded-xl border transition-all flex items-center gap-3 ${
                                        selectedUser?._id === u._id ? 'border-[#FF6B00] bg-[#FF6B00]/5' : 'border-[#1E2533] bg-[#07090E]/30 hover:border-white/10'
                                    }`}
                                >
                                    <div className="w-8 h-8 rounded-lg bg-[#07090E] border border-[#1E2533] flex items-center justify-center text-xs font-black text-[#FF6B00]">
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
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2.5 block pl-1">Assign Access Permission Role</label>
                            <select
                                value={role}
                                onChange={(e) => setRole(e.target.value)}
                                className="w-full bg-[#07090E] border border-[#1E2533] rounded-xl px-4 py-3.5 text-xs font-black uppercase tracking-wider text-slate-300 outline-none focus:border-[#FF6B00] appearance-none cursor-pointer"
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
                        className="flex-1 py-3.5 bg-[#FF6B00] hover:bg-[#FF7A00] disabled:opacity-50 text-white text-xs font-black rounded-xl transition-all shadow-lg shadow-[#FF6B00]/20 uppercase tracking-widest"
                    >
                        {submitting ? <Loader2 size={16} className="animate-spin mx-auto" /> : 'Confirm Assignment'}
                    </button>
                </div>
            </div>
        </div>
    );
}

// User Funds Restriction Hold Modal
function FreezeFundsModal({ user, onClose, onSuccess, triggerAlert }: { user: any, onClose: () => void, onSuccess: () => void, triggerAlert: (type: 'success' | 'error', message: string) => void }) {
    const [currency, setCurrency] = useState('KES');
    const [amount, setAmount] = useState('');
    const [reason, setReason] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const handleFreeze = async () => {
        if (!amount || !reason || reason.length < 10) {
            triggerAlert("error", "Please provide amount and a reason (min 10 chars)");
            return;
        }
        try {
            setSubmitting(true);
            await adminService.createHold(user._id, {
                currency,
                amount: parseFloat(amount),
                reason
            });
            triggerAlert("success", "Funds locked successfully");
            onSuccess();
            onClose();
        } catch (err: any) {
            triggerAlert("error", err.message || "Failed to freeze funds.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-300 font-sans select-none">
            <div className="bg-[#0D1017] border border-[#1E2533] rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
                <div className="p-6 border-b border-[#1E2533]">
                    <h3 className="text-lg font-bold text-white flex items-center gap-3 uppercase tracking-wider">
                        <Shield className="text-amber-500" size={22} />
                        Freeze Wallet Funds
                    </h3>
                    <p className="text-[10px] text-slate-500 mt-1.5 uppercase font-bold tracking-widest">Acting on user: @{user.username}</p>
                </div>
                <div className="p-6 space-y-5">
                    <div className="grid grid-cols-2 gap-2 p-1 bg-[#07090E] border border-[#1E2533] rounded-xl">
                        {['KES', 'USDT'].map(c => (
                            <button
                                key={c}
                                onClick={() => setCurrency(c)}
                                className={`py-2 text-[10px] font-black rounded-lg transition-all ${currency === c ? 'bg-[#FF6B00] text-white shadow-lg shadow-[#FF6B00]/20' : 'text-slate-500 hover:text-white'}`}
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
                            className="w-full bg-[#07090E] border border-[#1E2533] rounded-xl px-4 py-3 text-white font-mono text-base focus:border-[#FF6B00] outline-none"
                        />
                    </div>
                    <div>
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block pl-1">Reason (Min 10 chars)</label>
                        <textarea
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            placeholder="Describe why funds are being restricted..."
                            rows={3}
                            className="w-full bg-[#07090E] border border-[#1E2533] rounded-xl px-4 py-3 text-xs text-white resize-none focus:border-[#FF6B00] outline-none"
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

// Unified Intelligence Drawer (Multi-tab system console)
function UserDetailsDrawer({ userId, onClose, onRefresh, triggerAlert }: { userId: string, onClose: () => void, onRefresh: () => void, triggerAlert: (type: 'success' | 'error', message: string) => void }) {
    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('details'); // details, kyc, wallet, security, history

    // Form inputs and operational action states
    const [editData, setEditData] = useState({ fullName: '', email: '', phone: '', role: '', status: '' });
    const [rejectionReason, setRejectionReason] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [adjustData, setAdjustData] = useState({ currency: 'KES', amount: '', type: 'CREDIT', reason: '' });
    const [notifyData, setNotifyData] = useState({ title: '', message: '', type: 'SYSTEM' });

    const [submitting, setSubmitting] = useState<string | null>(null);

    // Fetch user profile metrics
    const fetchProfile = useCallback(async () => {
        try {
            setLoading(true);
            const data = await adminService.getUserIntelligence(userId);
            if (data.success) {
                setProfile(data);
                setEditData({
                    fullName: data.user.fullName || '',
                    email: data.user.email || '',
                    phone: data.user.phoneNumber || data.user.phoneE164 || '',
                    role: data.user.role || 'user',
                    status: data.user.status || 'ACTIVE'
                });
            }
        } catch (err) {
            console.error("Failed to load user profile details:", err);
        } finally {
            setLoading(false);
        }
    }, [userId]);

    useEffect(() => {
        if (userId) fetchProfile();
    }, [userId, fetchProfile]);

    // Handle Edit User details submit
    const handleUpdateDetails = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setSubmitting('edit');
            await adminService.updateUser(userId, {
                fullName: editData.fullName,
                email: editData.email,
                role: editData.role,
                status: editData.status
            });
            triggerAlert('success', 'User profile details updated successfully.');
            onRefresh();
            fetchProfile();
        } catch (err: any) {
            triggerAlert('error', err.message || 'Failed to update profile details.');
        } finally {
            setSubmitting(null);
        }
    };

    // Handle password reset
    const handleResetPassword = async () => {
        if (!newPassword || newPassword.length < 8) {
            triggerAlert('error', 'Password must be at least 8 characters long.');
            return;
        }
        try {
            setSubmitting('password');
            await adminService.resetUserPassword(userId, newPassword);
            triggerAlert('success', 'Password reset successfully.');
            setNewPassword('');
        } catch (err: any) {
            triggerAlert('error', err.message || 'Failed to reset password.');
        } finally {
            setSubmitting(null);
        }
    };

    // Handle Session Revoke / Force Logout
    const handleForceLogout = async () => {
        if (!confirm('Are you sure you want to terminate all active login sessions for this user?')) return;
        try {
            setSubmitting('logout');
            const data = await adminService.forceUserLogout(userId);
            triggerAlert('success', data.message || 'All user sessions revoked successfully.');
            fetchProfile();
        } catch (err: any) {
            triggerAlert('error', err.message || 'Failed to revoke sessions.');
        } finally {
            setSubmitting(null);
        }
    };

    // Handle individual session revoke
    const handleRevokeSingleSession = async (sessionId: string) => {
        if (!confirm('Revoke this session?')) return;
        try {
            await adminService.revokeSession(sessionId);
            triggerAlert('success', 'Session revoked successfully.');
            fetchProfile();
        } catch (err: any) {
            triggerAlert('error', err.message || 'Failed to revoke session.');
        }
    };

    // Handle KYC status change
    const handleKycApproval = async (approve: boolean) => {
        if (!approve && !rejectionReason.trim()) {
            triggerAlert('error', 'Please provide a rejection reason.');
            return;
        }
        if (!confirm(`Are you sure you want to ${approve ? 'approve' : 'reject'} this KYC credentials?`)) return;

        try {
            setSubmitting('kyc');
            await adminService.updateUser(userId, {
                kycStatus: approve ? 'APPROVED' : 'REJECTED',
                kycRejectionReason: approve ? '' : rejectionReason
            });
            triggerAlert('success', `KYC status updated to ${approve ? 'APPROVED' : 'REJECTED'}.`);
            setRejectionReason('');
            onRefresh();
            fetchProfile();
        } catch (err: any) {
            triggerAlert('error', err.message || 'Failed to update KYC status.');
        } finally {
            setSubmitting(null);
        }
    };

    // Release balance hold
    const handleReleaseHold = async (holdId: string) => {
        const reason = prompt('Reason for releasing funds:');
        if (reason === null) return;
        try {
            await adminService.releaseHold(holdId, reason);
            triggerAlert('success', 'Funds restriction lifted.');
            onRefresh();
            fetchProfile();
        } catch (err: any) {
            triggerAlert('error', err.message || 'Failed to release hold.');
        }
    };

    // Credit / Debit Balance Action
    const handleAdjustBalance = async (e: React.FormEvent) => {
        e.preventDefault();
        const amt = parseFloat(adjustData.amount);
        if (isNaN(amt) || amt <= 0) {
            triggerAlert('error', 'Please enter a positive numeric amount.');
            return;
        }
        if (!adjustData.reason.trim()) {
            triggerAlert('error', 'Please provide a verification reason.');
            return;
        }

        try {
            setSubmitting('balance');
            await adminService.adjustUserBalance(userId, {
                currency: adjustData.currency,
                amount: amt,
                type: adjustData.type as 'CREDIT' | 'DEBIT',
                reason: adjustData.reason
            });
            triggerAlert('success', 'Wallet balance adjusted successfully.');
            setAdjustData({ currency: 'KES', amount: '', type: 'CREDIT', reason: '' });
            onRefresh();
            fetchProfile();
        } catch (err: any) {
            triggerAlert('error', err.message || 'Failed to adjust balance.');
        } finally {
            setSubmitting(null);
        }
    };

    // Send Notification Action
    const handleSendNotification = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!notifyData.title.trim() || !notifyData.message.trim()) {
            triggerAlert('error', 'Please fill out title and message fields.');
            return;
        }

        try {
            setSubmitting('notify');
            await adminService.sendUserNotification(userId, {
                title: notifyData.title,
                message: notifyData.message,
                type: notifyData.type
            });
            triggerAlert('success', 'Notification dispatched successfully.');
            setNotifyData({ title: '', message: '', type: 'SYSTEM' });
            fetchProfile();
        } catch (err: any) {
            triggerAlert('error', err.message || 'Failed to send notification.');
        } finally {
            setSubmitting(null);
        }
    };

    // Export user details as JSON download
    const handleExportData = () => {
        if (!profile) return;
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(profile, null, 2));
        const downloadAnchor = document.createElement('a');
        downloadAnchor.setAttribute("href", dataStr);
        downloadAnchor.setAttribute("download", `swiftpay_user_${profile.user.username}_profile.json`);
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        downloadAnchor.remove();
    };

    // Delete user account
    const handleDeleteUser = async () => {
        if (!confirm('Are you sure you want to delete this user? This will soft-delete user details and terminate all sessions.')) return;
        try {
            setSubmitting('delete');
            const res = await adminService.deleteUser(userId);
            triggerAlert('success', res.message || 'User deleted successfully.');
            onRefresh();
            onClose();
        } catch (err: any) {
            triggerAlert('error', err.message || 'Failed to delete user.');
        } finally {
            setSubmitting(null);
        }
    };

    const getRiskBadgeColor = (score: number) => {
        if (score >= 60) return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
        if (score >= 35) return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
    };

    return (
        <div className="fixed inset-0 z-50 overflow-hidden flex justify-end animate-in fade-in duration-300 select-none">
            <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={onClose} />
            <div className="relative w-full max-w-3xl bg-[#0D1017] border-l border-[#1E2533] shadow-2xl flex flex-col h-full animate-in slide-in-from-right duration-350">
                
                {/* Header Section */}
                <div className="p-6 border-b border-[#1E2533] flex items-center justify-between">
                    <div>
                        <h3 className="text-base font-black text-white uppercase tracking-wider flex items-center gap-2">
                            <Shield className="text-[#FF6B00]" size={18} />
                            Enterprise Ops Desk
                        </h3>
                        <p className="text-[10px] text-slate-500 mt-1 uppercase font-bold tracking-widest">ID: {userId}</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleExportData}
                            className="p-2 text-slate-400 hover:text-white bg-slate-900 hover:bg-slate-800 border border-[#1E2533] rounded-lg transition-all"
                            title="Export Profile Metadata JSON"
                        >
                            <Download size={14} />
                        </button>
                        <button onClick={onClose} className="p-2 text-slate-500 hover:text-white transition-colors bg-slate-900 border border-[#1E2533]/50 rounded-lg">
                            <X size={16} />
                        </button>
                    </div>
                </div>

                {loading ? (
                    <div className="flex-1 flex flex-col items-center justify-center">
                        <Loader2 className="animate-spin text-[#FF6B00] mb-3" size={32} />
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Fetching user intelligence profile...</p>
                    </div>
                ) : (
                    <>
                        {/* Drawer Tabs Selection Bar */}
                        <div className="flex border-b border-[#1E2533] px-6 overflow-x-auto bg-[#07090E]/30 shrink-0 select-none scrollbar-none">
                            {[
                                { id: 'details', label: 'General info', icon: Users },
                                { id: 'kyc', label: 'KYC Audit', icon: UserCheck },
                                { id: 'wallet', label: 'Wallet balance', icon: Wallet },
                                { id: 'security', label: 'Security & risk', icon: Fingerprint },
                                { id: 'history', label: 'Action logs', icon: FileText }
                            ].map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`py-4 px-3 border-b-2 text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all whitespace-nowrap ${
                                        activeTab === tab.id
                                            ? 'border-[#FF6B00] text-[#FF6B00]'
                                            : 'border-transparent text-slate-500 hover:text-slate-300'
                                    }`}
                                >
                                    <tab.icon size={14} />
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        {/* Scrollable View Area */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
                            
                            {/* TAB 1: General Details & Edit Form */}
                            {activeTab === 'details' && (
                                <div className="space-y-6 animate-in fade-in duration-300">
                                    <form onSubmit={handleUpdateDetails} className="space-y-4 text-left">
                                        <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b border-[#1E2533]/50 pb-2">Profile parameters</h4>
                                        
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1.5">
                                                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Username</label>
                                                <input
                                                    type="text"
                                                    disabled
                                                    value={profile?.user.username}
                                                    className="w-full bg-[#07090E] border border-[#1E2533] rounded-xl px-4 py-2.5 text-xs text-slate-500 cursor-not-allowed outline-none"
                                                />
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Full Name</label>
                                                <input
                                                    type="text"
                                                    value={editData.fullName}
                                                    onChange={e => setEditData({ ...editData, fullName: e.target.value })}
                                                    className="w-full bg-[#07090E] border border-[#1E2533] focus:border-[#FF6B00] rounded-xl px-4 py-2.5 text-xs text-slate-200 outline-none"
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-1.5">
                                            <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Email Address</label>
                                            <input
                                                type="email"
                                                value={editData.email}
                                                onChange={e => setEditData({ ...editData, email: e.target.value })}
                                                className="w-full bg-[#07090E] border border-[#1E2533] focus:border-[#FF6B00] rounded-xl px-4 py-2.5 text-xs text-slate-200 outline-none"
                                            />
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1.5">
                                                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Access Role</label>
                                                <select
                                                    value={editData.role}
                                                    onChange={e => setEditData({ ...editData, role: e.target.value })}
                                                    className="w-full bg-[#07090E] border border-[#1E2533] focus:border-[#FF6B00] rounded-xl px-4 py-2.5 text-xs text-slate-300 outline-none cursor-pointer"
                                                >
                                                    <option value="user">Platform User</option>
                                                    <option value="admin">Administrator</option>
                                                    <option value="finance">Finance Manager</option>
                                                    <option value="support">Customer Support</option>
                                                    <option value="kyc_reviewer">KYC Reviewer</option>
                                                    <option value="auditor">Internal Auditor</option>
                                                </select>
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Account Status</label>
                                                <select
                                                    value={editData.status}
                                                    onChange={e => setEditData({ ...editData, status: e.target.value })}
                                                    className="w-full bg-[#07090E] border border-[#1E2533] focus:border-[#FF6B00] rounded-xl px-4 py-2.5 text-xs text-slate-300 outline-none cursor-pointer"
                                                >
                                                    <option value="ACTIVE">ACTIVE</option>
                                                    <option value="BLOCKED">SUSPENDED</option>
                                                    <option value="PENDING_VERIFICATION">UNVERIFIED</option>
                                                </select>
                                            </div>
                                        </div>

                                        <button
                                            type="submit"
                                            disabled={submitting === 'edit'}
                                            className="px-5 py-2.5 bg-[#FF6B00] hover:bg-[#FF7A00] disabled:opacity-50 text-white text-[10px] font-black rounded-lg transition-colors uppercase tracking-widest"
                                        >
                                            {submitting === 'edit' ? 'Saving Details...' : 'Save General Updates'}
                                        </button>
                                    </form>

                                    {/* Security & Access Controls */}
                                    <div className="space-y-4 text-left border-t border-[#1E2533]/60 pt-6">
                                        <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b border-[#1E2533]/50 pb-2">Access Credentials</h4>
                                        <div className="flex gap-2 items-end">
                                            <div className="space-y-1.5 flex-1">
                                                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Reset Password (Min 8 chars)</label>
                                                <input
                                                    type="text"
                                                    value={newPassword}
                                                    onChange={e => setNewPassword(e.target.value)}
                                                    placeholder="Input new secure password..."
                                                    className="w-full bg-[#07090E] border border-[#1E2533] focus:border-[#FF6B00] rounded-xl px-4 py-2.5 text-xs text-slate-200 outline-none font-mono"
                                                />
                                            </div>
                                            <button
                                                type="button"
                                                onClick={handleResetPassword}
                                                disabled={submitting === 'password'}
                                                className="px-5 py-3 bg-[#0D1017] hover:bg-slate-900 border border-[#1E2533] text-[#FF6B00] text-[10px] font-black rounded-xl uppercase tracking-widest transition-all"
                                            >
                                                Reset Password
                                            </button>
                                        </div>
                                    </div>

                                    {/* Destruction Panel */}
                                    <div className="p-5 bg-rose-950/10 border border-rose-900/30 rounded-2xl text-left space-y-3 mt-6">
                                        <h4 className="text-xs font-black text-rose-400 uppercase tracking-widest flex items-center gap-2">
                                            <Trash2 size={16} />
                                            Danger Zone
                                        </h4>
                                        <p className="text-[10px] text-slate-500 leading-relaxed">
                                            Soft deleting this profile blocks login access, revokes active web/mobile devices, and masks identifying records. Administrative audit history of user logs remains persistent.
                                        </p>
                                        <button
                                            onClick={handleDeleteUser}
                                            disabled={submitting === 'delete'}
                                            className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white text-[10px] font-black rounded-xl uppercase tracking-widest transition-all shadow-md shadow-rose-900/10"
                                        >
                                            Delete User Account
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* TAB 2: KYC Reviews */}
                            {activeTab === 'kyc' && (
                                <div className="space-y-6 animate-in fade-in duration-300 text-left">
                                    <div className="flex items-center justify-between border-b border-[#1E2533]/50 pb-2">
                                        <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Identity verification audit</h4>
                                        <span className={`px-2.5 py-0.5 rounded-full border text-[9px] font-black uppercase tracking-wider ${
                                            profile?.user.kycStatus === 'APPROVED' ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' : 'text-amber-400 bg-amber-500/10 border-amber-500/20'
                                        }`}>
                                            Status: {profile?.user.kycStatus}
                                        </span>
                                    </div>

                                    {profile?.kycDocs && profile.kycDocs.length > 0 ? (
                                        profile.kycDocs.map((doc: any, index: number) => (
                                            <div key={doc._id} className="p-5 bg-[#07090E]/30 border border-[#1E2533] rounded-2xl space-y-4">
                                                <div className="flex justify-between items-center text-xs text-slate-400 border-b border-[#1E2533]/30 pb-2.5 font-mono">
                                                    <span>Req #{index + 1} ({doc.documentType})</span>
                                                    <span>Doc Number: {doc.documentNumber}</span>
                                                </div>
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                                    {doc.frontImageUrl && (
                                                        <div className="space-y-1">
                                                            <span className="text-[8px] font-black text-slate-500 uppercase tracking-wider">Document Front</span>
                                                            <a href={doc.frontImageUrl} target="_blank" rel="noreferrer" className="block relative aspect-video rounded-xl bg-slate-900 overflow-hidden border border-[#1E2533] group hover:border-[#FF6B00]/40 transition-colors">
                                                                <img src={doc.frontImageUrl} alt="KYC Front" className="object-cover w-full h-full" />
                                                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                                                    <Eye size={20} className="text-white" />
                                                                </div>
                                                            </a>
                                                        </div>
                                                    )}
                                                    {doc.backImageUrl && (
                                                        <div className="space-y-1">
                                                            <span className="text-[8px] font-black text-slate-500 uppercase tracking-wider">Document Back</span>
                                                            <a href={doc.backImageUrl} target="_blank" rel="noreferrer" className="block relative aspect-video rounded-xl bg-slate-900 overflow-hidden border border-[#1E2533] group hover:border-[#FF6B00]/40 transition-colors">
                                                                <img src={doc.backImageUrl} alt="KYC Back" className="object-cover w-full h-full" />
                                                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                                                    <Eye size={20} className="text-white" />
                                                                </div>
                                                            </a>
                                                        </div>
                                                    )}
                                                    {doc.selfieImageUrl && (
                                                        <div className="space-y-1">
                                                            <span className="text-[8px] font-black text-slate-500 uppercase tracking-wider">User Selfie</span>
                                                            <a href={doc.selfieImageUrl} target="_blank" rel="noreferrer" className="block relative aspect-video rounded-xl bg-slate-900 overflow-hidden border border-[#1E2533] group hover:border-[#FF6B00]/40 transition-colors">
                                                                <img src={doc.selfieImageUrl} alt="KYC Selfie" className="object-cover w-full h-full" />
                                                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                                                    <Eye size={20} className="text-white" />
                                                                </div>
                                                            </a>
                                                        </div>
                                                    )}
                                                </div>
                                                <p className="text-[10px] text-slate-500 uppercase font-black tracking-wider">Submitted: {new Date(doc.submittedAt).toLocaleString()}</p>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="py-12 bg-[#07090E]/20 border border-dashed border-[#1E2533] rounded-2xl text-center">
                                            <AlertCircle size={32} className="text-slate-600 mx-auto mb-2" />
                                            <p className="text-xs text-slate-500">No KYC Document files uploaded for this user yet.</p>
                                        </div>
                                    )}

                                    {/* Action Toggles for reviews */}
                                    <div className="border-t border-[#1E2533]/60 pt-6 space-y-4">
                                        <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Compliance actions</h4>
                                        <div className="space-y-3">
                                            <input
                                                type="text"
                                                placeholder="Provide rejection reason (only required when rejecting)..."
                                                value={rejectionReason}
                                                onChange={e => setRejectionReason(e.target.value)}
                                                className="w-full bg-[#07090E] border border-[#1E2533] focus:border-[#FF6B00] rounded-xl px-4 py-2.5 text-xs text-slate-200 outline-none"
                                            />
                                            <div className="flex gap-3">
                                                <button
                                                    onClick={() => handleKycApproval(false)}
                                                    disabled={submitting === 'kyc'}
                                                    className="flex-1 py-3 bg-rose-600/10 hover:bg-rose-600 border border-rose-500/20 text-rose-400 hover:text-white text-xs font-black rounded-xl uppercase tracking-widest transition-all"
                                                >
                                                    Reject Verification
                                                </button>
                                                <button
                                                    onClick={() => handleKycApproval(true)}
                                                    disabled={submitting === 'kyc'}
                                                    className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black rounded-xl uppercase tracking-widest transition-all shadow-md shadow-emerald-500/10 border border-emerald-500/20"
                                                >
                                                    Approve & Verify
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* TAB 3: Balances Adjustment & holds */}
                            {activeTab === 'wallet' && (
                                <div className="space-y-6 animate-in fade-in duration-300 text-left">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="p-5 bg-[#07090E]/30 border border-[#1E2533] rounded-2xl">
                                            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest pl-0.5">KES Balance</span>
                                            <p className="text-xl font-black text-white font-mono mt-1">{(profile?.user?.kesBalance || 0).toLocaleString()}</p>
                                            {profile?.wallet?.lockedKES > 0 && (
                                                <span className="text-[9px] font-bold text-rose-400 mt-2 block font-mono">-{profile.wallet.lockedKES.toLocaleString()} Locked (Frozen)</span>
                                            )}
                                        </div>
                                        <div className="p-5 bg-[#07090E]/30 border border-[#1E2533] rounded-2xl">
                                            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest pl-0.5">USDT Balance</span>
                                            <p className="text-xl font-black text-[#FF6B00] font-mono mt-1">{(profile?.user?.usdtBalance || 0).toLocaleString()}</p>
                                            {profile?.wallet?.lockedUSDT > 0 && (
                                                <span className="text-[9px] font-bold text-rose-400 mt-2 block font-mono">-{profile.wallet.lockedUSDT.toLocaleString()} Locked (Frozen)</span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Manual balance adjustment form */}
                                    <form onSubmit={handleAdjustBalance} className="p-5 bg-[#07090E]/20 border border-[#1E2533] rounded-2xl space-y-4">
                                        <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b border-[#1E2533]/50 pb-2">Modify Wallet Balances (Ledger Adjustment)</h4>
                                        <div className="grid grid-cols-3 gap-3">
                                            <div className="space-y-1">
                                                <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest pl-0.5">Currency</label>
                                                <select
                                                    value={adjustData.currency}
                                                    onChange={e => setAdjustData({ ...adjustData, currency: e.target.value })}
                                                    className="w-full bg-[#07090E] border border-[#1E2533] rounded-lg px-2 py-2 text-xs text-slate-300 outline-none"
                                                >
                                                    <option value="KES">KES Ledger</option>
                                                    <option value="USDT">USDT Ledger</option>
                                                </select>
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest pl-0.5">Adjustment Type</label>
                                                <select
                                                    value={adjustData.type}
                                                    onChange={e => setAdjustData({ ...adjustData, type: e.target.value })}
                                                    className="w-full bg-[#07090E] border border-[#1E2533] rounded-lg px-2 py-2 text-xs text-slate-300 outline-none"
                                                >
                                                    <option value="CREDIT">CREDIT (+) </option>
                                                    <option value="DEBIT">DEBIT (-) </option>
                                                </select>
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest pl-0.5">Amount</label>
                                                <input
                                                    type="number"
                                                    value={adjustData.amount}
                                                    onChange={e => setAdjustData({ ...adjustData, amount: e.target.value })}
                                                    placeholder="0.00"
                                                    className="w-full bg-[#07090E] border border-[#1E2533] focus:border-[#FF6B00] rounded-lg px-3 py-2 text-xs text-white outline-none font-mono"
                                                    required
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-1">
                                            <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest pl-0.5">Verification / Reason</label>
                                            <input
                                                type="text"
                                                value={adjustData.reason}
                                                onChange={e => setAdjustData({ ...adjustData, reason: e.target.value })}
                                                placeholder="Provide reason for balance change..."
                                                className="w-full bg-[#07090E] border border-[#1E2533] focus:border-[#FF6B00] rounded-lg px-3 py-2.5 text-xs text-white outline-none"
                                                required
                                            />
                                        </div>

                                        <button
                                            type="submit"
                                            disabled={submitting === 'balance'}
                                            className="px-5 py-2.5 bg-[#FF6B00] hover:bg-[#FF7A00] disabled:opacity-50 text-white text-[10px] font-black rounded-lg transition-colors uppercase tracking-widest"
                                        >
                                            {submitting === 'balance' ? 'Processing adjustment...' : 'Submit Ledger Adjustment'}
                                        </button>
                                    </form>

                                    {/* Active restrictions holds */}
                                    <div className="space-y-3">
                                        <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b border-[#1E2533]/50 pb-2 flex items-center gap-2">
                                            <Shield size={14} className="text-amber-500" />
                                            Active Funds Restrictions
                                        </h4>
                                        {profile?.wallet?.lockedKES > 0 || profile?.wallet?.lockedUSDT > 0 ? (
                                            <div className="space-y-2">
                                                {/* Iterate on holds if loaded */}
                                                {profile?.kycDocs?.[0] /* Dummy check or list holds */}
                                                <div className="p-4 bg-[#07090E]/30 border border-[#1E2533] rounded-xl flex items-center justify-between font-mono">
                                                    <div>
                                                        <p className="text-xs font-black text-amber-500">Restricted Ledger Balance</p>
                                                        <p className="text-[9px] text-slate-500 mt-1 font-sans">Triggered by system freeze operations</p>
                                                    </div>
                                                    <span className="text-[9px] text-slate-500 font-sans">Manage via Wallet Holds tab</span>
                                                </div>
                                            </div>
                                        ) : (
                                            <p className="text-xs text-slate-500 italic pl-1">No active wallet locks or holds in place.</p>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* TAB 4: Security Logs & Devices */}
                            {activeTab === 'security' && (
                                <div className="space-y-6 animate-in fade-in duration-300 text-left">
                                    {/* Risk score metric card */}
                                    <div className={`p-5 rounded-2xl border text-left flex items-center justify-between ${getRiskBadgeColor(profile?.securitySummary?.riskScore || 0)}`}>
                                        <div className="space-y-1.5 flex-1 pr-6">
                                            <div className="flex items-center gap-2">
                                                <Shield size={16} />
                                                <span className="text-xs font-black uppercase tracking-wider">Device Fingerprint Risk Profile</span>
                                            </div>
                                            <p className="text-[10px] text-slate-500 leading-relaxed font-sans">{profile?.securitySummary?.riskRecommendation}</p>
                                        </div>
                                        <div className="text-center font-mono">
                                            <span className="text-3xl font-black">{profile?.securitySummary?.riskScore || 0}</span>
                                            <p className="text-[8px] font-black uppercase tracking-widest text-slate-500 mt-1">Risk Index</p>
                                        </div>
                                    </div>

                                    {/* Failed logins & security details */}
                                    <div className="grid grid-cols-2 gap-4 font-mono">
                                        <div className="p-4 bg-[#07090E]/30 border border-[#1E2533] rounded-xl">
                                            <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest font-sans">Failed attempts (30d)</span>
                                            <p className="text-lg font-black text-white mt-1">{profile?.securitySummary?.failedLoginCount || 0}</p>
                                        </div>
                                        <div className="p-4 bg-[#07090E]/30 border border-[#1E2533] rounded-xl">
                                            <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest font-sans">Suspicious login flags</span>
                                            <p className="text-lg font-black text-white mt-1">{profile?.securitySummary?.suspiciousLoginCount || 0}</p>
                                        </div>
                                    </div>

                                    {/* Active Devices / Sessions */}
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between border-b border-[#1E2533]/50 pb-2">
                                            <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Active Device Sessions</h4>
                                            <button
                                                onClick={handleForceLogout}
                                                disabled={submitting === 'logout'}
                                                className="text-[9px] font-black text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2.5 py-1 rounded hover:bg-rose-600 hover:text-white transition-all uppercase tracking-wider"
                                            >
                                                Force Terminate All
                                            </button>
                                        </div>

                                        <div className="space-y-2.5 font-mono">
                                            {profile?.sessions && profile.sessions.length > 0 ? (
                                                profile.sessions.map((sess: any) => (
                                                    <div key={sess._id} className="p-4 bg-[#07090E]/30 border border-[#1E2533] rounded-xl flex items-center justify-between group">
                                                        <div className="space-y-1">
                                                            <div className="flex items-center gap-2 text-xs text-white">
                                                                <Smartphone size={14} className="text-slate-500" />
                                                                <span>{sess.deviceName || 'Unknown Device'} ({sess.platform})</span>
                                                                {sess.status === 'active' && (
                                                                    <span className="text-[8px] font-black text-emerald-400 bg-emerald-500/10 px-1 rounded uppercase">Live</span>
                                                                )}
                                                            </div>
                                                            <p className="text-[9px] text-slate-500 font-medium font-sans flex items-center gap-2">
                                                                <MapPin size={10} /> {sess.ip} • {sess.geo?.city || 'Unknown City'}, {sess.geo?.country || 'Unknown Country'}
                                                            </p>
                                                        </div>
                                                        {sess.status === 'active' && (
                                                            <button
                                                                onClick={() => handleRevokeSingleSession(sess._id)}
                                                                className="px-2.5 py-1 bg-rose-500/10 hover:bg-rose-600 border border-rose-500/20 text-rose-400 hover:text-white text-[8px] font-black rounded transition-all opacity-0 group-hover:opacity-100 uppercase"
                                                            >
                                                                Revoke
                                                            </button>
                                                        )}
                                                    </div>
                                                ))
                                            ) : (
                                                <p className="text-xs text-slate-500 font-sans italic">No session history found.</p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Security Event Log Timeline */}
                                    <div className="space-y-3">
                                        <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b border-[#1E2533]/50 pb-2">Access event log</h4>
                                        <div className="space-y-2.5 font-mono text-[10px] text-slate-400">
                                            {profile?.securityEvents && profile.securityEvents.length > 0 ? (
                                                profile.securityEvents.map((evt: any) => (
                                                    <div key={evt._id} className="p-3 bg-[#07090E]/20 border border-[#1E2533]/50 rounded-lg flex justify-between items-start gap-4">
                                                        <div className="space-y-1">
                                                            <div className="flex items-center gap-1.5">
                                                                <span className={`text-[8px] font-black uppercase px-1 rounded ${
                                                                    evt.severity === 'high' ? 'bg-rose-500/10 text-rose-400' :
                                                                    evt.severity === 'medium' ? 'bg-amber-500/10 text-amber-400' :
                                                                    'bg-slate-800 text-slate-400'
                                                                }`}>{evt.type}</span>
                                                                <span className="text-slate-500">•</span>
                                                                <span className="font-medium text-slate-300 font-sans">{evt.message}</span>
                                                            </div>
                                                            <p className="text-[9px] text-slate-500">{evt.ip} • {new Date(evt.createdAt).toLocaleString()}</p>
                                                        </div>
                                                    </div>
                                                ))
                                            ) : (
                                                <p className="text-xs text-slate-500 font-sans italic">No security events logged.</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* TAB 5: Activity timelines */}
                            {activeTab === 'history' && (
                                <div className="space-y-6 animate-in fade-in duration-300 text-left">
                                    
                                    {/* Recent Transactions List */}
                                    <div className="space-y-3">
                                        <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b border-[#1E2533]/50 pb-2">Financial transactions (Last 50)</h4>
                                        <div className="space-y-2 font-mono">
                                            {profile?.transactions && profile.transactions.length > 0 ? (
                                                profile.transactions.map((tx: any) => (
                                                    <div key={tx._id} className="p-3 bg-[#07090E]/20 border border-[#1E2533] rounded-xl flex items-center justify-between">
                                                        <div className="flex items-center gap-3">
                                                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                                                                tx.type === 'DEPOSIT' ? 'text-emerald-400 bg-emerald-500/10' : 'text-[#FF6B00] bg-[#FF6B00]/10'
                                                            }`}>
                                                                {tx.type === 'DEPOSIT' ? <ArrowDownRight size={14} /> : <ArrowUpRight size={14} />}
                                                            </div>
                                                            <div>
                                                                <p className="text-xs font-bold text-white leading-none mb-1 font-sans">{tx.type}</p>
                                                                <p className="text-[8px] text-slate-500">{new Date(tx.createdAt).toLocaleString()}</p>
                                                            </div>
                                                        </div>
                                                        <span className={`text-xs font-black ${tx.type === 'DEPOSIT' ? 'text-emerald-400' : 'text-[#FF6B00]'}`}>
                                                            {tx.currency} {tx.amount.toLocaleString()}
                                                        </span>
                                                    </div>
                                                ))
                                            ) : (
                                                <p className="text-xs text-slate-500 font-sans italic pl-1">No transaction records found.</p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Sent System Notifications Drawer */}
                                    <div className="space-y-3">
                                        <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b border-[#1E2533]/50 pb-2">Dispatched notifications</h4>
                                        <div className="space-y-2 font-mono text-[10px] text-slate-400">
                                            {profile?.notifications && profile.notifications.length > 0 ? (
                                                profile.notifications.map((notif: any) => (
                                                    <div key={notif._id} className="p-3 bg-[#07090E]/20 border border-[#1E2533] rounded-xl space-y-1">
                                                        <div className="flex justify-between items-center text-[9px] text-slate-500 font-sans uppercase">
                                                            <span className="font-bold text-[#FF6B00]">{notif.type} Alert</span>
                                                            <span>{new Date(notif.createdAt).toLocaleDateString()}</span>
                                                        </div>
                                                        <p className="font-bold text-white font-sans">{notif.title}</p>
                                                        <p className="text-[9px] text-slate-500 leading-relaxed font-sans">{notif.message}</p>
                                                    </div>
                                                ))
                                            ) : (
                                                <p className="text-xs text-slate-500 font-sans italic pl-1">No alerts dispatched to user profile.</p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Direct dispatch notification form */}
                                    <form onSubmit={handleSendNotification} className="p-5 bg-[#07090E]/20 border border-[#1E2533] rounded-2xl space-y-4">
                                        <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b border-[#1E2533]/50 pb-2 flex items-center gap-2">
                                            <Send size={14} className="text-[#FF6B00]" />
                                            Dispatch custom user alert
                                        </h4>
                                        
                                        <div className="space-y-1">
                                            <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest pl-0.5">Notification Category</label>
                                            <select
                                                value={notifyData.type}
                                                onChange={e => setNotifyData({ ...notifyData, type: e.target.value })}
                                                className="w-full bg-[#07090E] border border-[#1E2533] rounded-lg px-2 py-2 text-xs text-slate-300 outline-none"
                                            >
                                                <option value="SYSTEM">System Updates (General)</option>
                                                <option value="SECURITY">Access & Security Warnings</option>
                                                <option value="FINANCE">Ledger & Transaction status</option>
                                            </select>
                                        </div>

                                        <div className="space-y-1">
                                            <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest pl-0.5">Alert Subject / Title</label>
                                            <input
                                                type="text"
                                                value={notifyData.title}
                                                onChange={e => setNotifyData({ ...notifyData, title: e.target.value })}
                                                placeholder="Verification updates, login alerts, etc."
                                                className="w-full bg-[#07090E] border border-[#1E2533] focus:border-[#FF6B00] rounded-lg px-3 py-2 text-xs text-white outline-none"
                                                required
                                            />
                                        </div>

                                        <div className="space-y-1">
                                            <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest pl-0.5">Alert Message Body</label>
                                            <textarea
                                                value={notifyData.message}
                                                onChange={e => setNotifyData({ ...notifyData, message: e.target.value })}
                                                placeholder="Provide detailed notification instructions..."
                                                rows={2}
                                                className="w-full bg-[#07090E] border border-[#1E2533] focus:border-[#FF6B00] rounded-lg px-3 py-2 text-xs text-white resize-none outline-none"
                                                required
                                            />
                                        </div>

                                        <button
                                            type="submit"
                                            disabled={submitting === 'notify'}
                                            className="px-5 py-2.5 bg-[#FF6B00] hover:bg-[#FF7A00] disabled:opacity-50 text-white text-[10px] font-black rounded-lg transition-colors uppercase tracking-widest"
                                        >
                                            {submitting === 'notify' ? 'Dispatching alert...' : 'Dispatch Alert'}
                                        </button>
                                    </form>

                                    {/* Support tickets history */}
                                    <div className="space-y-3">
                                        <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b border-[#1E2533]/50 pb-2 flex items-center gap-2">
                                            <Ticket size={14} className="text-[#FF6B00]" />
                                            Platform support history
                                        </h4>
                                        <div className="space-y-2.5 font-mono text-[10px] text-slate-400">
                                            {profile?.tickets && profile.tickets.length > 0 ? (
                                                profile.tickets.map((tkt: any) => (
                                                    <div key={tkt._id} className="p-3.5 bg-[#07090E]/30 border border-[#1E2533] rounded-xl flex items-center justify-between font-sans">
                                                        <div className="space-y-1">
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-xs font-bold text-white">{tkt.subject}</span>
                                                                <span className="text-[8px] font-black text-slate-500 uppercase tracking-wider bg-slate-900 border border-[#1E2533] px-1 rounded">{tkt.category}</span>
                                                            </div>
                                                            <p className="text-[9px] text-slate-500 font-mono">Opened {new Date(tkt.createdAt).toLocaleDateString()} • {tkt.replies} replies</p>
                                                        </div>
                                                        <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${
                                                            tkt.status === 'CLOSED' ? 'bg-slate-900 text-slate-500 border border-[#1E2533]' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                                        }`}>{tkt.status}</span>
                                                    </div>
                                                ))
                                            ) : (
                                                <p className="text-xs text-slate-500 font-sans italic">No support logs registered.</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
