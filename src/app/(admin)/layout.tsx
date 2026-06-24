"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard,
    Users,
    Wallet,
    ShieldCheck,
    Settings,
    LogOut,
    History,
    ShieldAlert,
    Bell,
    Globe,
    ChevronLeft,
    ChevronRight,
    Menu,
    X,
    Search,
    Compass,
    Activity,
    Plus
} from 'lucide-react';

import LogoutButton from '@/components/admin/LogoutButton';
import { adminService } from '@/services/admin.service';

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const [collapsed, setCollapsed] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);
    const [platformName, setPlatformName] = useState('SwiftPay');
    const [logoUrl, setLogoUrl] = useState('/logo.png');

    useEffect(() => {
        adminService.getSettings().then(res => {
            if (res.success && res.settings) {
                const settings = res.settings;
                if (settings.platformName) setPlatformName(settings.platformName);
                
                const customLogo = settings.logoDashboardUrl || settings.logoUrl;
                if (customLogo) setLogoUrl(customLogo);

                // Apply CSS variables for colors & typography
                const colors = settings.brandColors || {};
                const primary = colors.primary || '#FF6B00';
                const secondary = colors.secondary || '#0D1017';
                const darkBase = colors.darkBase || '#050816';
                const cardBg = colors.cardBg || '#0D1017';
                const typography = settings.typography || 'Outfit';

                const root = document.documentElement;
                root.style.setProperty('--primary', primary);
                root.style.setProperty('--color-primary-orange', primary);
                root.style.setProperty('--background', darkBase);
                root.style.setProperty('--card', cardBg);

                // Helper border/glow colors based on primary color
                if (primary.startsWith('#')) {
                    const cleanHex = primary.slice(1);
                    const r = parseInt(cleanHex.slice(0, 2), 16) || 0;
                    const g = parseInt(cleanHex.slice(2, 4), 16) || 0;
                    const b = parseInt(cleanHex.slice(4, 6), 16) || 0;
                    root.style.setProperty('--color-primary-orange-light', `rgba(${r}, ${g}, ${b}, 0.1)`);
                    root.style.setProperty('--color-primary-orange-border', `rgba(${r}, ${g}, ${b}, 0.25)`);
                }

                // Append font family dynamically
                const fontId = 'dynamic-brand-font';
                let fontLink = document.getElementById(fontId) as HTMLLinkElement;
                if (!fontLink) {
                    fontLink = document.createElement('link');
                    fontLink.id = fontId;
                    fontLink.rel = 'stylesheet';
                    document.head.appendChild(fontLink);
                }
                fontLink.href = `https://fonts.googleapis.com/css2?family=${typography.replace(/ /g, '+')}:wght@300;400;500;600;700;900&display=swap`;
                root.style.setProperty('--font-sans', `'${typography}', 'Plus Jakarta Sans', sans-serif`);
            }
        }).catch(err => {
            console.error('Failed to load dynamic brand settings:', err);
        });
    }, []);

    return (
        <div className="flex h-screen bg-[#07090E] text-[#F3F4F6] overflow-hidden font-sans">
            
            {/* Mobile Drawer Sidebar Overlay */}
            {mobileOpen && (
                <div 
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
                    onClick={() => setMobileOpen(false)}
                />
            )}

            {/* Sidebar Shell */}
            <aside 
                className={`fixed inset-y-0 left-0 z-50 flex flex-col bg-[#0D1017] border-r border-[#1E2533] transition-all duration-300 ease-in-out lg:static
                    ${collapsed ? 'w-20' : 'w-64'} 
                    ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
                `}
            >
                {/* Brand / Logo Area */}
                <div className="p-5 border-b border-[#1E2533] flex items-center justify-between h-16">
                    <div className="flex items-center gap-3 overflow-hidden">
                        <div className="w-9 h-9 bg-transparent rounded-xl flex items-center justify-center shrink-0 transition-all hover:scale-105 duration-300">
                            <img src={logoUrl} alt={`${platformName} Logo`} className="w-9 h-9 object-contain rounded-xl" />
                        </div>
                        {!collapsed && (
                            <div className="animate-in fade-in duration-300">
                                <h1 className="text-base font-bold text-white tracking-tight leading-none">{platformName}</h1>
                                <p className="text-[9px] text-[#FF7A00] uppercase font-black tracking-widest mt-1">Control Hub</p>
                            </div>
                        )}
                    </div>

                    {/* Mobile Close Button */}
                    <button 
                        onClick={() => setMobileOpen(false)}
                        className="p-1 text-slate-400 hover:text-white lg:hidden border border-white/5 bg-white/[0.02] rounded-lg"
                    >
                        <X size={16} />
                    </button>
                </div>

                {/* Sidebar Navigation */}
                <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-1.5 custom-scrollbar">
                    <NavItem 
                        href="/admin/dashboard" 
                        icon={<LayoutDashboard size={20} />} 
                        label="Dashboard" 
                        active={pathname === '/admin/dashboard'} 
                        collapsed={collapsed}
                    />

                    <div className={`pt-6 pb-2 px-3 text-[9px] font-black text-slate-600 uppercase tracking-[0.25em] transition-all
                        ${collapsed ? 'text-center pl-0 pr-0 scale-75' : ''}
                    `}>
                        {collapsed ? '•••' : 'Management'}
                    </div>
                    
                    <NavItem 
                        href="/admin/users" 
                        icon={<Users size={20} />} 
                        label="User Database" 
                        active={pathname?.startsWith('/admin/users')} 
                        collapsed={collapsed}
                    />
                    <NavItem 
                        href="/admin/kyc" 
                        icon={<ShieldCheck size={20} />} 
                        label="KYC Queue" 
                        active={pathname?.startsWith('/admin/kyc')} 
                        collapsed={collapsed}
                    />
                    <NavItem 
                        href="/admin/finance" 
                        icon={<Wallet size={20} />} 
                        label="Financial Ledger" 
                        active={pathname?.startsWith('/admin/finance')} 
                        collapsed={collapsed}
                    />

                    <div className={`pt-6 pb-2 px-3 text-[9px] font-black text-slate-600 uppercase tracking-[0.25em] transition-all
                        ${collapsed ? 'text-center pl-0 pr-0 scale-75' : ''}
                    `}>
                        {collapsed ? '•••' : 'Platform'}
                    </div>
                    
                    <NavItem 
                        href="/admin/rates" 
                        icon={<Globe size={20} />} 
                        label="Rates & Forex" 
                        active={pathname?.startsWith('/admin/rates')} 
                        collapsed={collapsed}
                    />
                    <NavItem 
                        href="/admin/notifications" 
                        icon={<Bell size={20} />} 
                        label="Broadcast Center" 
                        active={pathname?.startsWith('/admin/notifications')} 
                        collapsed={collapsed}
                    />
                    <NavItem 
                        href="/admin/sessions" 
                        icon={<ShieldAlert size={20} />} 
                        label="Session Audit" 
                        active={pathname?.startsWith('/admin/sessions')} 
                        collapsed={collapsed}
                    />
                    <NavItem 
                        href="/admin/audit" 
                        icon={<History size={20} />} 
                        label="System Audit Logs" 
                        active={pathname?.startsWith('/admin/audit')} 
                        collapsed={collapsed}
                    />
                    <NavItem 
                        href="/admin/settings" 
                        icon={<Settings size={20} />} 
                        label="Core Settings" 
                        active={pathname?.startsWith('/admin/settings')} 
                        collapsed={collapsed}
                    />
                </nav>

                {/* Sidebar Collapse Toggle (Desktop Only) */}
                <div className="hidden lg:flex p-3 border-t border-[#1E2533] bg-[#0A0D12]/40 items-center justify-between">
                    <button 
                        onClick={() => setCollapsed(!collapsed)}
                        className="w-full py-2 hover:bg-white/[0.03] text-slate-400 hover:text-white rounded-xl transition-all border border-transparent hover:border-white/5 flex items-center justify-center gap-2"
                        title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
                    >
                        {collapsed ? <ChevronRight size={18} /> : <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider"><ChevronLeft size={16} /> Hide Navigation</div>}
                    </button>
                </div>

                {/* Logout Button Container */}
                <div className="p-3 border-t border-[#1E2533] bg-[#0A0D12]/20">
                    <LogoutButton collapsed={collapsed} />
                </div>
            </aside>

            {/* Main Content Pane */}
            <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
                
                {/* Global Topbar Header */}
                <header className="h-16 border-b border-[#1E2533] bg-[#0D1017]/85 backdrop-blur-md flex items-center justify-between px-6 z-30 shrink-0">
                    
                    {/* Left: Mobile Toggle & Page Title */}
                    <div className="flex items-center gap-4">
                        <button 
                            onClick={() => setMobileOpen(true)}
                            className="p-2 text-slate-400 hover:text-white lg:hidden border border-white/5 bg-[#121214]/50 rounded-xl outline-none cursor-pointer"
                        >
                            <Menu size={18} />
                        </button>
                        
                        <div className="flex items-center gap-2.5 text-[11px] font-black uppercase tracking-[0.2em] text-slate-500">
                            <span className="hidden sm:inline">SWIFTPAY ADMIN</span>
                            <span className="hidden sm:inline text-[#1E2533]">/</span>
                            <span className="text-primary-orange">{pathname?.split('/').pop() || 'overview'}</span>
                        </div>
                    </div>

                    {/* Middle: Global Search Input */}
                    <div className="hidden md:flex relative max-w-md w-80">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={15} />
                        <input 
                            type="text" 
                            placeholder="Search operations, logs, accounts..." 
                            className="w-full pl-10 pr-4 py-1.5 bg-[#07090E] border border-[#1E2533] rounded-xl text-xs text-slate-300 placeholder:text-slate-600 focus:outline-none focus:border-primary-orange focus:ring-1 focus:ring-primary-orange/20 transition-all font-medium"
                        />
                    </div>

                    {/* Right: User Menu & Notification Center */}
                    <div className="flex items-center gap-4">
                        
                        {/* Quick Access Shortcut Center */}
                        <div className="hidden sm:flex items-center gap-2">
                            <Link href="/admin/kyc" className="p-2 text-slate-400 hover:text-primary-orange border border-white/5 bg-[#121214]/30 hover:border-primary-orange-border/30 rounded-xl transition-all" title="KYC Verification Queue">
                                <ShieldCheck size={16} />
                            </Link>
                            <Link href="/admin/finance" className="p-2 text-slate-400 hover:text-primary-orange border border-white/5 bg-[#121214]/30 hover:border-primary-orange-border/30 rounded-xl transition-all" title="Finances & Withdrawals">
                                <Wallet size={16} />
                            </Link>
                        </div>

                        <div className="h-4 w-px bg-[#1E2533] hidden sm:block" />

                        {/* Notification Panel Trigger */}
                        <div className="relative">
                            <button 
                                onClick={() => setShowNotifications(!showNotifications)}
                                className="relative p-2 text-slate-400 hover:text-[#FF7A00] transition-colors duration-300 border border-white/5 bg-[#121214]/30 hover:border-primary-orange-border/30 rounded-xl cursor-pointer"
                            >
                                <Bell size={17} />
                                <span className="absolute top-1 right-1 w-2 h-2 bg-primary-orange rounded-full shadow-[0_0_8px_rgba(255,122,0,0.6)] animate-pulse border border-[#0D1017]"></span>
                            </button>

                            {/* Notifications Dropdown */}
                            {showNotifications && (
                                <>
                                    <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)} />
                                    <div className="absolute right-0 top-full mt-2.5 w-80 bg-[#0D1017] border border-[#1E2533] rounded-2xl shadow-2xl z-50 p-4 animate-in fade-in zoom-in-95 duration-200 backdrop-blur-md">
                                        <div className="flex items-center justify-between pb-3 border-b border-[#1E2533]">
                                            <h4 className="text-xs font-bold text-white uppercase tracking-wider">Alert Center</h4>
                                            <span className="text-[9px] font-black bg-primary-orange-light text-primary-orange px-1.5 py-0.5 rounded border border-primary-orange-border">1 Action Required</span>
                                        </div>
                                        <div className="py-2.5 space-y-3 max-h-60 overflow-y-auto custom-scrollbar">
                                            <div className="p-2 bg-primary-orange-light/5 border border-primary-orange-border/25 rounded-xl flex gap-2">
                                                <ShieldAlert size={14} className="text-primary-orange shrink-0 mt-0.5" />
                                                <div>
                                                    <p className="text-[11px] font-bold text-slate-200">KYC Verification Request</p>
                                                    <p className="text-[9px] text-slate-500 mt-0.5">Pending identity verification for user @patrick</p>
                                                </div>
                                            </div>
                                            <div className="p-2 hover:bg-white/[0.02] border border-transparent rounded-xl flex gap-2 transition-all">
                                                <Activity size={14} className="text-emerald-400 shrink-0 mt-0.5" />
                                                <div>
                                                    <p className="text-[11px] font-medium text-slate-400">Database Backup Successful</p>
                                                    <p className="text-[9px] text-slate-600 mt-0.5 font-mono">13:00 UTC • Automated</p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="pt-2 border-t border-[#1E2533] text-center">
                                            <Link href="/admin/audit" className="text-[10px] font-black text-slate-500 hover:text-primary-orange uppercase tracking-wider transition-colors inline-block py-1">View System Audit Trail</Link>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Admin Identity Widget */}
                        <div className="flex items-center gap-3 pl-2 border-l border-[#1E2533]">
                            <div className="text-right hidden xl:block">
                                <p className="text-xs font-bold text-white leading-none">Super Admin</p>
                                <p className="text-[9px] text-slate-500 mt-1 font-mono">admin@swiftpay.ke</p>
                            </div>
                            <div className="w-9 h-9 rounded-xl bg-primary-orange-light border border-primary-orange-border text-primary-orange flex items-center justify-center font-black text-xs shadow-lg shadow-primary-orange/5 transition-transform hover:scale-105 duration-300">
                                SA
                            </div>
                        </div>
                    </div>
                </header>

                {/* Main Content Area Container */}
                <div className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar">
                    {children}
                </div>
            </main>
        </div>
    );
}

function NavItem({ href, icon, label, active, collapsed }: { href: string; icon: React.ReactNode; label: string; active: boolean; collapsed: boolean }) {
    return (
        <Link
            href={href}
            className={`flex items-center gap-3 p-3 rounded-xl transition-all duration-300 group font-bold text-sm border-l-2
                ${collapsed ? 'justify-center border-l-0' : ''}
                ${active
                    ? 'text-white bg-primary-orange-light border-primary-orange shadow-[inset_4px_0_12px_rgba(255,122,0,0.04)] shadow-lg shadow-primary-orange/5'
                    : 'text-slate-400 border-transparent hover:text-primary-orange hover:bg-[#121214]/40 hover:border-primary-orange/30'
                }
            `}
            title={collapsed ? label : undefined}
        >
            <span className={`transition-transform duration-300 group-hover:scale-105 group-active:scale-95 shrink-0
                ${active ? 'text-primary-orange filter drop-shadow-[0_0_3px_rgba(255,122,0,0.4)]' : 'text-slate-500 group-hover:text-primary-orange'}
            `}>
                {icon}
            </span>
            {!collapsed && (
                <span className="truncate animate-in fade-in duration-300 font-sans tracking-wide">
                    {label}
                </span>
            )}
        </Link>
    );
}
