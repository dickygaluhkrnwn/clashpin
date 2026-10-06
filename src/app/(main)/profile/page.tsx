"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Shield, LogOut, Loader2, UserCircle, Trophy, Sword, CheckCircle2, ChevronRight, AlertTriangle, BadgeCheck, Settings, HelpCircle, ShieldCheck, Lock, Mail, Key, Info, RefreshCw } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { Button } from "@/components/ui/Button";
import { Drawer } from "@/components/ui/Drawer";
import { Input } from "@/components/ui/Input";
import { auth, googleProvider, db } from "@/lib/firebase";
import { linkWithPopup, updatePassword } from "firebase/auth";
import { doc, updateDoc } from "firebase/firestore";
import { useToastStore } from "@/components/ui/Toast";

export default function ProfilePage() {
  const { user, role, clanTag, playerTag, isInitialized, logoutUser, initAuth } = useAuthStore();
  const router = useRouter();
  
  const [isSecurityModalOpen, setIsSecurityModalOpen] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [isLinking, setIsLinking] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const { showToast } = useToastStore();

  // VERIFY STATES
  const [isVerifyDrawerOpen, setIsVerifyDrawerOpen] = useState(false);
  const [tagInput, setTagInput] = useState(playerTag || "");
  const [tokenInput, setTokenInput] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => { initAuth(); }, [initAuth]);
  useEffect(() => { if (playerTag && !tagInput) setTagInput(playerTag); }, [playerTag, tagInput]);

  if (!isInitialized) {
    return (
      <div className="min-h-[100dvh] bg-[#050505] flex flex-col items-center justify-center">
        <Loader2 className="w-8 h-8 text-elixir animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-[100dvh] bg-[#050505] text-white flex flex-col px-6 items-center justify-center">
        <Shield className="w-20 h-20 text-red-500 mb-6 opacity-80" />
        <h2 className="text-xl font-bold mb-2">Akses Ditolak</h2>
        <p className="text-gray-400 text-center mb-8 text-sm">Silakan login terlebih dahulu untuk melihat profil.</p>
        <Link href="/login" className="w-full max-w-xs">
          <Button variant="primary" fullWidth>Kembali ke Login</Button>
        </Link>
      </div>
    );
  }

  const isVerified = role !== 'guest' && playerTag;
  
  const hasGoogle = user.providerData.some(p => p.providerId === 'google.com');
  const hasPassword = user.providerData.some(p => p.providerId === 'password');

  const handleLinkGoogle = async () => {
    try {
      setIsLinking(true);
      await linkWithPopup(user, googleProvider);
      showToast("Akun Google berhasil ditautkan!", "success");
      setIsSecurityModalOpen(false);
    } catch (error: any) {
      console.error(error);
      showToast(error.message || "Gagal menautkan Google.", "error");
    } finally {
      setIsLinking(false);
    }
  };

  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) return showToast("Password minimal 6 karakter.", "error");
    try {
      setIsLinking(true);
      await updatePassword(user, newPassword);
      showToast("Password berhasil ditambahkan!", "success");
      setIsSecurityModalOpen(false);
      setNewPassword("");
    } catch (error: any) {
      console.error(error);
      if (error.code === 'auth/requires-recent-login') {
        showToast("Silakan logout dan login kembali untuk melakukan ini karena alasan keamanan.", "error");
      } else {
        showToast(error.message || "Gagal menambahkan password.", "error");
      }
    } finally {
      setIsLinking(false);
    }
  };

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

        useAuthStore.getState().updateUserRole(data.role, data.clanTag, newClanId, tagInput);
        setSuccessMsg(`Berhasil terhubung sebagai ${data.playerName}`);
        setTokenInput(""); 
        
        setTimeout(() => setIsVerifyDrawerOpen(false), 2000);
      }
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSyncData = async () => {
    if (!clanTag) {
       showToast("Hubungkan Klan terlebih dahulu sebelum sinkronisasi.", "error");
       return;
    }
    setIsSyncing(true);
    try {
      const res = await fetch("/api/cwl/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clanTag })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal sinkronisasi");
      showToast(data.message || "Data klan berhasil disinkronkan!", "success");
    } catch (err: any) {
      console.error(err);
      showToast(err.message || "Terjadi kesalahan saat menyinkronkan data klan.", "error");
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="h-full flex-1 w-full text-white font-sans selection:bg-gold selection:text-black pb-24">
      
      <div className="pt-6 px-4 max-w-md mx-auto w-full flex flex-col gap-6">
        
        {/* AVATAR & INFO SECTION */}
        <div className="flex flex-col items-center mt-2 mb-2">
          <div className="relative mb-4 group">
            {user.photoURL ? (
              <img src={user.photoURL} alt="Profile" className="w-24 h-24 rounded-full border-4 border-[#050505] shadow-[0_0_0_2px_rgba(255,255,255,0.1)] object-cover" />
            ) : (
              <div className="w-24 h-24 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                <UserCircle className="w-12 h-12 text-gray-500" />
              </div>
            )}
            <div className={`absolute bottom-0 right-0 p-1.5 rounded-full border-2 border-[#050505] ${role === 'leader' ? 'bg-gold text-black' : role === 'member' ? 'bg-blue-500 text-white' : 'bg-gray-700 text-gray-300'}`}>
              {role === 'leader' ? <Trophy className="w-3.5 h-3.5" /> : role === 'member' ? <Sword className="w-3.5 h-3.5" /> : <Shield className="w-3.5 h-3.5" />}
            </div>
          </div>
          
          {/* DISPLAY NAME & IG BADGE */}
          <div className="flex items-center justify-center gap-1.5 mb-1 w-full px-4">
            <h2 className="text-xl font-black truncate">{user.displayName || "Pengguna"}</h2>
            {isVerified && (
              <BadgeCheck className="w-5 h-5 text-blue-500 flex-shrink-0" />
            )}
          </div>
          
          {/* PLAYER TAG OR EMAIL */}
          {isVerified ? (
            <p className="text-sm font-mono text-gray-300 font-bold bg-white/5 px-3 py-1 rounded-full mt-1 border border-white/5">
              {playerTag}
            </p>
          ) : (
            <p className="text-xs text-gray-500 font-medium">{user.email}</p>
          )}
        </div>

        {/* MENUS / CARDS SECTION */}
        <div className="flex flex-col gap-3 mt-4">
          
          {/* STATUS KLAN CARD WITH INTEGRATED SYNC */}
          <div className="bg-gradient-to-br from-white/[0.05] to-white/[0.01] border border-white/10 rounded-2xl p-4 relative overflow-hidden">
             {/* decorative background blur */}
             <div className="absolute -top-10 -right-10 w-32 h-32 bg-blue-500/10 blur-3xl rounded-full"></div>
             
             <div className="flex items-center justify-between relative z-10">
                <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-xl shadow-inner ${role === 'leader' ? 'bg-gold/10 text-gold shadow-[0_0_15px_rgba(255,215,0,0.15)]' : role === 'member' ? 'bg-blue-500/10 text-blue-400' : 'bg-gray-800 text-gray-400'}`}>
                    {role === 'leader' ? <Trophy className="w-5 h-5" /> : role === 'member' ? <Sword className="w-5 h-5" /> : <Shield className="w-5 h-5" />}
                  </div>
                  <div>
                    <p className="text-[11px] text-gray-400 font-bold uppercase tracking-wider mb-0.5">Otoritas & Klan</p>
                    <p className="text-sm font-black uppercase text-white tracking-wide">{role} &bull; {clanTag || "GUEST"}</p>
                  </div>
                </div>
                
                {clanTag && (
                  <button 
                    onClick={handleSyncData}
                    disabled={isSyncing}
                    className="flex flex-col items-center justify-center p-2 rounded-xl bg-white/5 hover:bg-blue-500/20 active:scale-95 transition-all group border border-white/5 hover:border-blue-500/30"
                  >
                     <RefreshCw className={`w-5 h-5 text-gray-400 group-hover:text-blue-400 transition-colors ${isSyncing ? 'animate-spin text-blue-400' : ''}`} />
                     <span className="text-[8px] font-bold text-gray-500 group-hover:text-blue-400 mt-1 uppercase tracking-widest transition-colors">{isSyncing ? 'Syncing' : 'Sync'}</span>
                  </button>
                )}
             </div>
          </div>

          {/* VERIFICATION NAVIGATION CARD */}
          <button onClick={() => setIsVerifyDrawerOpen(true)} className="block outline-none w-full text-left">
            <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-4 flex items-center justify-between hover:bg-white/[0.05] transition-colors active:scale-[0.98]">
              <div className="flex items-center gap-3">
                <div className={`p-3 rounded-xl ${isVerified ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                  {isVerified ? <CheckCircle2 className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
                </div>
                <div>
                  <p className="text-[11px] text-gray-500 font-bold uppercase tracking-wider mb-0.5">Koneksi Supercell</p>
                  <p className={`text-sm font-bold ${isVerified ? 'text-white' : 'text-red-400'}`}>
                    {isVerified ? 'Edit Tautan Akun' : 'Verifikasi Akun Sekarang'}
                  </p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-500" />
            </div>
          </button>

          {/* SECURITY MENU CARD */}
          <button onClick={() => setIsSecurityModalOpen(true)} className="outline-none w-full text-left mt-2">
            <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-4 flex items-center justify-between hover:bg-white/[0.05] transition-colors active:scale-[0.98]">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-purple-500/10 text-purple-400">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[11px] text-gray-500 font-bold uppercase tracking-wider mb-0.5">Keamanan Akun</p>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-white">Tautkan Metode Login</p>
                    {(!hasGoogle || !hasPassword) && (
                       <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                    )}
                  </div>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-500" />
            </div>
          </button>



          {/* DUMMY SETTINGS MENUS */}
          <div className="bg-white/[0.03] border border-white/5 rounded-2xl flex flex-col mt-2 overflow-hidden">
            <button className="flex items-center justify-between p-4 border-b border-white/5 hover:bg-white/[0.05] transition-colors text-left w-full active:bg-white/10">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-white/5 text-gray-400">
                  <Settings className="w-5 h-5" />
                </div>
                <span className="text-sm font-bold text-gray-200">Pengaturan Aplikasi</span>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-600" />
            </button>
            <button className="flex items-center justify-between p-4 border-b border-white/5 hover:bg-white/[0.05] transition-colors text-left w-full active:bg-white/10">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-white/5 text-gray-400">
                  <HelpCircle className="w-5 h-5" />
                </div>
                <span className="text-sm font-bold text-gray-200">Pusat Bantuan</span>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-600" />
            </button>
            <button className="flex items-center justify-between p-4 hover:bg-white/[0.05] transition-colors text-left w-full active:bg-white/10">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-white/5 text-gray-400">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <span className="text-sm font-bold text-gray-200">Kebijakan Privasi</span>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          {/* LOGOUT MENU ITEM */}
          <button 
            onClick={() => { logoutUser(); router.push('/'); }} 
            className="flex items-center justify-between p-4 bg-red-500/5 border border-red-500/10 rounded-2xl hover:bg-red-500/10 transition-colors text-left w-full mt-2 active:bg-red-500/20"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-red-500/10 text-red-500">
                <LogOut className="w-5 h-5" />
              </div>
              <span className="text-sm font-bold text-red-500">Keluar dari Akun</span>
            </div>
            <ChevronRight className="w-5 h-5 text-red-500/50" />
          </button>
          
        </div>
      </div>
      
      {/* SECURITY DRAWER */}
      <Drawer isOpen={isSecurityModalOpen} onClose={() => setIsSecurityModalOpen(false)} title="Keamanan Akun">
         <div className="flex flex-col gap-6 text-gray-300 px-2 pb-8">
            <p className="text-sm">Tautkan beberapa metode login sekaligus agar kamu tidak kehilangan akses akun ini.</p>
            
            <div className="flex flex-col gap-4">
              {/* GOOGLE LINKING */}
              <div className="flex items-center justify-between p-4 border border-white/10 bg-white/5 rounded-xl">
                 <div className="flex items-center gap-3">
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                    <div>
                      <p className="font-bold text-white text-sm">Akun Google</p>
                      <p className="text-xs text-gray-500">{hasGoogle ? 'Sudah Tertaut' : 'Belum Tertaut'}</p>
                    </div>
                 </div>
                 {hasGoogle ? (
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                 ) : (
                    <Button onClick={handleLinkGoogle} disabled={isLinking} size="sm" variant="outline" className="text-xs h-8">
                       Tautkan
                    </Button>
                 )}
              </div>

              {/* PASSWORD LINKING */}
              <div className="flex items-center justify-between p-4 border border-white/10 bg-white/5 rounded-xl">
                 <div className="flex items-center gap-3">
                    <div className="w-6 h-6 flex items-center justify-center bg-gray-800 rounded-full">
                       <Mail className="w-3 h-3 text-white" />
                    </div>
                    <div>
                      <p className="font-bold text-white text-sm">Email & Password</p>
                      <p className="text-xs text-gray-500">{hasPassword ? 'Sudah Diatur' : 'Belum Diatur'}</p>
                    </div>
                 </div>
                 {hasPassword ? (
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                 ) : (
                    <span className="text-xs font-bold text-red-400">Butuh Aksi</span>
                 )}
              </div>
              
              {!hasPassword && (
                 <form onSubmit={handleSetPassword} className="mt-2 flex flex-col gap-3 p-4 border border-red-500/20 bg-red-500/5 rounded-xl">
                    <p className="text-xs text-gray-400">Kamu mendaftar menggunakan Google. Buat sebuah password agar kamu juga bisa login menggunakan Email kamu.</p>
                    <Input 
                      type="password" 
                      placeholder="Masukkan Password Baru" 
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                    />
                    <Button type="submit" disabled={isLinking || !newPassword} className="w-full">
                      Simpan Password
                    </Button>
                 </form>
              )}
            </div>
         </div>
      </Drawer>

      {/* VERIFY DRAWER */}
      <Drawer isOpen={isVerifyDrawerOpen} onClose={() => setIsVerifyDrawerOpen(false)} title="Koneksi Supercell">
        <div className="flex flex-col gap-5 text-gray-300 pb-8 px-2">
          
          <div className="flex items-start gap-3 bg-blue-500/10 text-blue-400 p-4 rounded-2xl border border-blue-500/20">
            <Info className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <p className="text-xs leading-relaxed font-medium">
              Tautkan Player Tag dan API Token dari setelan game Clash of Clans untuk membuka fitur undian klan.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-2">
            <div className="p-3 bg-white/[0.02] border border-white/5 rounded-xl">
              <div className="flex items-center gap-2 mb-1">
                <span className="w-4 h-4 rounded-full bg-white/10 text-[9px] font-black flex items-center justify-center">1</span>
                <span className="text-xs font-bold text-white">Buka Settings Game</span>
              </div>
              <p className="text-[10px] text-gray-500 pl-6">Buka Settings, pilih <span className="text-white">More Settings</span>.</p>
            </div>
            <div className="p-3 bg-white/[0.02] border border-white/5 rounded-xl">
              <div className="flex items-center gap-2 mb-1">
                <span className="w-4 h-4 rounded-full bg-white/10 text-[9px] font-black flex items-center justify-center">2</span>
                <span className="text-xs font-bold text-white">Salin Token</span>
              </div>
              <p className="text-[10px] text-gray-500 pl-6">Cari tulisan <span className="text-white">API Token</span>, klik Show lalu Copy.</p>
            </div>
          </div>

          {errorMsg && (
            <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs font-medium">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" /> {errorMsg}
            </div>
          )}
          {successMsg && (
            <div className="flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/20 rounded-xl text-green-400 text-xs font-medium">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" /> {successMsg}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-[11px] font-bold text-gray-400 mb-1.5 ml-1">Player Tag</label>
              <Input 
                type="text" 
                value={tagInput} 
                onChange={handleTagChange} 
                placeholder="#P20C8Y9L" 
                leftIcon={<UserCircle className="w-4 h-4 text-gray-500" />}
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-gray-400 mb-1.5 ml-1">API Token (8 Digit)</label>
              <Input 
                type="text" 
                value={tokenInput} 
                onChange={(e) => setTokenInput(e.target.value)} 
                placeholder="Contoh: a1b2c3d4" 
                leftIcon={<Key className="w-4 h-4 text-gray-500" />}
              />
            </div>
          </div>

          <Button 
            variant="primary"
            fullWidth
            onClick={handleVerify} 
            disabled={isVerifying || !tagInput || !tokenInput}
            className="mt-2 py-4"
          >
            {isVerifying ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Shield className="w-5 h-5 mr-2" />}
            {isVerifying ? 'MEMPROSES...' : 'TAUTKAN AKUN'}
          </Button>

        </div>
      </Drawer>
    </div>
  );
}