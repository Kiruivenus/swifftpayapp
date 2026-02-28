"use client";

import React, { useState, useEffect } from 'react';
import {
    Users,
    Wallet,
    ShieldCheck,
    TrendingUp,
    ArrowUpRight,
    ArrowDownRight,
    Clock,
    ExternalLink,
    ShieldAlert,
    Bell,
    Settings,
    LayoutDashboard
} from 'lucide-react';
import { adminService, OverviewStats, ActivityData } from '@/services/admin.service';
import Link from 'next/link';

export default function DashboardPage() {
    const [stats, setStats] = useState<OverviewStats | null>(null);
    const [activity, setActivity] = useState<ActivityData | null>(null);
    const [recentUsers, setRecentUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const [s, a, u] = await Promise.all([
                    adminService.getOverviewStats(),
                    adminService.getActivity('weekly'),
                    adminService.getUsers({ limit: 5 })
                ]);
                setStats(s);
                setActivity(a);
                setRecentUsers(u.users || []);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    if (loading) return <DashboardSkeleton />;
    if (error) return <div className="p-8 text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-2xl">{error}</div>;

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Welcome Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-white tracking-tight">System Overview</h2>
                    <p className="text-slate-400 mt-1">Real-time statistics and activity for the SwiftPay platform.</p>
                </div>
                <div className="px-4 py-2 bg-slate-900 border border-slate-800 rounded-xl flex items-center gap-3">
                    <Clock size={16} className="text-indigo-400" />
                    <span className="text-sm font-medium text-slate-300">Last updated: Just now</span>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    label="Total Users"
                    value={stats?.totalUsers.toLocaleString()}
                    change={stats?.deltas.users}
                    isPositive={true}
                    icon={<Users size={24} />}
                />
                <StatCard
                    label="Verified Users"
                    value={stats?.verifiedUsers.toLocaleString()}
                    change={stats?.deltas.kyc}
                    isPositive={true}
                    icon={<ShieldCheck size={24} />}
                />
                <StatCard
                    label="Total Deposits (KES)"
                    value={`KES ${(stats?.finance.totalDepositsKES || 0).toLocaleString()}`}
                    change={stats?.deltas.deposits}
                    isPositive={true}
                    icon={<Wallet size={24} />}
                />
                <StatCard
                    label="Total Withdrawals (KES)"
                    value={`KES ${(stats?.finance.totalWithdrawalsKES || 0).toLocaleString()}`}
                    change={stats?.deltas.volume}
                    isPositive={false}
                    icon={<ArrowUpRight size={24} />}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Activity Chart */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-8 backdrop-blur-sm">
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="text-lg font-bold text-white">Platform Activity</h3>
                            <div className="flex bg-slate-800 rounded-lg p-1">
                                <button className="px-3 py-1 text-xs font-bold bg-indigo-600 text-white rounded-md shadow-sm">Weekly</button>
                            </div>
                        </div>

                        {/* Chart Visualization */}
                        <div className="h-64 flex items-end justify-between gap-2 px-2">
                            {activity?.labels.map((label, i) => {
                                const val = activity.datasets[0].data[i] || 0;
                                const max = Math.max(...activity.datasets[0].data, 1);
                                const height = (val / max) * 100;
                                return (
                                    <div key={i} className="flex-1 group relative h-full flex items-end">
                                        <div
                                            className="w-full bg-indigo-500/20 rounded-t-lg group-hover:bg-indigo-500/40 transition-all duration-300"
                                            style={{ height: `${height}%` }}
                                        >
                                            <div
                                                className="absolute bottom-0 w-full bg-indigo-500 rounded-t-lg shadow-[0_0_15px_rgba(99,102,241,0.3)]"
                                                style={{ height: `max(10%, ${height}%)` }}
                                            />
                                        </div>
                                        <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                            {val} Users
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        <div className="flex justify-between items-center mt-6 text-[10px] font-bold text-slate-500 uppercase tracking-widest px-2">
                            {activity?.labels.map((l, i) => <span key={i}>{l}</span>)}
                        </div>
                    </div>

                    {/* Recent Registrations Table */}
                    <div className="bg-slate-900/50 border border-slate-800 rounded-3xl overflow-hidden backdrop-blur-sm">
                        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
                            <h3 className="text-lg font-bold text-white">Recently Joined</h3>
                            <Link href="/admin/users" className="text-sm font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
                                View All <ArrowUpRight size={14} />
                            </Link>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="bg-slate-800/30 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                        <th className="px-6 py-4">User</th>
                                        <th className="px-6 py-4">Role</th>
                                        <th className="px-6 py-4">Status</th>
                                        <th className="px-6 py-4">Joined</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800">
                                    {recentUsers.map((u: any) => (
                                        <UserRow
                                            key={u._id}
                                            name={u.username}
                                            email={u.email}
                                            role={u.role}
                                            status={u.status}
                                            time={new Date(u.createdAt).toLocaleDateString()}
                                            initial={u.username[0].toUpperCase()}
                                        />
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Action Sidebar */}
                <div className="space-y-6">
                    <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-6 backdrop-blur-sm">
                        <h3 className="text-lg font-bold text-white mb-6">Queue Status</h3>
                        <div className="grid grid-cols-1 gap-3">
                            <Link href="/admin/kyc">
                                <QuickAction
                                    icon={<ShieldAlert size={18} />}
                                    label={`Review ${stats?.pendingKyc} KYC Requests`}
                                    color="bg-indigo-500"
                                />
                            </Link>
                            <Link href="/admin/finance">
                                <QuickAction
                                    icon={<Wallet size={18} />}
                                    label="Approve Withdrawals"
                                    color="bg-emerald-500"
                                />
                            </Link>
                            <QuickAction icon={<Bell size={18} />} label="Send Platform Alert" color="bg-amber-500" />
                        </div>
                    </div>

                    <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-6 backdrop-blur-sm">
                        <h3 className="text-lg font-bold text-white mb-6 flex items-center justify-between">
                            System Health
                            <TrendingUp className="text-emerald-400" size={18} />
                        </h3>
                        <div className="space-y-6">
                            <RevenueItem label="Active Sessions" amount={stats?.activeSessions.toString()} progress={Math.min(100, (stats?.activeSessions || 0) * 10)} />
                            <RevenueItem label="Platform Uptime" amount="99.9%" progress={99.9} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function StatCard({ label, value, change, isPositive, icon }: any) {
    return (
        <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-3xl backdrop-blur-sm hover:border-indigo-500/30 transition-all group">
            <div className="flex justify-between items-start mb-4">
                <div className="w-12 h-12 bg-slate-800 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-indigo-500/10 group-hover:text-indigo-400 transition-colors">
                    {icon}
                </div>
                <div className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-lg ${isPositive ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                    {isPositive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                    {change}
                </div>
            </div>
            <div>
                <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">{label}</p>
                <p className="text-2xl font-bold text-white mt-1">{value}</p>
            </div>
        </div>
    );
}

function UserRow({ name, email, role, status, time, initial, color }: any) {
    return (
        <tr className="group hover:bg-slate-800/20 transition-colors">
            <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-full bg-slate-800 flex items-center justify-center font-bold text-sm ${color || 'text-indigo-400'}`}>
                        {initial}
                    </div>
                    <div>
                        <p className="text-sm font-bold text-white leading-none">{name}</p>
                        <p className="text-xs text-slate-500 mt-1">{email}</p>
                    </div>
                </div>
            </td>
            <td className="px-6 py-4">
                <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider bg-slate-800 px-2 py-1 rounded-lg">{role}</span>
            </td>
            <td className="px-6 py-4">
                <div className="flex items-center gap-2">
                    <div className={`w-1.5 h-1.5 rounded-full ${status === 'ACTIVE' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]'}`} />
                    <span className="text-xs font-bold text-slate-200">{status}</span>
                </div>
            </td>
            <td className="px-6 py-4 text-sm text-slate-500 font-medium">{time}</td>
        </tr>
    );
}

function QuickAction({ icon, label, color }: any) {
    return (
        <div className="flex items-center justify-between p-4 bg-slate-800/40 hover:bg-slate-800 border border-slate-700/50 hover:border-slate-600 rounded-2xl transition-all group cursor-pointer">
            <div className="flex items-center gap-3 text-slate-200">
                <div className={`w-10 h-10 ${color}/10 ${color.replace('bg-', 'text-')} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform`}>
                    {icon}
                </div>
                <span className="text-sm font-bold tracking-tight">{label}</span>
            </div>
            <ExternalLink size={14} className="text-slate-600 group-hover:text-slate-400" />
        </div>
    );
}

function RevenueItem({ label, amount, progress }: any) {
    return (
        <div className="space-y-2">
            <div className="flex justify-between text-xs font-bold">
                <span className="text-slate-400">{label}</span>
                <span className="text-slate-200">{amount}</span>
            </div>
            <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div
                    className="h-full bg-gradient-to-r from-indigo-600 to-indigo-400 transition-all duration-1000"
                    style={{ width: `${progress}%` }}
                />
            </div>
        </div>
    );
}

function DashboardSkeleton() {
    return (
        <div className="space-y-8 animate-pulse p-8">
            <div className="h-12 bg-slate-800 rounded-xl w-1/4"></div>
            <div className="grid grid-cols-4 gap-6">
                <div className="h-32 bg-slate-800 rounded-3xl"></div>
                <div className="h-32 bg-slate-800 rounded-3xl"></div>
                <div className="h-32 bg-slate-800 rounded-3xl"></div>
                <div className="h-32 bg-slate-800 rounded-3xl"></div>
            </div>
            <div className="grid grid-cols-3 gap-8">
                <div className="col-span-2 h-96 bg-slate-800 rounded-3xl"></div>
                <div className="h-96 bg-slate-800 rounded-3xl"></div>
            </div>
        </div>
    );
}
