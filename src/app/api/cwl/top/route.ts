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
const COC_API_URL = 'https://cocproxy.royaleapi.dev/v1';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const rawClanTag = searchParams.get('clanTag'); 
  const clanId = searchParams.get('clanId'); // Menerima ID acak Firestore dari frontend
  const limitParam = searchParams.get('limit') || '5';
  const seasonParam = searchParams.get('season') || 'current';
  const limit = parseInt(limitParam, 10);

  if (!rawClanTag || !clanId) {
    return NextResponse.json({ error: 'Clan Tag dan Clan ID wajib diisi' }, { status: 400 });
  }

  const formattedTag = encodeURIComponent(rawClanTag);

  try {
    const headers = { Authorization: `Bearer ${process.env.COC_API_KEY}`, Accept: 'application/json' };
    const memberStats: Record<string, { name: string; stars: number; destruction: number }> = {};
    let dataSource = '';

    // LOGIKA 1: Ambil data Live (Supercell API proxy)
    if (seasonParam === 'current') {
      const warRes = await fetch(`${COC_API_URL}/clans/${formattedTag}/currentwar`, { headers, cache: 'no-store' });
      if (warRes.ok) {
        const warJson = await warRes.json();
        if (['inWar', 'preparation', 'warEnded'].includes(warJson.state)) {
          dataSource = 'Perang Reguler Aktif';
          warJson.clan.members?.forEach((m: any) => {
            memberStats[m.tag] = { name: m.name, stars: 0, destruction: 0 };
            m.attacks?.forEach((atk: any) => {
              memberStats[m.tag].stars += atk.stars;
              memberStats[m.tag].destruction += atk.destructionPercentage;
            });
          });
        } else {
          const cwlRes = await fetch(`${COC_API_URL}/clans/${formattedTag}/currentwar/leaguegroup`, { headers, cache: 'no-store' });
          if (cwlRes.ok) {
            const cwlGroup = await cwlRes.json();
            const allWarTags = cwlGroup.rounds?.flatMap((r: any) => r.warTags).filter((t: string) => t !== '#0') || [];
            
            for (const tag of allWarTags) {
              const detailRes = await fetch(`${COC_API_URL}/clanwarleagues/wars/${encodeURIComponent(tag)}`, { headers, cache: 'no-store' });
              if (detailRes.ok) {
                const detail = await detailRes.json();
                if (detail.clan?.tag === rawClanTag || detail.opponent?.tag === rawClanTag) {
                   const myClanData = detail.clan.tag === rawClanTag ? detail.clan : detail.opponent;
                   myClanData.members?.forEach((m: any) => {
                      if (!memberStats[m.tag]) memberStats[m.tag] = { name: m.name, stars: 0, destruction: 0 };
                      m.attacks?.forEach((atk: any) => {
                        memberStats[m.tag].stars += atk.stars;
                        memberStats[m.tag].destruction += atk.destructionPercentage;
                      });
                   });
                   dataSource = 'CWL Aktif';
                }
              }
            }
          }
        }
      }
    } 
    
    // LOGIKA 2: Ambil data dari Firestore cwlArchives asli Clashub
    if (Object.keys(memberStats).length === 0 || seasonParam !== 'current') {
      // Koreksi: Menggunakan managedClans dan cwlArchives
      const archiveRef = db.collection('managedClans').doc(clanId).collection('cwlArchives');
      let archiveSnap;

      if (seasonParam === 'current') {
        archiveSnap = await archiveRef.orderBy('season', 'desc').limit(1).get();
      } else {
        archiveSnap = await archiveRef.where('season', '==', seasonParam).limit(1).get();
      }

      if (archiveSnap.empty) {
        return NextResponse.json({ error: `Tidak ada data arsip untuk season ${seasonParam === 'current' ? 'terbaru' : seasonParam}.` }, { status: 404 });
      }

      const archiveData = archiveSnap.docs[0].data();
      dataSource = `Arsip Clashub CWL (${archiveData.season})`;

      if (archiveData.rounds) {
        archiveData.rounds.forEach((round: any) => {
          if (!round || (!round.clan && !round.opponent)) return;
          const myClanData = round.clan?.tag === rawClanTag ? round.clan : round.opponent;
          
          myClanData?.members?.forEach((m: any) => {
             if (!memberStats[m.tag]) memberStats[m.tag] = { name: m.name, stars: 0, destruction: 0 };
             m.attacks?.forEach((atk: any) => {
                memberStats[m.tag].stars += atk.stars;
                memberStats[m.tag].destruction += atk.destructionPercentage;
             });
          });
        });
      }
    }

    const membersArray = Object.values(memberStats);
    if (membersArray.length === 0) return NextResponse.json({ error: 'Data member tidak ditemukan.' }, { status: 404 });

    const sortedMembers = membersArray.sort((a, b) => {
      if (b.stars !== a.stars) return b.stars - a.stars;
      return b.destruction - a.destruction;
    });

    const topNames = sortedMembers.slice(0, limit).map(m => m.name);
    return NextResponse.json({ top: topNames, source: dataSource }, { status: 200 });

  } catch (error: any) {
    return NextResponse.json({ error: 'Terjadi kesalahan sistem: ' + error.message }, { status: 500 });
  }
}