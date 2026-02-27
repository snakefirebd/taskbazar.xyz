const express = require('express');
const admin = require('firebase-admin');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Vercel Environment Variable থেকে সিক্রেট কি নিবে
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

// ফায়ারবেস অ্যাডমিন সেটআপ
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://exchange-project-d4028-default-rtdb.asia-southeast1.firebasedatabase.app"
});

const db = admin.database();
const APP_ID = "exchange-project-d4028";

// ইউজার ভেরিফাই করার মিডলওয়্যার (টোকেন চেকার)
const verifyUser = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    const token = authHeader.split('Bearer ')[1];
    try {
        const decodedToken = await admin.auth().verifyIdToken(token);
        req.uid = decodedToken.uid;
        next();
    } catch (error) {
        return res.status(401).json({ error: 'Invalid Token' });
    }
};

// ১. স্পিন হুইলের এপিআই
app.post('/api/spin', verifyUser, async (req, res) => {
    const uid = req.uid;
    const userRef = db.ref(`artifacts/${APP_ID}/users/${uid}/stats`);
    const historyRef = db.ref(`artifacts/${APP_ID}/users/${uid}/transactions`);

    try {
        const snapshot = await userRef.once('value');
        const userData = snapshot.val() || {};
        const currentPoints = userData.points || 0;
        
        if (currentPoints < 5) return res.status(400).json({ error: 'Not enough points' });

        const prizes = [0, 2, 5, 10, 20, 0, 50, 5];
        const prizeIndex = Math.floor(Math.random() * prizes.length);
        const winAmount = prizes[prizeIndex];

        const newPoints = (currentPoints - 5) + winAmount;
        await userRef.update({ points: newPoints });

        await historyRef.push({
            type: 'spin', amount: winAmount - 5, desc: `Spun the wheel (Won ${winAmount})`, timestamp: admin.database.ServerValue.TIMESTAMP
        });

        res.json({ success: true, prizeIndex, winAmount, newPoints });
    } catch (error) { res.status(500).json({ error: 'Database error' }); }
});

// ২. ডেইলি বোনাস এপিআই
app.post('/api/daily-bonus', verifyUser, async (req, res) => {
    const uid = req.uid;
    const userRef = db.ref(`artifacts/${APP_ID}/users/${uid}/stats`);
    const historyRef = db.ref(`artifacts/${APP_ID}/users/${uid}/transactions`);

    try {
        const snapshot = await userRef.once('value');
        const userData = snapshot.val() || {};
        const currentPoints = userData.points || 0;
        
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        const todayMidnight = now.getTime();

        if (userData.lastBonusDate === todayMidnight) {
            return res.status(400).json({ error: 'Already claimed today!' });
        }

        const newPoints = currentPoints + 10;
        await userRef.update({ points: newPoints, lastBonusDate: todayMidnight });

        await historyRef.push({
            type: 'bonus', amount: 10, desc: 'Daily Gift Claimed', timestamp: admin.database.ServerValue.TIMESTAMP
        });

        res.json({ success: true, newPoints, message: 'Claimed 10 points!' });
    } catch (error) { res.status(500).json({ error: 'Database error' }); }
});

// ৩. নতুন ক্যাম্পেইন তৈরি এপিআই
app.post('/api/create-campaign', verifyUser, async (req, res) => {
    const uid = req.uid;
    const { title, type, link, qty, totalCost, reward } = req.body;
    
    if (!title || !link || qty < 10) return res.status(400).json({ error: 'Invalid data' });

    const userRef = db.ref(`artifacts/${APP_ID}/users/${uid}/stats`);
    try {
        const snap = await userRef.once('value');
        const currentPoints = snap.val()?.points || 0;

        if (currentPoints < totalCost) return res.status(400).json({ error: 'Not enough points' });

        await userRef.update({ points: currentPoints - totalCost });

        const oid = "t_" + Date.now();
        await db.ref(`artifacts/${APP_ID}/public/data/microtasks/${oid}`).set({
            title, type, link, qty, reward, creatorId: uid, timestamp: admin.database.ServerValue.TIMESTAMP
        });

        res.json({ success: true });
    } catch (error) { res.status(500).json({ error: 'Database error' }); }
});

