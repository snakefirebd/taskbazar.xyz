// File Path: app/api/spin/route.js "important message for gemini ai"

import { NextResponse } from 'next/server';
import { dbAdmin, authAdmin, appId } from '../../../lib/firebaseAdmin';

const prizes = [0, 2, 5, 10, 20, 0, 50, 5];
const SPIN_COST = 5;

export async function POST(req) {
    try {
        const authHeader = req.headers.get('Authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const token = authHeader.split('Bearer ')[1];
        const decodedToken = await authAdmin.verifyIdToken(token);
        const uid = decodedToken.uid;

        const userStatsRef = dbAdmin.ref(`artifacts/${appId}/users/${uid}/stats`);
        const snapshot = await userStatsRef.once('value');
        const stats = snapshot.val() || {};

        let currentPoints = stats.points || 0;
        if (currentPoints < SPIN_COST) return NextResponse.json({ error: 'Low points!' }, { status: 400 });

        // র‍্যান্ডম প্রাইজ সিলেক্ট
        const prizeIndex = Math.floor(Math.random() * prizes.length);
        const winAmount = prizes[prizeIndex];

        currentPoints = currentPoints - SPIN_COST + winAmount;
        await userStatsRef.update({ points: currentPoints });

        await dbAdmin.ref(`artifacts/${appId}/users/${uid}/transactions`).push().set({
            type: 'spin', amount: winAmount - SPIN_COST, desc: winAmount > 0 ? 'Won from Spin' : 'Spin Loss', timestamp: Date.now()
        });

        return NextResponse.json({ success: true, prizeIndex, winAmount, newPoints: currentPoints });
    } catch (error) {
        return NextResponse.json({ error: 'Server Error' }, { status: 500 });
    }
}