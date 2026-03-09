// File Path: app/api/daily-bonus/route.js "important message for gemini ai"

import { NextResponse } from 'next/server';
import { dbAdmin, authAdmin, appId } from '../../../lib/firebaseAdmin';

const BONUS_AMOUNT = 10;
const CLAIM_COOLDOWN = 24 * 60 * 60 * 1000; // 24 ঘণ্টা

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

        const lastClaim = stats.lastDailyBonus || 0;
        const now = Date.now();

        if (now - lastClaim < CLAIM_COOLDOWN) {
            return NextResponse.json({ error: 'আজকের বোনাস আগেই নেওয়া হয়েছে!' }, { status: 400 });
        }

        await userStatsRef.update({ 
            points: (stats.points || 0) + BONUS_AMOUNT,
            lastDailyBonus: now
        });

        await dbAdmin.ref(`artifacts/${appId}/users/${uid}/transactions`).push().set({
            type: 'bonus', amount: BONUS_AMOUNT, desc: 'Daily Bonus', timestamp: now
        });

        return NextResponse.json({ success: true, message: `আপনি ${BONUS_AMOUNT} পয়েন্ট পেয়েছেন!` });
    } catch (error) {
        return NextResponse.json({ error: 'Server Error' }, { status: 500 });
    }
}