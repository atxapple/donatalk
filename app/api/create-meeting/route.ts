// app/api/create-meeting/route.ts

import { NextResponse } from 'next/server';
import { firestore } from '@/firebase/clientApp';
import { collection, addDoc, Timestamp } from 'firebase/firestore';

export async function POST(req: Request) {
    console.log('[Create Meeting] :', req);
    try {
        const {meetingsource, listenerId, listenerName, listenerEmail,pitcherId, pitcherName, pitcherEmail, availability} = await req.json();

        console.log('[Create Meeting] :', {meetingsource, listenerId, listenerName, listenerEmail,pitcherId, pitcherName, pitcherEmail, availability});

        if (!listenerId || !listenerName || !listenerEmail || !pitcherId || !pitcherName || !pitcherEmail || !availability) {
            console.error('[Validation Error] Missing listenerId, listenerName, listenerEmail, pitcherId, pitcherName, pitcherEmail, or availability');
            return NextResponse.json({ success: false, message: 'Missing listenerId, listenerName, listenerEmail, pitcherId, pitcherName, pitcherEmail, or availability' }, { status: 400 });
        }

        const newMeeting = {
            meetingsource: 'listenerPage',
            listenerId,
            listenerName: '',
            listenerEmail: '',
            pitcherId: '',
            pitcherName,
            pitcherEmail,
            availability,
            status: 'pending', // meeting status: pending / confirmed / completed
            createdAt: Timestamp.now(),
        };

        const docRef = await addDoc(collection(firestore, 'meetings'), newMeeting);

        return NextResponse.json({ success: true, meetingId: docRef.id }, { status: 200 });
    } catch (error: any) {
        console.error('[Create Meeting Error]', error.message || error);
        return NextResponse.json({ error: 'Failed to create meeting.' }, { status: 500 });
    }
}
