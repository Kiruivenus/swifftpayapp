import React from 'react';
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
    ChevronRight
} from 'lucide-react';

export default function UsersPage() {
    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h2 className="text-3xl font-bold text-white tracking-tight">User Management</h2>
                    <p className="text-slate-400 mt-1">Search, manage, and monitor all platform users.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-xl border border-slate-700 transition-all">
                        <Filter size={18} />
                        Filters
                    </button>
                    <button className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl transition-all shadow-lg shadow-indigo-600/20">
                        <UserPlus size={18} />
                        Add Admin
                    </button>
                </div>
            </div>

            {/* Search & Stats Bar */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                <div className="lg:col-span-2 relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
                    <input
                        type="text"
                        placeholder="Search by name, email, or phone..."
                        className="w-full pl-12 pr-4 py-3 bg-slate-900/50 border border-slate-800 rounded-2xl text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 transition-all"
                    />
                </div>
                <div className="p-3 bg-slate-900/30 border border-slate-800 rounded-2xl flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                        <Users size={20} />
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Active</p>
                        <p className="text-lg font-bold text-white">1,142</p>
                    </div>
                </div>
                <div className="p-3 bg-slate-900/30 border border-slate-800 rounded-2xl flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center">
                        <Ban size={20} />
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Blocked</p>
                        <p className="text-lg font-bold text-white">12</p>
                    </div>
                </div>
            </div>

            {/* Users Table */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-3xl overflow-hidden backdrop-blur-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-800/30 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                <th className="px-6 py-4">User Details</th>
                                <th className="px-6 py-4">Contact</th>
                                <th className="px-6 py-4">Verification</th>
                                <th className="px-6 py-4">Role</th>
                                <th className="px-6 py-4">Balance</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                            <UserTableRow
                                name="Patrick Kirui"
                                username="@pkirui"
                                email="patrick@swiftpay.ke"
                                phone="+254 712 345 678"
                                status="Verified"
                                role="admin"
                                balance="KES 450,000"
                                joined="Joined 2 months ago"
                                initial="PK"
                                roleColor="bg-indigo-500/10 text-indigo-400 border-indigo-500/20"
                            />
                            <UserTableRow
                                name="Sarah Johnson"
                                username="@sarah_j"
                                email="sarah@example.com"
                                phone="+254 722 999 000"
                                status="Pending"
                                role="support"
                                balance="KES 12,450"
                                joined="Joined 1 week ago"
                                initial="SJ"
                                roleColor="bg-blue-500/10 text-blue-400 border-blue-500/20"
                            />
                            <UserTableRow
                                name="Michael Chen"
                                username="@mchen_tx"
                                email="mchen@corporate.com"
                                phone="+254 733 111 222"
                                status="Rejected"
                                role="user"
                                balance="KES 0.00"
                                joined="Joined 3 days ago"
                                initial="MC"
                                roleColor="bg-slate-800 text-slate-400 border-slate-700"
                            />
                            <UserTableRow
                                name="Jessica Williams"
                                username="@jess_w"
                                email="jessica.w@gmail.com"
                                phone="+254 700 444 555"
                                status="Verified"
                                role="finance"
                                balance="KES 1,200,300"
                                joined="Joined 4 months ago"
                                initial="JW"
                                roleColor="bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                            />
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="p-6 border-t border-slate-800 flex items-center justify-between">
                    <p className="text-sm text-slate-500 font-medium">Showing 1 to 10 of 1,284 users</p>
                    <div className="flex items-center gap-2">
                        <button className="p-2 text-slate-500 hover:text-white transition-colors disabled:opacity-30" disabled>
                            <ChevronLeft size={20} />
                        </button>
                        <div className="flex items-center gap-1">
                            <button className="w-8 h-8 rounded-lg bg-indigo-600 text-white font-bold text-xs flex items-center justify-center">1</button>
                            <button className="w-8 h-8 rounded-lg text-slate-400 hover:bg-slate-800 transition-all font-bold text-xs flex items-center justify-center">2</button>
                            <button className="w-8 h-8 rounded-lg text-slate-400 hover:bg-slate-800 transition-all font-bold text-xs flex items-center justify-center">3</button>
                            <span className="text-slate-600 px-1">...</span>
                            <button className="w-8 h-8 rounded-lg text-slate-400 hover:bg-slate-800 transition-all font-bold text-xs flex items-center justify-center">129</button>
                        </div>
                        <button className="p-2 text-slate-500 hover:text-white transition-colors hover:bg-slate-800 rounded-lg">
                            <ChevronRight size={20} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

function UserTableRow({ name, username, email, phone, status, role, balance, joined, initial, roleColor }: any) {
    const statusColor = status === 'Verified' ? 'text-emerald-400 bg-emerald-500/10' :
        status === 'Pending' ? 'text-amber-400 bg-amber-500/10' :
            'text-rose-400 bg-rose-500/10';

    return (
        <tr className="group hover:bg-slate-800/20 transition-all duration-300">
            <td className="px-6 py-5">
                <div className="flex items-center gap-4">
                    <div className="w-11 h-11 rounded-2xl bg-slate-800 flex items-center justify-center font-bold text-sm text-indigo-400 border border-slate-700/50 group-hover:border-indigo-500/30 transition-all shadow-inner">
                        {initial}
                    </div>
                    <div>
                        <p className="text font-bold text-white leading-none mb-1">{name}</p>
                        <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">{username}</p>
                    </div>
                </div>
            </td>
            <td className="px-6 py-5">
                <div className="space-y-1.5">
                    <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
                        <Mail size={12} className="text-slate-600" />
                        {email}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
                        <Smartphone size={12} className="text-slate-600" />
                        {phone}
                    </div>
                </div>
            </td>
            <td className="px-6 py-5">
                <div className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-full border border-current opacity-80 ${statusColor}`}>
                    <div className={`w-1 h-1 rounded-full ${status === 'Verified' ? 'bg-emerald-400' : 'bg-current'}`} />
                    <span className="text-[10px] font-bold uppercase tracking-widest">{status}</span>
                </div>
                <p className="text-[10px] text-slate-600 mt-1.5 font-bold uppercase tracking-tight pl-1">{joined}</p>
            </td>
            <td className="px-6 py-5">
                <div className={`inline-flex px-2 py-0.5 rounded-md border text-[10px] font-bold uppercase tracking-wider ${roleColor}`}>
                    {role}
                </div>
            </td>
            <td className="px-6 py-5">
                <p className="text-sm font-bold text-white">{balance}</p>
                <div className="w-16 h-1 bg-slate-800 rounded-full mt-2 overflow-hidden">
                    <div className="h-full bg-indigo-500 w-2/3 shadow-[0_0_8px_rgba(99,102,241,0.5)]" />
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
                    <button className="p-2 text-slate-500 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-all" title="Block Account">
                        <Ban size={18} />
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
