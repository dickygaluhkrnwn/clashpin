"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, CheckCircle2, AlertTriangle, RefreshCw, LogOut, ArrowLeft, Info, Loader2, UserCircle, Key, Smartphone, Trophy, Sword } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function ProfilePage() {
  const { user, role, clanTag, playerTag, isInitialized, logoutUser, updateUserRole, initAuth } = useAuthStore();
  const router = useRouter();

  const [tagInput, setTagInput] = useState(playerTag || "");
  const [tokenInput, setTokenInput] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    initAuth();
  }, [initAuth]);

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
        setSuccessMsg(`Otorisasi Berhasil! Terhubung sebagai ${data.playerName} (${data.role.toUpperCase()}).`);
        setTokenInput(""); 
      }
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setIsVerifying(false);
    }
  };

  // LOADING STATE
  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center p-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-[0.03] bg-repeat pointer-events-none" />
        <Loader2 className="w-12 h-12 text-elixir animate-spin mb-6 drop-shadow-[0_0_15px_rgba(217,70,239,0.5)]" />
        <p className="text-gray-400 font-mono tracking-widest uppercase text-sm font-bold animate-pulse">Menyiapkan Profil...</p>
      </div>
    );
  }

  // GUEST STATE
  if (!user) {
    return (
      <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center p-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-red-900/10 to-transparent pointer-events-none" />
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-black/40 border border-white/10 p-10 rounded-3xl backdrop-blur-xl text-center max-w-md shadow-2xl">
          <Shield className="w-20 h-20 text-red-500 mb-6 mx-auto opacity-80 drop-shadow-[0_0_15px_rgba(239,68,68,0.4)]" />
          <h2 className="text-2xl font-black text-white mb-3 uppercase tracking-wider">Akses Terbatas</h2>
          <p className="text-gray-400 mb-8 font-medium leading-relaxed">Sistem mendeteksi Anda belum melakukan otentikasi. Silakan masuk terlebih dahulu untuk mengakses Pangkalan Profil.</p>
          <Link href="/desktop/login" className="block w-full px-6 py-4 bg-white text-black hover:bg-gray-200 transition-colors rounded-xl font-black uppercase tracking-widest">
            Menuju Portal Login
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] p-6 md:p-10 relative overflow-hidden font-sans">
      
      {/* AMBIENT GLOW */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-600/10 blur-[150px] rounded-full pointer-events-none z-0 mix-blend-screen" />
      <div className="absolute bottom-[-100px] left-[-100px] w-[500px] h-[500px] bg-purple-600/10 blur-[120px] rounded-full pointer-events-none z-0 mix-blend-screen" />
      <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-[0.03] bg-repeat pointer-events-none z-0" />

      <div className="max-w-6xl mx-auto relative z-10">
        
        {/* HEADER */}
        <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-[#0a0a0b]/80 border border-white/10 backdrop-blur-xl rounded-3xl px-8 py-5 mb-8 shadow-2xl gap-4">
          <div className="flex items-center gap-5">
            <Link href="/desktop/spinner" className="p-2.5 bg-white/5 hover:bg-white/10 rounded-xl transition-all hover:scale-105 text-gray-400 hover:text-white border border-white/5">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="h-10 w-[1px] bg-white/10 hidden sm:block"></div>
            <div>
              <h1 className="text-2xl font-black text-white uppercase tracking-widest bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">Pangkalan Profil</h1>
              <p className="text-xs text-gray-500 font-bold tracking-widest uppercase mt-1">Otorisasi Clash of Clans API</p>
            </div>
          </div>
          <button 
            onClick={() => { logoutUser(); router.push('/desktop'); }} 
            className="group flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-all border border-red-500/20 hover:border-red-500/40 text-sm font-bold uppercase tracking-wider"
          >
            <LogOut className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Logout
          </button>
        </header>

        {/* GRID LAYOUT UTAMA */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* KOLOM KIRI: IDENTITY CARD */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="lg:col-span-5 flex flex-col gap-6">
            
            <div className="bg-[#0a0a0b]/80 border border-white/10 rounded-3xl p-8 backdrop-blur-xl shadow-2xl relative overflow-hidden group">
              <div className={`absolute top-0 left-0 w-full h-2 ${role === 'leader' ? 'bg-gradient-to-r from-gold via-yellow-400 to-gold' : 'bg-gradient-to-r from-blue-500 via-cyan-400 to-blue-500'}`} />
              
              <div className="flex flex-col items-center text-center">
                <div className="relative mb-6">
                  {user.photoURL ? (
                    <img src={user.photoURL} alt="Profile" className={`w-28 h-28 rounded-2xl border-4 shadow-2xl transition-all duration-500 group-hover:scale-105 ${role === 'leader' ? 'border-gold/30 shadow-gold/20' : 'border-blue-500/30 shadow-blue-500/20'}`} />
                  ) : (
                    <div className="w-28 h-28 rounded-2xl bg-gray-800 border-4 border-gray-700 flex items-center justify-center shadow-xl">
                      <UserCircle className="w-12 h-12 text-gray-500" />
                    </div>
                  )}
                  <div className={`absolute -bottom-3 -right-3 p-2 rounded-xl border-2 border-[#0a0a0b] ${role === 'leader' ? 'bg-gold text-black' : 'bg-blue-500 text-white'}`}>
                    {role === 'leader' ? <Trophy className="w-5 h-5 fill-current" /> : <Sword className="w-5 h-5 fill-current" />}
                  </div>
                </div>

                <h2 className="text-3xl font-black text-white mb-1 truncate w-full px-2">{user.displayName}</h2>
                <p className="text-gray-400 text-sm font-medium mb-6">{user.email}</p>

                <div className="w-full grid grid-cols-2 gap-3 mb-2">
                  <div className="bg-black/50 border border-white/5 rounded-xl p-4 text-left flex flex-col justify-center">
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">Otoritas Sistem</p>
                    <p className={`text-sm font-black uppercase tracking-wider ${role === 'leader' ? 'text-gold' : role === 'member' ? 'text-blue-400' : 'text-gray-400'}`}>
                      {role}
                    </p>
                  </div>
                  <div className="bg-black/50 border border-white/5 rounded-xl p-4 text-left flex flex-col justify-center">
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">Status Klan</p>
                    <p className="text-sm font-black text-white uppercase tracking-wider truncate">
                      {clanTag ? clanTag : 'GUEST'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* INFO PANEL */}
            <div className="bg-blue-500/5 border border-blue-500/10 rounded-3xl p-6 backdrop-blur-sm">
              <h3 className="text-sm font-bold text-blue-400 flex items-center gap-2 mb-3 uppercase tracking-widest">
                <Info className="w-4 h-4" /> Apa itu Verifikasi Token?
              </h3>
              <p className="text-xs text-gray-400 leading-relaxed font-medium">
                Sistem kami terhubung langsung dengan server Supercell. Untuk membuktikan bahwa Anda adalah anggota atau Leader asli dari suatu klan, kami memerlukan <span className="text-white font-bold">API Token</span> yang bisa digenerate langsung dari dalam game Clash of Clans.
              </p>
            </div>
          </motion.div>

          {/* KOLOM KANAN: FORM VERIFIKASI */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="lg:col-span-7 h-full">
            <div className="bg-gradient-to-br from-[#121318] to-[#0a0a0b] border border-white/10 rounded-3xl p-8 md:p-10 shadow-2xl relative h-full flex flex-col justify-between">
              
              <div>
                <div className="flex items-center gap-4 mb-8 border-b border-white/5 pb-6">
                  <div className="p-3 bg-elixir/10 rounded-2xl border border-elixir/20">
                    <Key className="w-8 h-8 text-elixir drop-shadow-[0_0_10px_rgba(217,70,239,0.5)]" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-white uppercase tracking-wide">Autentikasi Supercell API</h2>
                    <p className="text-xs text-gray-400 font-medium mt-1">Tautkan akun untuk membuka kunci fitur undian.</p>
                  </div>
                </div>

                {role !== 'guest' && playerTag ? (
                  <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="p-8 rounded-3xl bg-gradient-to-br from-green-500/10 to-emerald-900/10 border border-green-500/20 relative overflow-hidden">
                    <div className="absolute -right-6 -top-6 opacity-10 rotate-12">
                      <Shield className="w-48 h-48 text-green-500" />
                    </div>
                    <div className="relative z-10 flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left">
                      <div className="p-4 bg-green-500/20 rounded-full border border-green-500/30 shadow-[0_0_30px_rgba(74,222,128,0.2)]">
                        <CheckCircle2 className="w-12 h-12 text-green-400" />
                      </div>
                      <div>
                        <span className="inline-block px-3 py-1 rounded-full bg-green-500/20 text-green-400 text-[10px] font-black uppercase tracking-widest mb-3 border border-green-500/30">Verified Player</span>
                        <p className="text-3xl font-black text-white font-mono tracking-wider mb-2">{playerTag}</p>
                        <p className="text-gray-300 font-medium">{clanTag ? `Tergabung di Klan: ${clanTag}` : 'Belum bergabung di Klan'}</p>
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <div className="space-y-6">
                    
                    {/* LANGKAH-LANGKAH */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                      <div className="p-4 bg-black/40 border border-white/5 rounded-2xl">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="w-6 h-6 rounded-full bg-white/10 text-xs font-black flex items-center justify-center">1</span>
                          <span className="text-sm font-bold text-white">Buka Settings Game</span>
                        </div>
                        <p className="text-xs text-gray-500 pl-9">Masuk ke Clash of Clans, buka Settings, pilih <span className="text-white">More Settings</span>.</p>
                      </div>
                      <div className="p-4 bg-black/40 border border-white/5 rounded-2xl">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="w-6 h-6 rounded-full bg-white/10 text-xs font-black flex items-center justify-center">2</span>
                          <span className="text-sm font-bold text-white">Salin Token</span>
                        </div>
                        <p className="text-xs text-gray-500 pl-9">Scroll ke bawah, cari tulisan <span className="text-white">API Token</span>, klik Show lalu Copy.</p>
                      </div>
                    </div>

                    <AnimatePresence>
                      {errorMsg && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-sm font-medium">
                          <AlertTriangle className="w-6 h-6 flex-shrink-0" /> {errorMsg}
                        </motion.div>
                      )}
                      {successMsg && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="flex items-center gap-3 p-4 bg-green-500/10 border border-green-500/20 rounded-2xl text-green-400 text-sm font-medium">
                          <CheckCircle2 className="w-6 h-6 flex-shrink-0" /> {successMsg}
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <div className="space-y-5">
                      <div>
                        <label className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-gray-400 mb-3">
                          <UserCircle className="w-4 h-4 text-blue-400" /> Player Tag Anda
                        </label>
                        <input 
                          type="text" 
                          value={tagInput} 
                          onChange={handleTagChange} 
                          placeholder="#P20C8Y9L" 
                          className="w-full bg-black/60 border border-white/10 rounded-2xl px-5 py-4 text-white text-lg focus:outline-none focus:border-elixir focus:ring-1 focus:ring-elixir transition-all font-mono shadow-inner" 
                        />
                      </div>
                      <div>
                        <label className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-gray-400 mb-3">
                          <Smartphone className="w-4 h-4 text-purple-400" /> 8 Digit API Token
                        </label>
                        <input 
                          type="text" 
                          value={tokenInput} 
                          onChange={(e) => setTokenInput(e.target.value)} 
                          placeholder="Contoh: a1b2c3d4" 
                          className="w-full bg-black/60 border border-white/10 rounded-2xl px-5 py-4 text-white text-lg focus:outline-none focus:border-elixir focus:ring-1 focus:ring-elixir transition-all font-mono shadow-inner" 
                        />
                      </div>
                    </div>

                  </div>
                )}
              </div>

              {/* ACTION BUTTON BAWAH */}
              {role === 'guest' || !playerTag ? (
                <div className="mt-8 pt-8 border-t border-white/5">
                  <button 
                    onClick={handleVerify} 
                    disabled={isVerifying || !tagInput || !tokenInput} 
                    className="w-full py-5 rounded-2xl bg-gradient-to-r from-elixir to-blue-600 hover:from-elixir-dark hover:to-blue-700 text-white font-black text-lg tracking-widest uppercase transition-all disabled:opacity-50 disabled:grayscale flex items-center justify-center gap-3 shadow-[0_0_20px_rgba(217,70,239,0.3)] hover:shadow-[0_0_30px_rgba(217,70,239,0.5)] hover:-translate-y-1"
                  >
                    {isVerifying ? <RefreshCw className="w-6 h-6 animate-spin" /> : <Shield className="w-6 h-6" />}
                    {isVerifying ? 'MEMPROSES OTORISASI...' : 'INISIASI VERIFIKASI'}
                  </button>
                </div>
              ) : null}

            </div>
          </motion.div>

        </div>
      </div>
    </div>
  );
}