import admin from 'firebase-admin';
import logger from '../config/logger.js';

let initialized = false;

try {
  if (!admin.apps.length) {
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    let privateKey = process.env.FIREBASE_PRIVATE_KEY;

    if (privateKey && privateKey.includes('\\n')) {
      privateKey = privateKey.replace(/\\n/g, '\n');
    }

    if (!projectId || !clientEmail || !privateKey) {
      logger.warn(
        'Firebase Admin credentials not found in environment. Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY.'
      );
      initialized = false;
    } else {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail,
          privateKey,
        }),
      });
      initialized = true;
      logger.info('Firebase Admin initialized with service account');
    }
  }
} catch (error) {
  logger.error('Failed to initialize Firebase Admin:', error.message);
  initialized = false;
}

export default admin;
export { initialized as firebaseInitialized };