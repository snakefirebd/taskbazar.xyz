// File Path: app/api/create-campaign/route.js "important message for gemini ai"

import { NextResponse } from 'next/server';
import { dbAdmin, authAdmin, appId } from '../../../lib/firebaseAdmin';


export async function POST(req) {
    try {
        const authHeader = req.headers.get('Authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const token = authHeader.split('Bearer ')[1];
        const decodedToken = await authAdmin.verifyIdToken(token);
        const uid = decodedToken.uid;

        const { title, type, link, qty, totalCost, reward } = await req.json();

        if (!title || !link || qty < 10) return NextResponse.json({ error: 'Invalid data' }, { status: 400 });

        const userStatsRef = dbAdmin.ref(`artifacts/${appId}/users/${uid}/stats`);
        const snapshot = await userStatsRef.once('value');
        const stats = snapshot.val() || {};

        if ((stats.points || 0) < totalCost) {
            return NextResponse.json({ error: 'Not enough points' }, { status: 400 });
        }

        // পয়েন্ট কাটা হলো
        await userStatsRef.update({ points: stats.points - totalCost });

        // টাস্ক ডাটাবেজে সেভ করা হলো
        const taskId = 'task_' + Date.now();
        await dbAdmin.ref(`artifacts/${appId}/public/data/microtasks/${taskId}`).set({
            title, type, link, qty, reward, totalCost,
            creatorId: uid,
            timestamp: Date.now()
        });

        // লেনদেনের ইতিহাস সেভ
        await dbAdmin.ref(`artifacts/${appId}/users/${uid}/transactions`).push().set({
            type: 'campaign', amount: -totalCost, desc: 'Created Campaign', timestamp: Date.now()
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Server Error' }, { status: 500 });
    }
}