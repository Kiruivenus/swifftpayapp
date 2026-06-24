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
        kycStatus?: string;
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

    async getUserSummary(id: string) {
        return this.fetchJson(`/api/admin/users/${id}/summary`);
    }

    async getUserTransactions(id: string, params: any = {}) {
        const query = new URLSearchParams(params as any).toString();
        return this.fetchJson(`/api/admin/users/${id}/transactions?${query}`);
    }

    async promoteAdmin(userId: string, role: string) {
        return this.fetchJson('/api/admin/admins/create-or-promote', {
            method: 'POST',
            body: JSON.stringify({ userId, role }),
        });
    }

    async getUserIntelligence(id: string) {
        return this.fetchJson(`/api/admin/users/${id}/intelligence`);
    }

    async resetUserPassword(id: string, password: string) {
        return this.fetchJson(`/api/admin/users/${id}/reset-password`, {
            method: 'POST',
            body: JSON.stringify({ password }),
        });
    }

    async forceUserLogout(id: string) {
        return this.fetchJson(`/api/admin/users/${id}/force-logout`, {
            method: 'POST',
        });
    }

    async adjustUserBalance(id: string, data: { currency: string; amount: number; type: 'CREDIT' | 'DEBIT'; reason: string }) {
        return this.fetchJson(`/api/admin/users/${id}/adjust-balance`, {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    async sendUserNotification(id: string, data: { title: string; message: string; type?: string }) {
        return this.fetchJson(`/api/admin/users/${id}/send-notification`, {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    async deleteUser(id: string) {
        return this.fetchJson(`/api/admin/users/${id}`, {
            method: 'DELETE',
        });
    }

    async getUserAnalytics() {
        return this.fetchJson('/api/admin/users/analytics');
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

    async getKycAnalytics() {
        return this.fetchJson('/api/admin/kyc/analytics');
    }

    async submitKycAction(id: string, action: string, details: { reason?: string; notes?: string } = {}) {
        return this.fetchJson(`/api/admin/kyc/${id}/action`, {
            method: 'POST',
            body: JSON.stringify({ action, ...details }),
        });
    }

    // Finance (Phase 11)
    async getTransactions(params: {
        q?: string;
        type?: string;
        status?: string;
        currency?: string;
        from?: string;
        to?: string;
        page?: number;
        limit?: number
    }) {
        const query = new URLSearchParams(params as any).toString();
        return this.fetchJson(`/api/admin/transactions?${query}`);
    }

    async getTransactionDetails(id: string) {
        return this.fetchJson(`/api/admin/transactions/${id}`);
    }

    async failTransaction(id: string, reason: string) {
        return this.fetchJson(`/api/admin/transactions/${id}/fail`, {
            method: 'POST',
            body: JSON.stringify({ reason }),
        });
    }

    async flagTransaction(id: string, reason: string) {
        return this.fetchJson(`/api/admin/transactions/${id}/flag`, {
            method: 'POST',
            body: JSON.stringify({ reason }),
        });
    }

    async unflagTransaction(id: string, reason: string = '') {
        return this.fetchJson(`/api/admin/transactions/${id}/unflag`, {
            method: 'POST',
            body: JSON.stringify({ reason }),
        });
    }

    async submitTransactionAction(id: string, action: 'HOLD' | 'REVERSE' | 'RESOLVE_FAVOR_RECEIVER', reason: string) {
        return this.fetchJson(`/api/admin/transactions/${id}/action`, {
            method: 'POST',
            body: JSON.stringify({ action, reason }),
        });
    }

    async getFinanceMetrics(params: { range?: string; from?: string; to?: string } = {}) {
        const query = new URLSearchParams(params as any).toString();
        return this.fetchJson(`/api/admin/finance/metrics?${query}`);
    }

    async getWithdrawals(params: { status?: string; currency?: string; page?: number; limit?: number } = {}) {
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

    async submitWithdrawalAction(id: string, action: 'APPROVE' | 'REJECT' | 'HOLD' | 'ESCALATE' | 'REVERSE', details: { reason?: string } = {}) {
        return this.fetchJson(`/api/admin/withdrawals/${id}/action`, {
            method: 'POST',
            body: JSON.stringify({ action, ...details }),
        });
    }

    async overrideRatePair(data: { baseCurrency: string; quoteCurrency: string; rate: number }) {
        return this.fetchJson('/api/admin/rates/override', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    getFinanceExportUrl(params: { reportType: string; format: string; from?: string; to?: string }) {
        const query = new URLSearchParams(params as any).toString();
        return `/api/admin/finance/export?${query}`;
    }

    // Balance Holds
    async getUserHolds(userId: string) {
        return this.fetchJson(`/api/admin/users/${userId}/holds`);
    }

    async createHold(userId: string, data: { currency: string; amount: number; reason: string; referenceId?: string }) {
        return this.fetchJson(`/api/admin/users/${userId}/holds`, {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    async releaseHold(holdId: string, reason: string = '') {
        return this.fetchJson(`/api/admin/holds/${holdId}/release`, {
            method: 'POST',
            body: JSON.stringify({ reason }),
        });
    }

    // Rates & Localization (Phase 7)
    async getRatesConfig() {
        return this.fetchJson('/api/admin/rates/config');
    }

    async updateRatePair(data: { baseCurrency: string; quoteCurrency: string; rate: number; source?: string }) {
        return this.fetchJson('/api/admin/rates/pairs', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    async updateFeesLimits(data: any) {
        return this.fetchJson('/api/admin/rates/fees-limits', {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    }

    async updateRegion(countryCode: string, data: any) {
        return this.fetchJson(`/api/admin/rates/regions/${countryCode}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    }

    async addRegion(data: any) {
        return this.fetchJson('/api/admin/rates/regions', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    async deleteRatePair(baseCurrency: string, quoteCurrency: string) {
        return this.fetchJson(`/api/admin/rates/pairs?base=${baseCurrency}&quote=${quoteCurrency}`, {
            method: 'DELETE',
        });
    }

    async toggleConversionFreeze(frozen: boolean, reason: string) {
        return this.fetchJson('/api/admin/rates/freeze', {
            method: 'POST',
            body: JSON.stringify({ frozen, reason }),
        });
    }

    async toggleEmergencyFreeze(data: { conversionsFrozen?: boolean; depositsFrozen?: boolean; withdrawalsFrozen?: boolean; disabledRegions?: string[]; disabledCurrencies?: string[]; reason: string }) {
        return this.fetchJson('/api/admin/rates/freeze', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    async toggleRatePairLock(baseCurrency: string, quoteCurrency: string, isLocked: boolean) {
        return this.fetchJson('/api/admin/rates/pairs/lock', {
            method: 'POST',
            body: JSON.stringify({ baseCurrency, quoteCurrency, isLocked }),
        });
    }

    async getCurrencies() {
        return this.fetchJson('/api/admin/rates/currencies');
    }

    async addCurrency(data: any) {
        return this.fetchJson('/api/admin/rates/currencies', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    async updateCurrency(code: string, data: any) {
        return this.fetchJson(`/api/admin/rates/currencies/${code}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    }

    async deleteCurrency(code: string) {
        return this.fetchJson(`/api/admin/rates/currencies/${code}`, {
            method: 'DELETE',
        });
    }

    async getRatesHistory(params: { type?: string; page?: number; limit?: number } = {}) {
        const query = new URLSearchParams(params as any).toString();
        return this.fetchJson(`/api/admin/rates/history?${query}`);
    }

    // Communications (Phase 10)
    async getCommunicationsOverview() {
        return this.fetchJson('/api/admin/communications/overview');
    }

    async getAudienceEstimate(targetAudience: any) {
        return this.fetchJson('/api/admin/communications/estimate', {
            method: 'POST',
            body: JSON.stringify({ targetAudience }),
        });
    }

    async createBroadcast(data: any) {
        return this.fetchJson('/api/admin/communications/broadcasts', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    async getBroadcasts(params: { page?: number; limit?: number } = {}) {
        const query = new URLSearchParams(params as any).toString();
        return this.fetchJson(`/api/admin/communications/broadcasts?${query}`);
    }

    async updateNotificationSettings(settings: any) {
        return this.fetchJson('/api/admin/communications/settings', {
            method: 'PUT',
            body: JSON.stringify(settings),
        });
    }

    // Audit Logs
    async getAuditLogs(params: {
        q?: string;
        from?: string;
        to?: string;
        actionType?: string;
        severity?: string;
        page?: number;
        limit?: number;
    }) {
        const query = new URLSearchParams(params as any).toString();
        return this.fetchJson(`/api/admin/audit-logs?${query}`);
    }

    async getAuditLogDetails(id: string) {
        return this.fetchJson(`/api/admin/audit-logs/${id}`);
    }

    getAuditExportUrl(params: any) {
        const query = new URLSearchParams(params).toString();
        return `/api/admin/audit-logs/export?${query}`;
    }

    // Platform Settings
    async getSettings() {
        return this.fetchJson('/api/admin/settings');
    }

    async updateGeneralSettings(data: any) {
        return this.fetchJson('/api/admin/settings/general', {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    }

    async updateIntegrationKeys(data: any) {
        return this.fetchJson('/api/admin/settings/integrations', {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    }

    async getSystemHealth() {
        return this.fetchJson('/api/admin/health');
    }

    async uploadBrandAsset(type: 'logo' | 'favicon', image: string) {
        return this.fetchJson('/api/admin/settings/assets', {
            method: 'POST',
            body: JSON.stringify({ type, image }),
        });
    }

    // Security & Sessions (Phase 8)
    async getSessionsOverview(params: { userId?: string; q?: string; type?: string; status?: string } = {}) {
        const query = new URLSearchParams(params as any).toString();
        return this.fetchJson(`/api/admin/sessions/overview?${query}`);
    }

    async revokeSession(sessionId: string) {
        return this.fetchJson('/api/admin/sessions/revoke', {
            method: 'POST',
            body: JSON.stringify({ sessionId }),
        });
    }

    async revokeAllSessions(userId?: string) {
        return this.fetchJson('/api/admin/sessions/revoke-all', {
            method: 'POST',
            body: JSON.stringify({ userId }),
        });
    }

    async trustDevice(sessionId: string, trusted: boolean) {
        return this.fetchJson('/api/admin/sessions/trust', {
            method: 'POST',
            body: JSON.stringify({ sessionId, trusted }),
        });
    }

    async updateSecurityPolicies(data: any) {
        return this.fetchJson('/api/admin/security-policies', {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    }
}

export const adminService = new AdminService();
