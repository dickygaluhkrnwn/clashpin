"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Shield, CheckCircle2, AlertTriangle, RefreshCw, LogOut, ArrowLeft, Info, Loader2 } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function ProfilePage() {
  // TAMBAHKAN isInitialized dan initAuth DI SINI
  const { user, role, clanTag, playerTag, isInitialized, logoutUser, updateUserRole, initAuth } = useAuthStore();
  const router = useRouter();

  const [tagInput, setTagInput] = useState(playerTag || "");
  const [tokenInput, setTokenInput] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // PANGGIL initAuth SAAT HALAMAN DIMUAT
  useEffect(() => {
    initAuth();
  }, [initAuth]);

  // Update input tag jika data dari Firebase sudah masuk
  useEffect(() => {
    if (playerTag && !tagInput) setTagInput(playerTag);
  }, [playerTag]);

  const handleTagChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.toUpperCase().replace(/[^#0289PYLQGRJCUV]/g, '');
    if (val.length > 0 && !val.startsWith('#')) val = '#' + val;
    setTagInput(val);
  };

  const handleVerify = async () => {
    setErrorMsg("");
    setSuccessMsg("");
    
    if (!tagInput || !tokenInput) return setErrorMsg("Player Tag dan API Token wajib diisi.");

    setIsVerifying(true);
    try {
      const res = await fetch('/api/coc/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerTag: tagInput, apiToken: tokenInput })
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error);

      const newClanId = data.clanTag ? data.clanTag.toUpperCase().replace('#', '') : null;

      if (user) {
        const userRef = doc(db, 'users', user.uid);
        await updateDoc(userRef, {
          playerTag: tagInput,
          clanTag: data.clanTag,
          clanId: newClanId, 
          clanName: data.clanName,
          role: data.role,
          inGameName: data.playerName,
          updatedAt: new Date().toISOString()
        });

        updateUserRole(data.role, data.clanTag, newClanId, tagInput);
        setSuccessMsg(`Berhasil! Terhubung sebagai ${data.playerName} (${data.role.toUpperCase()}).`);
        setTokenInput(""); 
      }
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setIsVerifying(false);
    }
  };

  // TAMPILAN LOADING SEMENTARA CEK SESI
  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
        <Loader2 className="w-10 h-10 text-blue-500 animate-spin mb-4" />
        <p className="text-gray-400 font-mono tracking-widest uppercase text-sm">Memuat Profil...</p>
      </div>
    );
  }

  // TAMPILAN JIKA BELUM LOGIN
  if (!user) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
        <Shield className="w-16 h-16 text-gray-500 mb-4 opacity-50" />
        <h2 className="text-xl font-bold text-white mb-2">Akses Ditolak</h2>
        <p className="text-gray-400 mb-6 text-center">Anda harus login terlebih dahulu untuk mengakses Profil.</p>
        <Link href="/desktop">
          <button className="px-6 py-3 bg-elixir hover:bg-elixir-dark text-white rounded-xl font-bold">Kembali ke Beranda</button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-coc-blue/10 blur-[120px] rounded-full pointer-events-none z-0" />

      <div className="max-w-3xl mx-auto relative z-10">
        <header className="flex items-center justify-between bg-white/5 border border-white/10 backdrop-blur-md rounded-2xl px-6 py-4 mb-8">
          <div className="flex items-center gap-4">
            <Link href="/desktop/spinner" className="p-2 bg-white/5 hover:bg-white/10 rounded-xl transition-colors text-gray-400">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-xl font-bold text-white uppercase tracking-wider">Profil Akun</h1>
              <p className="text-xs text-gray-400">Pengaturan & Verifikasi Clash of Clans</p>
            </div>
          </div>
          <button onClick={() => { logoutUser(); router.push('/desktop'); }} className="p-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors border border-red-500/20">
            <LogOut className="w-5 h-5" />
          </button>
        </header>

        <div className="bg-black/40 border border-white/5 rounded-3xl p-6 mb-8 flex items-center gap-6">
          <img src={user.photoURL || ''} alt="Profile" className="w-20 h-20 rounded-2xl border-2 border-white/10" />
          <div>
            <h2 className="text-2xl font-bold text-white">{user.displayName}</h2>
            <p className="text-gray-400 text-sm mb-2">{user.email}</p>
            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${role === 'leader' ? 'bg-gold/20 text-gold border-gold/30' : 'bg-blue-500/20 text-blue-400 border-blue-500/30'}`}>
              Status: {role}
            </span>
          </div>
        </div>

        <section className="bg-gradient-to-br from-[#15171e] to-[#0a0a0b] border border-white/10 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-blue-500/10 rounded-lg border border-blue-500/20">
              <Shield className="w-6 h-6 text-blue-400" />
            </div>
            <h2 className="text-xl font-bold text-white uppercase tracking-wider">Tautkan Akun COC</h2>
          </div>

          {role !== 'guest' && playerTag ? (
            <div className="p-6 rounded-2xl bg-green-500/5 border border-green-500/20 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <CheckCircle2 className="w-12 h-12 text-green-400" />
                <div>
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mb-1">Akun Terhubung</p>
                  <p className="text-2xl font-bold text-white font-mono">{playerTag}</p>
                  <p className="text-green-400 text-sm">{clanTag ? `Clan: ${clanTag}` : 'Belum bergabung di Clan'}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-start gap-4 p-4 bg-blue-500/5 border border-blue-500/10 rounded-xl">
                <Info className="w-6 h-6 text-blue-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-gray-300 leading-relaxed">
                  Buka game Clash of Clans ➔ Settings ➔ More Settings ➔ Klik "API Token" (Show) lalu salin ke bawah.
                </p>
              </div>

              {errorMsg && (
                <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
                  <AlertTriangle className="w-5 h-5 flex-shrink-0" /> {errorMsg}
                </div>
              )}
              {successMsg && (
                <div className="flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/20 rounded-xl text-green-400 text-sm">
                  <CheckCircle2 className="w-5 h-5 flex-shrink-0" /> {successMsg}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Player Tag</label>
                  <input type="text" value={tagInput} onChange={handleTagChange} placeholder="#P20C8Y9L" className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 font-mono" />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">API Token</label>
                  <input type="text" value={tokenInput} onChange={(e) => setTokenInput(e.target.value)} placeholder="Token dari game..." className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50" />
                </div>
              </div>

              <button onClick={handleVerify} disabled={isVerifying || !tagInput || !tokenInput} className="w-full py-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold tracking-wide transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                {isVerifying ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Shield className="w-5 h-5" />}
                {isVerifying ? 'MEMVERIFIKASI...' : 'VERIFIKASI AKUN'}
              </button>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}