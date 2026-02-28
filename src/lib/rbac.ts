export type Role = 'user' | 'super_admin' | 'admin' | 'finance' | 'kyc_reviewer' | 'support' | 'auditor';

export const ROLES: Record<string, Role> = {
    USER: 'user',
    SUPER_ADMIN: 'super_admin',
    ADMIN: 'admin',
    FINANCE: 'finance',
    KYC_REVIEWER: 'kyc_reviewer',
    SUPPORT: 'support',
    AUDITOR: 'auditor'
};

export const PERMISSIONS = {
    MANAGE_ADMINS: 'manage_admins', // Only SUPER_ADMIN
    PLATFORM_SETTINGS: 'platform_settings',
    APPROVE_WITHDRAWALS: 'approve_withdrawals',
    VIEW_BALANCES: 'view_balances',
    SET_RATES: 'set_rates',
    REVIEW_KYC: 'review_kyc',
    MANAGE_USERS: 'manage_users',
    VIEW_TRANSACTIONS: 'view_transactions',
    AUDIT_LOGS: 'audit_logs',
    BROADCAST_NOTIFICATIONS: 'broadcast_notifications',
    VIEW_SESSIONS: 'view_sessions',
    MANAGE_SESSIONS: 'manage_sessions',
    FREEZE_FUNDS: 'freeze_funds',
    FLAG_TRANSACTIONS: 'flag_transactions',
};

const ROLE_PERMISSIONS: Record<Role, string[]> = {
    super_admin: Object.values(PERMISSIONS),
    admin: [
        PERMISSIONS.PLATFORM_SETTINGS,
        PERMISSIONS.AUDIT_LOGS,
        PERMISSIONS.APPROVE_WITHDRAWALS,
        PERMISSIONS.VIEW_BALANCES,
        PERMISSIONS.SET_RATES,
        PERMISSIONS.REVIEW_KYC,
        PERMISSIONS.MANAGE_USERS,
        PERMISSIONS.VIEW_TRANSACTIONS,
        PERMISSIONS.BROADCAST_NOTIFICATIONS,
        PERMISSIONS.VIEW_SESSIONS,
        PERMISSIONS.MANAGE_SESSIONS,
        PERMISSIONS.FREEZE_FUNDS,
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
    auditor: [
        PERMISSIONS.AUDIT_LOGS,
        PERMISSIONS.VIEW_TRANSACTIONS,
        PERMISSIONS.FLAG_TRANSACTIONS, // Added for auditor role
    ],
    user: [],
};

export function hasPermission(role: Role, permission: string): boolean {
    const roleKey = role?.toLowerCase() as Role;
    return ROLE_PERMISSIONS[roleKey]?.includes(permission) || false;
}

export function isAdmin(role: Role): boolean {
    const roleKey = role?.toLowerCase();
    return ['super_admin', 'admin', 'finance', 'kyc_reviewer', 'support'].includes(roleKey);
}
