export type Role = 'user' | 'admin' | 'finance' | 'kyc_reviewer' | 'support';

export const ROLES: Record<string, Role> = {
    USER: 'user',
    ADMIN: 'admin',
    FINANCE: 'finance',
    KYC_REVIEWER: 'kyc_reviewer',
    SUPPORT: 'support'
};

export const PERMISSIONS = {
    MANAGE_ADMINS: 'manage_admins',
    PLATFORM_SETTINGS: 'platform_settings',
    APPROVE_WITHDRAWALS: 'approve_withdrawals',
    VIEW_BALANCES: 'view_balances',
    SET_RATES: 'set_rates',
    REVIEW_KYC: 'review_kyc',
    MANAGE_USERS: 'manage_users',
    VIEW_TRANSACTIONS: 'view_transactions',
    AUDIT_LOGS: 'audit_logs',
};

const ROLE_PERMISSIONS: Record<Role, string[]> = {
    admin: [
        PERMISSIONS.MANAGE_ADMINS,
        PERMISSIONS.PLATFORM_SETTINGS,
        PERMISSIONS.AUDIT_LOGS,
        PERMISSIONS.APPROVE_WITHDRAWALS,
        PERMISSIONS.VIEW_BALANCES,
        PERMISSIONS.SET_RATES,
        PERMISSIONS.REVIEW_KYC,
        PERMISSIONS.MANAGE_USERS,
        PERMISSIONS.VIEW_TRANSACTIONS,
    ],
    finance: [
        PERMISSIONS.APPROVE_WITHDRAWALS,
        PERMISSIONS.VIEW_BALANCES,
        PERMISSIONS.SET_RATES,
        PERMISSIONS.VIEW_TRANSACTIONS,
    ],
    kyc_reviewer: [
        PERMISSIONS.REVIEW_KYC,
        PERMISSIONS.VIEW_TRANSACTIONS,
    ],
    support: [
        PERMISSIONS.MANAGE_USERS,
        PERMISSIONS.VIEW_TRANSACTIONS,
    ],
    user: [],
};

export function hasPermission(role: Role, permission: string): boolean {
    return ROLE_PERMISSIONS[role]?.includes(permission) || false;
}

export function isAdmin(role: Role): boolean {
    return ['admin', 'finance', 'kyc_reviewer', 'support'].includes(role);
}
