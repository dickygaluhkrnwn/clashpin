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
  const clanTag = searchParams.get('clanTag');

  if (!clanTag) {
    return NextResponse.json({ error: 'Clan Tag wajib disertakan.' }, { status: 400 });
  }

  try {
    // Ambil data undian khusus klan tersebut
    const snapshot = await db.collection('clashpin_history')
      .where('clanTag', '==', clanTag)
      .get();

    if (snapshot.empty) {
      return NextResponse.json({ history: [] }, { status: 200 });
    }

    const historyData = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        tournamentName: data.tournamentName,
        winner: data.winner,
        participants: data.participants || [],
        totalParticipants: data.totalParticipants || 0,
        createdBy: data.createdBy,
        // Konversi Firebase Timestamp ke format ISO string agar aman dikirim ke frontend
        createdAt: data.createdAt ? data.createdAt.toDate().toISOString() : new Date().toISOString()
      };
    });

    // Urutkan berdasarkan waktu terbaru di memori (mengurangi beban pembuatan indeks manual di Firebase)
    const sortedHistory = historyData.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return NextResponse.json({ history: sortedHistory }, { status: 200 });

  } catch (error: any) {
    console.error("Gagal mengambil riwayat undian:", error);
    return NextResponse.json({ error: 'Gagal memuat data dari server: ' + error.message }, { status: 500 });
  }
}