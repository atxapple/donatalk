import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import { verifyAdmin } from '@/lib/adminAuth';

const VALID_TABS = ['dashboard', 'pitchers', 'listeners', 'meetings', 'fund_history'] as const;
type Tab = (typeof VALID_TABS)[number];

async function getDashboardData() {
  const [pitchersSnap, listenersSnap, meetingsSnap, fundHistorySnap] = await Promise.all([
    adminDb.collection('pitchers').get(),
    adminDb.collection('listeners').get(),
    adminDb.collection('meetings').get(),
    adminDb.collection('fund_history').get(),
  ]);

  const pitchers = pitchersSnap.docs.map((d) => d.data());
  const listeners = listenersSnap.docs.map((d) => d.data());
  const meetings = meetingsSnap.docs.map((d) => d.data());
  const fundHistory = fundHistorySnap.docs.map((d) => d.data());

  const pitchersSetUp = pitchers.filter((p) => p.isSetUp !== false).length;
  const listenersSetUp = listeners.filter((l) => l.isSetUp !== false).length;
  const activePitchers = pitchers.filter((p) => {
    const required = Math.ceil((p.donation || 0) * 1.125 * 100) / 100;
    return (p.credit_balance || 0) >= required;
  }).length;

  const meetingsByStatus: Record<string, number> = {};
  for (const m of meetings) {
    const status = m.status || 'unknown';
    meetingsByStatus[status] = (meetingsByStatus[status] || 0) + 1;
  }

  const totalFundsRaised = fundHistory.reduce((sum, f) => sum + (f.amount || 0), 0);

  return {
    totalPitchers: pitchers.length,
    pitchersSetUp,
    totalListeners: listeners.length,
    listenersSetUp,
    activePitchers,
    totalMeetings: meetings.length,
    meetingsByStatus,
    totalFundsRaised: Math.round(totalFundsRaised * 100) / 100,
    totalTransactions: fundHistory.length,
  };
}

async function getCollectionData(collectionName: string) {
  const snap = await adminDb.collection(collectionName).orderBy('createdAt', 'desc').get();
  return snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}

async function getFundHistory() {
  const snap = await adminDb.collection('fund_history').orderBy('timestamp', 'desc').get();
  return snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}

export async function GET(req: Request) {
  const authResult = await verifyAdmin(req);
  if (authResult instanceof NextResponse) return authResult;

  const url = new URL(req.url);
  const tab = (url.searchParams.get('tab') || 'dashboard') as Tab;
  if (!VALID_TABS.includes(tab)) {
    return NextResponse.json({ error: `Invalid tab: ${tab}` }, { status: 400 });
  }

  try {
    let data;
    switch (tab) {
      case 'dashboard':
        data = await getDashboardData();
        break;
      case 'pitchers':
        data = await getCollectionData('pitchers');
        break;
      case 'listeners':
        data = await getCollectionData('listeners');
        break;
      case 'meetings':
        data = await getCollectionData('meetings');
        break;
      case 'fund_history':
        data = await getFundHistory();
        break;
    }

    return NextResponse.json({ data });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Admin API Error]', message);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