// ৪. ক্যাম্পেইন ডিলিট ও রিফান্ড এপিআই
app.post('/api/delete-campaign', verifyUser, async (req, res) => {
    const uid = req.uid;
    const { taskId, refundPoints } = req.body;

    try {
        const taskRef = db.ref(`artifacts/${APP_ID}/public/data/microtasks/${taskId}`);
        const taskSnap = await taskRef.once('value');
        
        if (!taskSnap.exists() || taskSnap.val().creatorId !== uid) return res.status(403).json({ error: 'Unauthorized' });

        await taskRef.remove();

        if (refundPoints > 0) {
            const userRef = db.ref(`artifacts/${APP_ID}/users/${uid}/stats`);
            const uSnap = await userRef.once('value');
            const currentPoints = uSnap.val()?.points || 0;
            
            await userRef.update({ points: currentPoints + refundPoints });
            await db.ref(`artifacts/${APP_ID}/users/${uid}/transactions`).push({
                type: 'refund', amount: refundPoints, desc: 'Campaign Delete Refund', timestamp: admin.database.ServerValue.TIMESTAMP
            });
        }
        res.json({ success: true });
    } catch (error) { res.status(500).json({ error: 'Database error' }); }
});

// ৫. প্রুফ অ্যাপ্রুভ/রিজেক্ট এপিআই
app.post('/api/review-proof', verifyUser, async (req, res) => {
    const uid = req.uid;
    const { taskId, subId, workerId, rewardPoints, newStatus } = req.body;

    try {
        const taskRef = db.ref(`artifacts/${APP_ID}/public/data/microtasks/${taskId}`);
        const taskSnap = await taskRef.once('value');
        
        if (!taskSnap.exists() || taskSnap.val().creatorId !== uid) return res.status(403).json({ error: 'Unauthorized' });

        await db.ref(`artifacts/${APP_ID}/public/data/submissions/${taskId}/${subId}`).update({
            status: newStatus, reviewedAt: admin.database.ServerValue.TIMESTAMP
        });

        if (newStatus === 'approved') {
            const workerRef = db.ref(`artifacts/${APP_ID}/users/${workerId}/stats`);
            const wSnap = await workerRef.once('value');
            const wData = wSnap.val() || {};
            
            await workerRef.update({
                points: (wData.points || 0) + rewardPoints,
                tasksCompleted: (wData.tasksCompleted || 0) + 1
            });

            await db.ref(`artifacts/${APP_ID}/users/${workerId}/transactions`).push({
                type: 'mission', amount: rewardPoints, desc: 'Mission Approved', timestamp: admin.database.ServerValue.TIMESTAMP
            });
        }

        const notifTitle = newStatus === 'approved' ? 'Mission Approved! ✅' : 'Mission Rejected ❌';
        const notifMsg = newStatus === 'approved' ? `Your proof was approved, +${rewardPoints} points.` : 'The creator rejected your proof.';

        await db.ref(`artifacts/${APP_ID}/users/${workerId}/notifications`).push({
            title: notifTitle, message: notifMsg, timestamp: admin.database.ServerValue.TIMESTAMP
        });

        res.json({ success: true });
    } catch (error) { res.status(500).json({ error: 'Database error' }); }
});

// ৬. রেফারেল বোনাস এপিআই
app.post('/api/referral', verifyUser, async (req, res) => {
    const uid = req.uid;
    const { referCode, newUserName } = req.body;
    
    if (!referCode) return res.status(400).json({ error: 'No code' });

    try {
        const myStatsRef = db.ref(`artifacts/${APP_ID}/users/${uid}/stats`);
        const mySnap = await myStatsRef.once('value');
        if (mySnap.val()?.referredBy) return res.status(400).json({ error: 'Already referred' });

        const usersRef = db.ref(`artifacts/${APP_ID}/users`);
        const snapshot = await usersRef.once('value');
        const allUsers = snapshot.val();

        if (allUsers) {
            for (const referrerUid in allUsers) {
                const userData = allUsers[referrerUid].stats;
                if (userData && userData.referralCode === referCode && referrerUid !== uid) {
                    
                    const currentPoints = userData.points || 0;
                    await db.ref(`artifacts/${APP_ID}/users/${referrerUid}/stats`).update({
                        points: currentPoints + 50
                    });

                    await db.ref(`artifacts/${APP_ID}/users/${referrerUid}/transactions`).push({
                        type: 'referral', amount: 50, desc: `Referral Bonus (${newUserName})`, timestamp: admin.database.ServerValue.TIMESTAMP
                    });

                    await db.ref(`artifacts/${APP_ID}/users/${referrerUid}/notifications`).push({
                        title: 'রেফারেল বোনাস! 🎁', message: `আপনার রেফার কোড ব্যবহার করে ${newUserName} জয়েন করেছে। +50 পয়েন্ট!`, timestamp: admin.database.ServerValue.TIMESTAMP
                    });

                    await myStatsRef.update({ referredBy: referrerUid });
                    return res.json({ success: true });
                }
            }
        }
        res.status(400).json({ error: 'Invalid code' });
    } catch (error) { res.status(500).json({ error: 'Database error' }); }
});

app.get('/', (req, res) => {
    res.send('TaskBazar Full Secure Backend is Running! 🚀');
});

module.exports = app;
