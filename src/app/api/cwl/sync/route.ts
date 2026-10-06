import { NextResponse } from "next/server";
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

export async function POST(req: Request) {
  try {
    const { clanTag } = await req.json();
    if (!clanTag) return NextResponse.json({ error: "clanTag required" }, { status: 400 });

    // FIX: Normalisasi clanTag agar selalu memiliki '#'
    const normalizedClanTag = clanTag.startsWith("#") ? clanTag : `#${clanTag}`;

    const cocToken = process.env.COC_API_KEY;
    if (!cocToken) return NextResponse.json({ error: "COC_API_KEY not found" }, { status: 500 });

    const tagForUrl = encodeURIComponent(normalizedClanTag);
    
    // 1. Fetch League Group (Gunakan Proxy RoyaleAPI)
    const groupRes = await fetch(`https://cocproxy.royaleapi.dev/v1/clans/${tagForUrl}/currentwar/leaguegroup`, {
      headers: { 
        Authorization: `Bearer ${cocToken}`,
        Accept: 'application/json' 
      },
      cache: "no-store"
    });
    
    if (!groupRes.ok) {
       if (groupRes.status === 404) return NextResponse.json({ message: "No active CWL found" });
       throw new Error(`CoC API Error: ${groupRes.statusText}`);
    }
    
    const groupData = await groupRes.json();
    if (groupData.state === "notInWar") return NextResponse.json({ message: "Not in CWL" });

    // 2. Fetch all war details (Gunakan Proxy RoyaleAPI)
    const season = groupData.season;
    const rounds = [];
    
    for (const round of groupData.rounds || []) {
      for (const warTag of round.warTags || []) {
        if (warTag === "#0") continue;
        const warRes = await fetch(`https://cocproxy.royaleapi.dev/v1/clanwarleagues/wars/${encodeURIComponent(warTag)}`, {
           headers: { 
             Authorization: `Bearer ${cocToken}`,
             Accept: 'application/json'
           },
           cache: "no-store"
        });
        if (warRes.ok) {
           const warData = await warRes.json();
           if (warData.clan.tag === normalizedClanTag || warData.opponent.tag === normalizedClanTag) {
              rounds.push(warData);
           }
        }
      }
    }

    // 3. FIX: Fetch Live Current War (Bypass cache lambat dari endpoint leaguegroup wars)
    // clashofclans.js dan RoyaleAPI merekomendasikan fetch /currentwar untuk data real-time CWL hari ini.
    try {
       const liveWarRes = await fetch(`https://cocproxy.royaleapi.dev/v1/clans/${tagForUrl}/currentwar`, {
          headers: { 
            Authorization: `Bearer ${cocToken}`,
            Accept: 'application/json'
          },
          cache: "no-store"
       });
       
       if (liveWarRes.ok) {
          const liveWarData = await liveWarRes.json();
          // Pastikan ini adalah war yang sah dan bukan notInWar
          if (liveWarData.state !== "notInWar" && (liveWarData.clan?.tag === normalizedClanTag || liveWarData.opponent?.tag === normalizedClanTag)) {
             // Cari round di array 'rounds' yang lawannya sama dengan liveWarData
             // Tujuannya menimpa data round lama dengan data real-time ini
             const opponentTag = liveWarData.clan.tag === normalizedClanTag ? liveWarData.opponent.tag : liveWarData.clan.tag;
             
             const staleRoundIndex = rounds.findIndex(r => 
                (r.clan.tag === normalizedClanTag && r.opponent.tag === opponentTag) || 
                (r.opponent.tag === normalizedClanTag && r.clan.tag === opponentTag)
             );

             if (staleRoundIndex !== -1) {
                // Timpa data basi dengan data live
                rounds[staleRoundIndex] = liveWarData;
                console.log(`[CWL Sync] Overwritten stale round data with real-time /currentwar data for opponent ${opponentTag}`);
             } else {
                // Jika entah kenapa belum ada (misal warTag masih #0 di leaguegroup), push saja!
                rounds.push(liveWarData);
                console.log(`[CWL Sync] Inserted new live war data from /currentwar for opponent ${opponentTag}`);
             }
          }
       }
    } catch (e) {
       console.error("Gagal melakukan fetch /currentwar real-time fallback", e);
    }

    // 4. Save to Firestore
    const clanId = clanTag.replace("#", "");
    const archiveRef = db.collection("managedClans").doc(clanId).collection("cwlArchives").doc(season);
    
    await archiveRef.set({
       season,
       clanTag,
       state: groupData.state,
       rounds,
       lastSyncedAt: new Date().toISOString()
    }, { merge: true });

    return NextResponse.json({ success: true, message: `Synced ${rounds.length} rounds for season ${season}` });

  } catch (error: any) {
    console.error("CWL Sync Error:", error);
    return NextResponse.json({ error: error.message || "Failed to sync CWL" }, { status: 500 });
  }
}
