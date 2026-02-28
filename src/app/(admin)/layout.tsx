import React from 'react';
import Link from 'next/link';
import {
    LayoutDashboard,
    Users,
    Wallet,
    ShieldCheck,
    Settings,
    LogOut,
    BarChart3,
    History,
    ShieldAlert,
    Bell,
    Globe,
    RefreshCcw
} from 'lucide-react';

import LogoutButton from '@/components/admin/LogoutButton';

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex h-screen bg-slate-950 text-slate-200 overflow-hidden">
            {/* Sidebar */}
            <aside className="w-64 bg-slate-900/50 border-r border-slate-800 flex flex-col backdrop-blur-md">
                <div className="p-6 border-b border-slate-800">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
                            <span className="text-white font-bold text-xl">S</span>
                        </div>
                        <div>
                            <h1 className="text-lg font-bold text-white leading-tight">SwiftPay</h1>
                            <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Admin Portal</p>
                        </div>
                    </div>
                </div>

                <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-1 custom-scrollbar">
                    <NavItem href="/admin/dashboard" icon={<LayoutDashboard size={20} />} label="Dashboard" />

                    <div className="pt-4 pb-2 px-2 text-[10px] font-bold text-slate-600 uppercase tracking-widest">Management</div>
                    <NavItem href="/admin/users" icon={<Users size={20} />} label="Users" />
                    <NavItem href="/admin/kyc" icon={<ShieldCheck size={20} />} label="KYC Reviews" />
                    <NavItem href="/admin/finance" icon={<Wallet size={20} />} label="Finance & Transactions" />

                    <div className="pt-4 pb-2 px-2 text-[10px] font-bold text-slate-600 uppercase tracking-widest">Platform</div>
                    <NavItem href="/admin/rates" icon={<Globe size={20} />} label="Rates & Currency" />
                    <NavItem href="/admin/notifications" icon={<Bell size={20} />} label="Notifications" />
                    <NavItem href="/admin/sessions" icon={<ShieldAlert size={20} />} label="Security & Sessions" />
                    <NavItem href="/admin/audit" icon={<History size={20} />} label="Audit Logs" />
                    <NavItem href="/admin/settings" icon={<Settings size={20} />} label="Platform Settings" />
                </nav>

                <div className="p-4 border-t border-slate-800">
                    <LogoutButton />
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col min-w-0">
                <header className="h-16 border-b border-slate-800 bg-slate-950/50 backdrop-blur-md flex items-center justify-between px-8 z-10">
                    <div className="flex items-center gap-4 text-sm text-slate-400">
                        <span>Admin Control Panel</span>
                        <span className="text-slate-800">/</span>
                        <span className="text-slate-100 font-medium">Dashboard</span>
                    </div>

                    <div className="flex items-center gap-6">
                        <button className="relative p-2 text-slate-400 hover:text-indigo-400 transition-colors">
                            <Bell size={20} />
                            <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full border-2 border-slate-950"></span>
                        </button>
                        <div className="flex items-center gap-3 pl-6 border-l border-slate-800">
                            <div className="text-right hidden sm:block">
                                <p className="text-sm font-bold text-white leading-none">Super Admin</p>
                                <p className="text-[11px] text-slate-500 mt-1 font-medium">admin@swiftpay.ke</p>
                            </div>
                            <div className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-indigo-400 font-bold">
                                A
                            </div>
                        </div>
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                    {children}
                </div>
            </main>
        </div>
    );
}

function NavItem({ href, icon, label }: { href: string; icon: React.ReactNode, label: string }) {
    return (
        <Link
            href={href}
            className="flex items-center gap-3 p-3 text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-xl transition-all group font-medium text-sm"
        >
            <span className="transition-transform group-hover:scale-110 group-active:scale-95">
                {icon}
            </span>
            {label}
        </Link>
    );
}
