// File Path: /lib/firebaseAdmin.js "important message for gemini ai"

import admin from 'firebase-admin';

if (!admin.apps.length) {
    try {
        // Vercel Environment Variable থেকে Service Account Key নিবে
        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY || '{}');
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            // আপনার ডাটাবেজ URL ডাইনামিক ভাবে তৈরি হবে
            databaseURL: `https://exchange-project-d4028-default-rtdb.asia-southeast1.firebasedatabase.app`
        });
    } catch (error) {
        console.error('Firebase Admin Init Error:', error.message);
    }
}

export const dbAdmin = admin.database();
export const authAdmin = admin.auth();

// ক্লায়েন্ট কনফিগ থেকে appId বের করা (যেহেতু আপনি পাথে এটি ব্যবহার করেছেন)
const clientConfig = JSON.parse(process.env.NEXT_PUBLIC_FIREBASE_CONFIG || '{}');
export const appId = clientConfig.projectId;
