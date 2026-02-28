/**
 * Admin Service
 * Handles all API communication for the Admin Portal.
 * Connects to /api/admin/* endpoints.
 */

export interface OverviewStats {
    totalUsers: number;
    verifiedUsers: number;
    pendingKyc: number;
    activeSessions: number;
    finance: {
        totalDepositsKES: number;
        totalWithdrawalsKES: number;
        totalDepositsUSDT: number;
        totalWithdrawalsUSDT: number;
    };
    deltas: {
        users: string;
        deposits: string;
        kyc: string;
        volume: string;
    };
}

export interface ActivityData {
    labels: string[];
    datasets: {
        label: string;
        data: number[];
        borderColor: string;
        backgroundColor?: string;
    }[];
}

class AdminService {
    private async fetchJson(endpoint: string, options: RequestInit = {}) {
        const res = await fetch(endpoint, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers,
            },
        });

        if (!res.ok) {
            const error = await res.json().catch(() => ({ message: 'An unknown error occurred' }));
            throw new Error(error.message || `API Error: ${res.status}`);
        }

        return res.json();
    }

    // Dashboard
    async getOverviewStats(): Promise<OverviewStats> {
        return this.fetchJson('/api/admin/overview');
    }

    async getActivity(range: 'daily' | 'weekly' | 'monthly' = 'daily'): Promise<ActivityData> {
        return this.fetchJson(`/api/admin/activity?range=${range}`);
    }

    // Users
    async getUsers(params: {
        search?: string;
        status?: string;
        role?: string;
        page?: number;
        limit?: number;
    }) {
        const query = new URLSearchParams(params as any).toString();
        return this.fetchJson(`/api/admin/users?${query}`);
    }

    async getUserDetails(id: string) {
        return this.fetchJson(`/api/admin/users/${id}`);
    }

    async updateUser(id: string, data: any) {
        return this.fetchJson(`/api/admin/users/${id}`, {
            method: 'PATCH',
            body: JSON.stringify(data),
        });
    }

    // KYC
    async getKycRequests(params: { status?: string; page?: number; limit?: number }) {
        const query = new URLSearchParams(params as any).toString();
        return this.fetchJson(`/api/admin/kyc?${query}`);
    }

    async approveKyc(id: string) {
        return this.fetchJson(`/api/admin/kyc/${id}/approve`, { method: 'POST' });
    }

    async rejectKyc(id: string, reason: string) {
        return this.fetchJson(`/api/admin/kyc/${id}/reject`, {
            method: 'POST',
            body: JSON.stringify({ reason }),
        });
    }

    // Finance
    async getTransactions(params: { search?: string; type?: string; status?: string; page?: number; limit?: number }) {
        const query = new URLSearchParams(params as any).toString();
        return this.fetchJson(`/api/admin/transactions?${query}`);
    }

    async getWithdrawals(params: { status?: string; page?: number; limit?: number } = {}) {
        const query = new URLSearchParams(params as any).toString();
        return this.fetchJson(`/api/admin/withdrawals?${query}`);
    }

    async getWithdrawalQueue() {
        return this.getWithdrawals({ status: 'PENDING' });
    }

    async approveWithdrawal(id: string) {
        return this.fetchJson(`/api/admin/withdrawals/${id}/approve`, { method: 'POST' });
    }

    async rejectWithdrawal(id: string, reason: string) {
        return this.fetchJson(`/api/admin/withdrawals/${id}/reject`, {
            method: 'POST',
            body: JSON.stringify({ reason }),
        });
    }

    // Rates & Settings
    async getRates() {
        return this.fetchJson('/api/admin/rates');
    }

    async updateRates(data: any) {
        return this.fetchJson('/api/admin/rates', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    async getCountries() {
        return this.fetchJson('/api/admin/countries');
    }

    async updateCountry(id: string, data: any) {
        return this.fetchJson(`/api/admin/countries/${id}`, {
            method: 'PATCH',
            body: JSON.stringify(data),
        });
    }

    // Notifications
    async broadcastNotification(data: { title: string; body: string; type: string }) {
        return this.fetchJson('/api/admin/notifications/broadcast', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    // Sessions
    async getSessions(userId?: string) {
        const endpoint = userId ? `/api/admin/sessions?userId=${userId}` : '/api/admin/sessions';
        return this.fetchJson(endpoint);
    }

    async revokeSession(sessionId: string) {
        return this.fetchJson('/api/admin/sessions/logout', {
            method: 'POST',
            body: JSON.stringify({ sessionId }),
        });
    }
}

export const adminService = new AdminService();
