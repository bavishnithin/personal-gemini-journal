import admin from 'firebase-admin';

// Initialize Firebase Admin SDK using Application Default Credentials (ADC)
// In production on GCP, this automatically picks up the service account.
// In local dev, it relies on GOOGLE_APPLICATION_CREDENTIALS.
admin.initializeApp();

const db = admin.firestore();

export { admin, db };
