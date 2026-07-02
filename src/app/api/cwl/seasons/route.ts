import { NextResponse } from 'next/server';
import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

if (!getApps().length) {
  try {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY || '{}');
    initializeApp({ credential: cert(serviceAccount) });
  } catch (error) {
    console.error('Firebase Admin Init Error:', error);
  }
}

const db = getFirestore();

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const clanId = searchParams.get('clanId'); // Menerima ID acak Firestore dari frontend

  if (!clanId) {
    return NextResponse.json({ error: 'Clan ID wajib diisi' }, { status: 400 });
  }

  try {
    // Koreksi: Gunakan managedClans dan cwlArchives
    const archiveRef = db.collection('managedClans').doc(clanId).collection('cwlArchives');
    const snap = await archiveRef.orderBy('season', 'desc').get();

    if (snap.empty) {
      return NextResponse.json({ seasons: [] }, { status: 200 });
    }

    const seasons = snap.docs.map(doc => doc.data().season).filter(Boolean);
    return NextResponse.json({ seasons }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: 'Gagal mengambil daftar season: ' + error.message }, { status: 500 });
  }
}