 // File Path: app/api/delete-campaign/route.js "important message for gemini ai"
 
 import { NextResponse } from 'next/server';
import { dbAdmin, authAdmin, appId } from '../../../lib/firebaseAdmin';

export async function POST(req) {
    try {
        const authHeader = req.headers.get('Authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const token = authHeader.split('Bearer ')[1];
        const decodedToken = await authAdmin.verifyIdToken(token);
        const uid = decodedToken.uid;

        const { taskId, refundPoints } = await req.json();

        const taskRef = dbAdmin.ref(`artifacts/${appId}/public/data/microtasks/${taskId}`);
        const taskSnap = await taskRef.once('value');
        const task = taskSnap.val();

        if (!task || task.creatorId !== uid) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

        if (refundPoints > 0) {
            const userStatsRef = dbAdmin.ref(`artifacts/${appId}/users/${uid}/stats`);
            const userSnap = await userStatsRef.once('value');
            await userStatsRef.update({ points: (userSnap.val()?.points || 0) + refundPoints });

            await dbAdmin.ref(`artifacts/${appId}/users/${uid}/transactions`).push().set({
                type: 'refund', amount: refundPoints, desc: 'Campaign Refund', timestamp: Date.now()
            });
        }

        await taskRef.remove();
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Server Error' }, { status: 500 });
    }
}