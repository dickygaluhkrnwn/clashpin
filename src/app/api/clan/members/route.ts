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
  const rawClanTag = searchParams.get('clanTag'); 
  const clanId = searchParams.get('clanId');
  const seasonParam = searchParams.get('season') || 'current';

  if (!rawClanTag || !clanId) {
    return NextResponse.json({ error: 'Clan Tag dan Clan ID wajib diisi' }, { status: 400 });
  }

  // FIX: Pastikan clanTag selalu memiliki prefix '#' agar cocok dengan data CoC API di Firestore
  const normalizedClanTag = rawClanTag.startsWith('#') ? rawClanTag : `#${rawClanTag}`;

  try {
    const memberStats: Record<string, { tag: string; name: string; townhallLevel: number; stars: number; destruction: number; missedAttacks: number; roundsPlayed: number }> = {};
    const roundsHistory: any[] = [];
    
    const archiveRef = db.collection('managedClans').doc(clanId).collection('cwlArchives');
    let archiveData: any;
    
    if (seasonParam === 'current') {
      const allDocsSnap = await archiveRef.orderBy('season', 'desc').get();
      // FIX: Cari dokumen pertama yang ID-nya mengandung '_' (yaitu dokumen buatan clashub-nextjs / clashpin baru)
      const validDoc = allDocsSnap.docs.find(d => d.id.includes('_'));
      if (!validDoc) {
        return NextResponse.json({ error: `Tidak ada data arsip valid.` }, { status: 404 });
      }
      archiveData = validDoc.data();
    } else {
      const docId = `${seasonParam}_${clanId}`;
      const docSnap = await archiveRef.doc(docId).get();
      if (!docSnap.exists) {
        return NextResponse.json({ error: `Tidak ada data arsip untuk season ${seasonParam}.` }, { status: 404 });
      }
      archiveData = docSnap.data();
    }
    const actualSeason = archiveData.season;

    if (archiveData.rounds) {
      archiveData.rounds.forEach((round: any) => {
        if (!round || (!round.clan && !round.opponent)) return;
        
        // Find our clan in this round
        const isClan1 = round.clan?.tag === normalizedClanTag;
        const isClan2 = round.opponent?.tag === normalizedClanTag;
        
        const myClanData = isClan1 ? round.clan : isClan2 ? round.opponent : null;
        const enemyClanData = isClan1 ? round.opponent : isClan2 ? round.clan : null;
        
        if (!myClanData) return;
        
        // Simpan histori match per hari (round)
        if (enemyClanData) {
           let result = 'TIE';
           if (myClanData.stars > enemyClanData.stars) result = 'WIN';
           else if (myClanData.stars < enemyClanData.stars) result = 'LOSS';
           else if (myClanData.destructionPercentage > enemyClanData.destructionPercentage) result = 'WIN';
           else if (myClanData.destructionPercentage < enemyClanData.destructionPercentage) result = 'LOSS';

           roundsHistory.push({
             myClan: { 
               name: myClanData.name, 
               stars: myClanData.stars, 
               destruction: myClanData.destructionPercentage, 
               attacks: myClanData.attacks,
               members: myClanData.members || []
             },
             opponent: { 
               name: enemyClanData.name, 
               stars: enemyClanData.stars, 
               destruction: enemyClanData.destructionPercentage, 
               attacks: enemyClanData.attacks,
               members: enemyClanData.members || []
             },
             result
           });
        }
        
        myClanData.members?.forEach((m: any) => {
          if (!memberStats[m.tag]) {
            memberStats[m.tag] = { 
              tag: m.tag, 
              name: m.name, 
              townhallLevel: m.townhallLevel || 0, 
              stars: 0, 
              destruction: 0,
              missedAttacks: 0,
              roundsPlayed: 0
            };
          }
          
          // Update TH level if it increased
          if (m.townhallLevel > memberStats[m.tag].townhallLevel) {
            memberStats[m.tag].townhallLevel = m.townhallLevel;
          }

          // If member is on the map (has mapPosition)
          if (m.mapPosition) {
            memberStats[m.tag].roundsPlayed += 1;
            
            const attacks = m.attacks || [];
            if (attacks.length === 0) {
              memberStats[m.tag].missedAttacks += 1;
            } else {
              attacks.forEach((atk: any) => {
                memberStats[m.tag].stars += atk.stars;
                memberStats[m.tag].destruction += atk.destructionPercentage;
              });
            }
          }
        });
      });
    }

    const membersArray = Object.values(memberStats);
    
    // Sort by stars (descending), then by destruction (descending)
    membersArray.sort((a, b) => {
      if (b.stars !== a.stars) return b.stars - a.stars;
      return b.destruction - a.destruction;
    });

    return NextResponse.json({ 
      season: actualSeason, 
      members: membersArray,
      rounds: roundsHistory
    }, { status: 200 });

  } catch (error: any) {
    return NextResponse.json({ error: 'Terjadi kesalahan sistem: ' + error.message }, { status: 500 });
  }
}
