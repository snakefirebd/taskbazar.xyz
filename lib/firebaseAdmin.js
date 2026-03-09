import admin from 'firebase-admin';

if (!admin.apps.length) {
    try {
        const serviceAccountEnv = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
        
        if (serviceAccountEnv) {
            // JSON পার্স করা
            const serviceAccount = JSON.parse(serviceAccountEnv);

            // Vercel-এর \n সমস্যা সমাধানের জাদুকরী লাইন
            if (serviceAccount.private_key) {
                serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
            }

            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount),
                databaseURL: "https://exchange-project-d4028-default-rtdb.asia-southeast1.firebasedatabase.app"
            });
            console.log("Firebase Admin Initialized...");
        } else {
            console.error("FIREBASE_SERVICE_ACCOUNT_KEY is missing!");
        }

    } catch (error) {
        console.error('Firebase Admin Init Error:', error.message);
    }
}

export const dbAdmin = admin.database();
export const authAdmin = admin.auth();
export const appId = JSON.parse(process.env.NEXT_PUBLIC_FIREBASE_CONFIG || '{}').projectId;
