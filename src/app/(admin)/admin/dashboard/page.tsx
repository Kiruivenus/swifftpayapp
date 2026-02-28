import React from 'react';
import {
    Users,
    Wallet,
    ShieldCheck,
    ArrowUpRight,
    ArrowDownRight,
    TrendingUp,
    Clock,
    ExternalLink
} from 'lucide-react';

export default function DashboardPage() {
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
                    value="1,284"
                    change="+12.5%"
                    isPositive={true}
                    icon={<Users size={24} />}
                />
                <StatCard
                    label="Verified Users"
                    value="956"
                    change="+8.2%"
                    isPositive={true}
                    icon={<ShieldCheck size={24} />}
                />
                <StatCard
                    label="Total Deposits"
                    value="KES 4.2M"
                    change="+24.1%"
                    isPositive={true}
                    icon={<Wallet size={24} />}
                />
                <StatCard
                    label="Total Withdrawals"
                    value="KES 1.8M"
                    change="-5.4%"
                    isPositive={false}
                    icon={<ArrowUpRight size={24} />}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Chart Area (Placeholder for now) */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-8 backdrop-blur-sm">
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="text-lg font-bold text-white">Platform Activity</h3>
                            <div className="flex bg-slate-800 rounded-lg p-1">
                                <button className="px-3 py-1 text-xs font-bold bg-indigo-600 text-white rounded-md shadow-sm">Daily</button>
                                <button className="px-3 py-1 text-xs font-bold text-slate-400 hover:text-white transition-colors">Weekly</button>
                            </div>
                        </div>
                        {/* Chart Placeholder */}
                        <div className="h-64 flex items-end justify-between gap-2 px-2">
                            {[45, 60, 40, 80, 55, 90, 75, 50, 65, 85, 70, 95].map((h, i) => (
                                <div key={i} className="flex-1 group relative">
                                    <div
                                        className="w-full bg-indigo-500/20 rounded-t-lg group-hover:bg-indigo-500/40 transition-all duration-300"
                                        style={{ height: `${h}%` }}
                                    >
                                        <div
                                            className="absolute bottom-0 w-full bg-indigo-500 rounded-t-lg shadow-[0_0_15px_rgba(99,102,241,0.3)] transition-all duration-500 delay-[i*50ms]"
                                            style={{ height: `calc(${h}% - 10px)` }}
                                        />
                                    </div>
                                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                                        {h}k
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="flex justify-between items-center mt-6 text-[10px] font-bold text-slate-500 uppercase tracking-widest px-2">
                            <span>Jan</span>
                            <span>Mar</span>
                            <span>May</span>
                            <span>Jul</span>
                            <span>Sep</span>
                            <span>Nov</span>
                        </div>
                    </div>

                    {/* Recent Registrations Table */}
                    <div className="bg-slate-900/50 border border-slate-800 rounded-3xl overflow-hidden backdrop-blur-sm">
                        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
                            <h3 className="text-lg font-bold text-white">Recently Joined</h3>
                            <button className="text-sm font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
                                View All <ArrowUpRight size={14} />
                            </button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="bg-slate-800/30 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                        <th className="px-6 py-4">User</th>
                                        <th className="px-6 py-4">Country</th>
                                        <th className="px-6 py-4">Status</th>
                                        <th className="px-6 py-4">Joined</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800">
                                    <UserRow
                                        name="John Doe"
                                        email="john@example.com"
                                        country="Kenya"
                                        status="Active"
                                        time="2h ago"
                                        initial="J"
                                    />
                                    <UserRow
                                        name="Jane Smith"
                                        email="jane@example.com"
                                        country="Uganda"
                                        status="Pending"
                                        time="5h ago"
                                        initial="J"
                                        color="text-blue-400"
                                    />
                                    <UserRow
                                        name="Alex Mercer"
                                        email="alex@codenet.io"
                                        country="Tanzania"
                                        status="Active"
                                        time="12h ago"
                                        initial="A"
                                        color="text-emerald-400"
                                    />
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Action Sidebar */}
                <div className="space-y-6">
                    <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-6 backdrop-blur-sm">
                        <h3 className="text-lg font-bold text-white mb-6">Quick Actions</h3>
                        <div className="grid grid-cols-1 gap-3">
                            <QuickAction icon={<ShieldAlert size={18} />} label="Review 5 KYC Requests" color="bg-indigo-500" />
                            <QuickAction icon={<Wallet size={18} />} label="Approve 2 Withdrawals" color="bg-emerald-500" />
                            <QuickAction icon={<Bell size={18} />} label="Send Platform Alert" color="bg-amber-500" />
                            <QuickAction icon={<Settings size={18} />} label="Platform Maintenance" color="bg-rose-500" />
                        </div>
                    </div>

                    <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-6 backdrop-blur-sm">
                        <h3 className="text-lg font-bold text-white mb-6 flex items-center justify-between">
                            Live Revenue
                            <TrendingUp className="text-emerald-400" size={18} />
                        </h3>
                        <div className="space-y-6">
                            <RevenueItem label="Conversion Fees" amount="KES 124,500" progress={75} />
                            <RevenueItem label="Withdrawal Fees" amount="KES 42,200" progress={40} />
                            <RevenueItem label="Service Charges" amount="KES 8,900" progress={15} />
                        </div>
                        <div className="mt-8 pt-6 border-t border-slate-800">
                            <div className="flex justify-between items-end">
                                <div>
                                    <p className="text-xs text-slate-500 uppercase font-bold tracking-widest mb-1">Monthly Total</p>
                                    <p className="text-2xl font-bold text-white">KES 175,600</p>
                                </div>
                                <div className="bg-emerald-500/10 text-emerald-400 text-xs font-bold px-2 py-1 rounded-lg">
                                    +15%
                                </div>
                            </div>
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

function UserRow({ name, email, country, status, time, initial, color }: any) {
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
                <span className="text-sm text-slate-300">{country}</span>
            </td>
            <td className="px-6 py-4">
                <div className="flex items-center gap-2">
                    <div className={`w-1.5 h-1.5 rounded-full ${status === 'Active' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]'}`} />
                    <span className="text-xs font-bold text-slate-200">{status}</span>
                </div>
            </td>
            <td className="px-6 py-4 text-sm text-slate-500 font-medium">{time}</td>
        </tr>
    );
}

function QuickAction({ icon, label, color }: any) {
    return (
        <button className="flex items-center justify-between p-4 bg-slate-800/40 hover:bg-slate-800 border border-slate-700/50 hover:border-slate-600 rounded-2xl transition-all group">
            <div className="flex items-center gap-3 text-slate-200">
                <div className={`w-10 h-10 ${color}/10 ${color.replace('bg-', 'text-')} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform`}>
                    {icon}
                </div>
                <span className="text-sm font-bold tracking-tight">{label}</span>
            </div>
            <ExternalLink size={14} className="text-slate-600 group-hover:text-slate-400" />
        </button>
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
