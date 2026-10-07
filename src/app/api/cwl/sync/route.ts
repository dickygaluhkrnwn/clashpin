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
    const { clanTag, clanId } = await req.json();
    if (!clanTag || !clanId) return NextResponse.json({ error: "clanTag and clanId required" }, { status: 400 });

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
    
    // Kumpulkan semua promise fetch
    const fetchPromises = [];
    for (const round of groupData.rounds || []) {
      for (const warTag of round.warTags || []) {
        if (warTag === "#0") continue;
        fetchPromises.push(
          fetch(`https://cocproxy.royaleapi.dev/v1/clanwarleagues/wars/${encodeURIComponent(warTag)}`, {
            headers: { 
              Authorization: `Bearer ${cocToken}`,
              Accept: 'application/json'
            },
            cache: "no-store"
          }).then(async (res) => {
             if (!res.ok) return null;
             const data = await res.json();
             if (data.clan?.tag === normalizedClanTag || data.opponent?.tag === normalizedClanTag) {
                return data;
             }
             return null;
          }).catch(() => null)
        );
      }
    }

    // Tunggu semua request paralel selesai
    const results = await Promise.all(fetchPromises);
    const rounds = results.filter((data) => data !== null);


    // 4. Save to Firestore
    const cleanTag = clanTag.replace("#", "");
    const docId = `${season}_${cleanTag}`; // FIX: Sesuaikan format ID dengan clashub-nextjs
    const archiveRef = db.collection("managedClans").doc(clanId).collection("cwlArchives").doc(docId);
    
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
