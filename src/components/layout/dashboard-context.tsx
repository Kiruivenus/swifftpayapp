"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

interface UserProfile {
    id: string;
    username: string;
    fullName: string;
    email: string;
    phone: string;
    dob: string | null;
    isPinSet: boolean;
    biometricEnabled: boolean;
    kycStatus: 'NOT_STARTED' | 'PENDING' | 'APPROVED' | 'REJECTED';
    kycRejectionReason?: string;
    nationalityCode?: string;
    nationalityName?: string;
    residentialAddress?: string;
    profilePhotoUrl?: string;
}

interface UserBalance {
    kesBalance: number;
    availableKesBalance: number;
    pendingKES: number;
    usdtBalance: number;
    availableUsdtBalance: number;
    pendingUSDT: number;
    totalBalanceKES: number;
    currency: string;
}

interface DashboardContextType {
    profile: UserProfile | null;
    balance: UserBalance | null;
    loading: boolean;
    error: string;
    isPayMenuOpen: boolean;
    setIsPayMenuOpen: (open: boolean) => void;
    refreshData: () => Promise<void>;
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

export function DashboardProvider({ children }: { children: React.ReactNode }) {
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [balance, setBalance] = useState<UserBalance | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isPayMenuOpen, setIsPayMenuOpen] = useState(false);

    const refreshData = useCallback(async () => {
        try {
            const [profileRes, balanceRes] = await Promise.all([
                fetch('/api/user/profile'),
                fetch('/api/user/balance')
            ]);

            if (profileRes.status === 401 || balanceRes.status === 401) {
                window.location.href = '/login';
                return;
            }

            if (!profileRes.ok || !balanceRes.ok) {
                throw new Error('Failed to fetch user dashboard data');
            }

            const [profileData, balanceData] = await Promise.all([
                profileRes.json(),
                balanceRes.json()
            ]);

            setProfile(profileData);
            setBalance(balanceData);
            setError('');
        } catch (err: any) {
            setError(err.message || 'An error occurred loading dashboard data.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        refreshData();
    }, [refreshData]);

    return (
        <DashboardContext.Provider value={{
            profile,
            balance,
            loading,
            error,
            isPayMenuOpen,
            setIsPayMenuOpen,
            refreshData
        }}>
            {children}
        </DashboardContext.Provider>
    );
}

export function useDashboard() {
    const context = useContext(DashboardContext);
    if (!context) {
        throw new Error('useDashboard must be used within a DashboardProvider');
    }
    return context;
}
