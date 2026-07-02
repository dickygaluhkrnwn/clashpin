import { NextResponse } from 'next/server';
import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

// Inisialisasi Firebase Admin
if (!getApps().length) {
  try {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY || '{}');
    initializeApp({ credential: cert(serviceAccount) });
  } catch (error) {
    console.error('Firebase Admin Init Error:', error);
  }
}

const db = getFirestore();

export async function POST(request: Request) {
  try {
    // Tangkap data dari frontend (Spinner)
    const body = await request.json();
    const { tournamentName, participants, winner, clanTag, createdBy } = body;

    // Validasi sederhana
    if (!winner || !participants || participants.length === 0) {
      return NextResponse.json({ error: 'Data pemenang dan peserta tidak valid.' }, { status: 400 });
    }

    // ---------------------------------------------------------
    // ARSITEKTUR MIKRO-APP: 
    // Simpan di koleksi mandiri khusus Clashpin: 'clashpin_history'
    // ---------------------------------------------------------
    const historyRef = db.collection('clashpin_history');
    
    const docRef = await historyRef.add({
      tournamentName: tournamentName || 'Undian Reguler',
      winner: winner,
      participants: participants,
      totalParticipants: participants.length,
      clanTag: clanTag || 'GUEST',
      createdBy: createdBy || 'Guest',
      createdAt: FieldValue.serverTimestamp(), // Catat waktu persis dari server
    });

    console.log(`[Clashpin] Hasil undian berhasil disimpan. ID: ${docRef.id}`);

    return NextResponse.json({ success: true, id: docRef.id }, { status: 200 });

  } catch (error: any) {
    console.error("[Clashpin] Gagal menyimpan riwayat:", error);
    return NextResponse.json({ error: 'Terjadi kesalahan sistem saat menyimpan data.' }, { status: 500 });
  }
}