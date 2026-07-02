import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { playerTag, apiToken } = await request.json();

    if (!playerTag || !apiToken) {
      return NextResponse.json({ error: 'Player Tag dan API Token wajib diisi.' }, { status: 400 });
    }

    const formattedTag = encodeURIComponent(playerTag.toUpperCase());
    const COC_API_KEY = process.env.COC_API_KEY;

    // 1. Verifikasi Token ke Supercell API
    const verifyResponse = await fetch(`https://api.clashofclans.com/v1/players/${formattedTag}/verifytoken`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${COC_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token: apiToken }),
    });

    const verifyData = await verifyResponse.json();

    if (verifyData.status !== 'ok') {
      return NextResponse.json({ error: 'API Token tidak valid. Pastikan token baru saja di-generate di dalam game.' }, { status: 401 });
    }

    // 2. Jika valid, ambil data Player untuk melihat Role & Klannya
    const playerResponse = await fetch(`https://api.clashofclans.com/v1/players/${formattedTag}`, {
      headers: { 'Authorization': `Bearer ${COC_API_KEY}` }
    });
    
    const playerData = await playerResponse.json();
    
    // Tentukan Role di App kita (leader/coLeader di COC = 'leader' di App kita)
    const cocRole = playerData.role; // "member", "admin" (elder), "coLeader", "leader"
    const appRole = (cocRole === 'leader' || cocRole === 'coLeader') ? 'leader' : 'member';
    const clanTag = playerData.clan ? playerData.clan.tag : null;
    const clanName = playerData.clan ? playerData.clan.name : null;

    return NextResponse.json({ 
      success: true, 
      role: appRole, 
      clanTag: clanTag,
      clanName: clanName,
      playerName: playerData.name
    }, { status: 200 });

  } catch (error) {
    console.error("Error verifying COC Token:", error);
    return NextResponse.json({ error: 'Terjadi kesalahan pada server.' }, { status: 500 });
  }
}