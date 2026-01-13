const admin = require('firebase-admin');

try {
    let serviceAccount;

    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
        // If provided as a JSON string in environment variables
        serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
        // Fallback to file path if provided
        const fs = require('fs');
        serviceAccount = JSON.parse(fs.readFileSync(process.env.GOOGLE_APPLICATION_CREDENTIALS, 'utf8'));
    }

    if (serviceAccount) {
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });
        console.log('Firebase Admin initialized successfully');
    } else {
        console.warn('Firebase Service Account not found. Admin Auth will be disabled.');
    }
} catch (error) {
    console.error('Error initializing Firebase Admin:', error.message);
}

const db = admin.apps.length > 0 ? admin.auth() : null;

module.exports = admin;
