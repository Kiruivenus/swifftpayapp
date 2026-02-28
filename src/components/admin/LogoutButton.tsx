"use client";

import React from 'react';
import { LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function LogoutButton() {
    const router = useRouter();

    const handleLogout = async () => {
        try {
            await fetch('/api/auth/logout', { method: 'POST' });
            router.push('/login');
        } catch (error) {
            console.error('Logout failed:', error);
            router.push('/login');
        }
    };

    return (
        <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full p-3 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all font-medium text-sm"
        >
            <LogOut size={20} />
            Logout
        </button>
    );
}
