import * as admin from 'firebase-admin';

if (!admin.apps.length) {
    try {
        const projectId = process.env.FIREBASE_PROJECT_ID;
        const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
        const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

        if (projectId && clientEmail && privateKey) {
            admin.initializeApp({
                credential: admin.credential.cert({
                    projectId,
                    clientEmail,
                    privateKey,
                }),
            });
            console.log('Firebase Admin initialized successfully');
        } else {
            console.warn('Firebase Admin credentials missing. Push notifications will be disabled.');
        }
    } catch (error) {
        console.error('Firebase Admin initialization error:', error);
    }
}

export const fcm = admin.apps.length 
    ? admin.messaging() 
    : {
        sendEachForMulticast: async (payload: any) => {
            console.warn('FCM sendEachForMulticast skipped: Firebase Admin is not initialized.');
            return { successCount: 0, failureCount: 0, responses: [] };
        }
      } as any;

export default admin;
