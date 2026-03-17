 // File Path: app/api/review-proof/route.js "important message for gemini ai"

import { NextResponse } from 'next/server';
import { dbAdmin, authAdmin, appId } from '../../../lib/firebaseAdmin';

export async function POST(req) {
    try {
        const authHeader = req.headers.get('Authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const token = authHeader.split('Bearer ')[1];
        const decodedToken = await authAdmin.verifyIdToken(token);
        const uid = decodedToken.uid;

        const { taskId, subId, workerId, rewardPoints, newStatus } = await req.json();

        const taskRef = dbAdmin.ref(`artifacts/${appId}/public/data/microtasks/${taskId}`);
        const taskSnap = await taskRef.once('value');
        const task = taskSnap.val();

        if (!task || task.creatorId !== uid) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

        await dbAdmin.ref(`artifacts/${appId}/public/data/submissions/${taskId}/${subId}`).update({
            status: newStatus, reviewedAt: Date.now()
        });

        if (newStatus === 'approved') {
            const workerStatsRef = dbAdmin.ref(`artifacts/${appId}/users/${workerId}/stats`);
            await workerStatsRef.transaction((currentStats) => {
                if (currentStats) {
                    currentStats.points = (currentStats.points || 0) + rewardPoints;
                    currentStats.tasksCompleted = (currentStats.tasksCompleted || 0) + 1;
                }
                return currentStats;
            });

            await dbAdmin.ref(`artifacts/${appId}/users/${workerId}/transactions`).push().set({
                type: 'mission', amount: rewardPoints, desc: 'Task Approved', timestamp: Date.now()
            });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Server Error' }, { status: 500 });
    }
}