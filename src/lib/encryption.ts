import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;
const MASTER_KEY = process.env.MASTER_ENCRYPTION_KEY || 'default-secret-key-change-me-in-prod-32-chars';

/**
 * Encrypts a string using AES-256-GCM
 */
export function encrypt(text: string): string {
    if (!text) return '';

    // Ensure key is 32 bytes
    const key = crypto.createHash('sha256').update(MASTER_KEY).digest();
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag().toString('hex');

    // Return iv:authTag:encrypted
    return `${iv.toString('hex')}:${authTag}:${encrypted}`;
}

/**
 * Decrypts a string using AES-256-GCM
 */
export function decrypt(encryptedData: string): string {
    if (!encryptedData || !encryptedData.includes(':')) return '';

    try {
        const [ivHex, authTagHex, encryptedText] = encryptedData.split(':');
        const key = crypto.createHash('sha256').update(MASTER_KEY).digest();
        const iv = Buffer.from(ivHex, 'hex');
        const authTag = Buffer.from(authTagHex, 'hex');

        const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
        decipher.setAuthTag(authTag);

        let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
        decrypted += decipher.final('utf8');

        return decrypted;
    } catch (error) {
        console.error('Decryption failed:', error);
        return '';
    }
}

/**
 * Masks a sensitive string (e.g. "••••••••abcd")
 */
export function maskSecret(secret: string, visibleChars = 4): string {
    if (!secret) return '••••••••';
    if (secret.length <= visibleChars) return '••••••••';
    return '••••••••' + secret.slice(-visibleChars);
}
