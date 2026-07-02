"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence, Variants } from "framer-motion";
import { Users, Trophy, Sparkles, RefreshCw, LogIn, LogOut, Plus, X, ChevronDown, UserCircle, CalendarDays, Hash, History, Play, ArrowLeft, Shield } from "lucide-react";
import Link from "next/link";
import { useAuthStore } from "@/store/useAuthStore";

const COC_COLORS = ["#facc15", "#d946ef", "#3b82f6", "#10b981", "#f43f5e", "#8b5cf6", "#f97316"];

const formatSeason = (season: string) => {
  if (season === 'current') return 'Sedang Berlangsung (Live)';
  try {
    const [year, month] = season.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
  } catch {
    return season;
  }
};

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

export default function SpinnerWorkspace() {
  const { role, clanTag, clanId, user, isInitialized, logoutUser, initAuth } = useAuthStore();
  
  const [participants, setParticipants] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState("");
  
  const [topN, setTopN] = useState<number>(5);
  const [selectedSeason, setSelectedSeason] = useState<string>("current");
  const [availableSeasons, setAvailableSeasons] = useState<string[]>([]);
  const [isLoadingSeasons, setIsLoadingSeasons] = useState(false);
  
  const [isSpinning, setIsSpinning] = useState(false);
  const [isLoadingApi, setIsLoadingApi] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [winner, setWinner] = useState<string | null>(null);
  
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  useEffect(() => {
    const fetchSeasons = async () => {
      if (role === 'leader' && clanId) {
        setIsLoadingSeasons(true);
        try {
          const res = await fetch(`/api/cwl/seasons?clanId=${encodeURIComponent(clanId)}`);
          if (res.ok) {
            const data = await res.json();
            setAvailableSeasons(data.seasons || []);
          }
        } catch (error) {
          console.error("Gagal mengambil season:", error);
        } finally {
          setIsLoadingSeasons(false);
        }
      }
    };
    fetchSeasons();
  }, [role, clanId]);

  const handleAddParticipant = () => {
    const trimmed = inputValue.trim();
    if (!trimmed) return;
    if (participants.some(p => p.toLowerCase() === trimmed.toLowerCase())) {
      alert("Nama ini sudah ada di daftar!");
      return;
    }
    setParticipants([...participants, trimmed]);
    setInputValue("");
    setWinner(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddParticipant();
    }
  };

  const handleRemoveParticipant = (indexToRemove: number) => {
    if (isSpinning) return;
    setParticipants(participants.filter((_, index) => index !== indexToRemove));
    setWinner(null);
  };

  const fetchCwlTopN = async () => {
    if (!clanTag || !clanId) return alert("Selesaikan verifikasi Clan di halaman Profil terlebih dahulu.");
    setIsLoadingApi(true);
    try {
      const res = await fetch(`/api/cwl/top?clanTag=${encodeURIComponent(clanTag)}&clanId=${encodeURIComponent(clanId)}&limit=${topN}&season=${selectedSeason}`);
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error);
      
      setParticipants(data.top);
      setWinner(null);
    } catch (error: any) {
      alert(`Gagal menarik data CWL: ${error.message}`);
    } finally {
      setIsLoadingApi(false);
    }
  };

  const saveResultToFirestore = async (winningName: string) => {
    try {
      await fetch('/api/giveaway/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tournamentName: `Undian CWL ${formatSeason(selectedSeason)}`,
          participants: participants,
          winner: winningName,
          clanTag: clanTag || 'GUEST',
          createdBy: user ? user.displayName : "Guest"
        })
      });
    } catch (error) {
      console.error("Gagal menyimpan hasil", error);
    }
  };

  const generateConicGradient = () => {
    if (participants.length === 0) return "conic-gradient(#1e293b 0deg 360deg)";
    if (participants.length === 1) return `conic-gradient(${COC_COLORS[0]} 0deg 360deg)`;
    const sliceAngle = 360 / participants.length;
    let gradient = "conic-gradient(";
    participants.forEach((_, i) => {
      gradient += `${COC_COLORS[i % COC_COLORS.length]} ${i * sliceAngle}deg ${(i + 1) * sliceAngle}deg${i === participants.length - 1 ? "" : ", "}`;
    });
    return gradient + ")";
  };

  const spinWheel = () => {
    if (participants.length < 2 || isSpinning) return;
    setIsSpinning(true);
    setWinner(null);

    const spins = 7;
    const randomDegree = Math.floor(Math.random() * 360);
    const totalRotation = rotation + (spins * 360) + randomDegree;
    setRotation(totalRotation);

    setTimeout(() => {
      const finalNormalizedDegree = totalRotation % 360;
      const sliceAngle = 360 / participants.length;
      const pointerDegree = (360 - finalNormalizedDegree) % 360;
      const winningIndex = Math.floor(pointerDegree / sliceAngle);
      
      const winningName = participants[winningIndex];
      setWinner(winningName);
      setIsSpinning(false);

      if (user) {
        saveResultToFirestore(winningName);
      }
    }, 7000);
  };

  return (
    // PERBAIKAN: Mengganti overflow-hidden menjadi overflow-x-hidden agar halaman bisa di-scroll ke bawah!
    <div className="min-h-screen bg-[#050505] text-white p-4 md:p-6 relative overflow-x-hidden font-sans selection:bg-gold selection:text-black pb-20">
      
      {/* AMBIENT BACKGROUND GLOWS */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-600/10 blur-[120px] rounded-full mix-blend-screen animate-pulse-slow" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-purple-600/10 blur-[150px] rounded-full mix-blend-screen" />
        <motion.div 
          animate={{ rotate: 360 }} 
          transition={{ duration: 100, repeat: Infinity, ease: "linear" }}
          className="absolute top-[20%] right-[20%] w-[30%] h-[40%] bg-gold/5 blur-[100px] rounded-full mix-blend-screen" 
        />
        <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-[0.03] bg-repeat pointer-events-none" />
      </div>

      {/* HEADER WITH DROPDOWN */}
      <header className="w-full flex items-center justify-between bg-black/40 border border-white/10 backdrop-blur-xl rounded-2xl px-6 py-4 mb-6 relative z-50 shadow-2xl">
        <div className="flex items-center gap-4">
          <Link href="/desktop" className="p-2 bg-white/5 hover:bg-white/10 rounded-xl transition-colors text-gray-400 hover:text-white">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="h-8 w-[1px] bg-white/10"></div>
          <div>
            <h1 className="text-xl md:text-2xl font-black tracking-wider uppercase bg-clip-text text-transparent bg-gradient-to-r from-white via-gray-200 to-gray-500 drop-shadow-sm">
              CLASH<span className="text-gold">PIN</span>
            </h1>
            <p className="text-[10px] text-gold/80 font-mono tracking-widest uppercase">Workspace Undian</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          {!isInitialized ? (
            <div className="h-10 w-32 bg-white/5 animate-pulse rounded-xl"></div>
          ) : user ? (
            <>
              <span className={`hidden sm:flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider border shadow-inner ${role === 'leader' ? 'bg-gold/10 text-gold border-gold/30 shadow-gold/10' : 'bg-blue-500/10 text-blue-400 border-blue-500/30 shadow-blue-500/10'}`}>
                {role === 'leader' ? <Trophy className="w-3.5 h-3.5" /> : <UserCircle className="w-3.5 h-3.5" />}
                {role}
              </span>

              <div className="relative">
                <button 
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center gap-3 pl-2 pr-3 py-1.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all focus:outline-none shadow-lg"
                >
                  {user.photoURL ? (
                    <img src={user.photoURL} alt="Profile" className="w-8 h-8 rounded-lg border border-white/20" />
                  ) : (
                    <div className="w-8 h-8 rounded-lg bg-gray-800 border border-white/20 flex items-center justify-center">
                      <UserCircle className="w-5 h-5 text-gray-400" />
                    </div>
                  )}
                  <span className="text-sm font-bold text-white hidden sm:block">{user.displayName?.split(' ')[0]}</span>
                  <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-300 ${isDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                <AnimatePresence>
                  {isDropdownOpen && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setIsDropdownOpen(false)}></div>
                      <motion.div 
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="absolute right-0 mt-3 w-64 bg-[#0f1115]/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.5)] py-2 z-50 overflow-hidden"
                      >
                        <div className="px-5 py-4 border-b border-white/5 mb-1 bg-black/20">
                           <p className="text-xs text-gray-400 mb-1">Login sebagai</p>
                           <p className="text-sm font-bold text-white truncate">{user.email}</p>
                           <span className={`inline-block mt-2 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest sm:hidden ${role === 'leader' ? 'bg-gold/20 text-gold' : 'bg-blue-500/20 text-blue-400'}`}>
                             {role}
                           </span>
                        </div>
                        <div className="p-2 space-y-1">
                          <Link href="/desktop/profile" onClick={() => setIsDropdownOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-300 hover:text-white hover:bg-white/10 transition-colors">
                            <Shield className="w-4 h-4 text-blue-400" /> Profil & Verifikasi
                          </Link>
                          <Link href="/desktop/history" onClick={() => setIsDropdownOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-300 hover:text-white hover:bg-white/10 transition-colors">
                            <History className="w-4 h-4 text-gold" /> Riwayat Undian
                          </Link>
                        </div>
                        <div className="h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent my-1"></div>
                        <div className="p-2">
                          <button onClick={() => { setIsDropdownOpen(false); logoutUser(); }} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors text-left">
                            <LogOut className="w-4 h-4" /> Keluar
                          </button>
                        </div>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
            </>
          ) : (
            <>
              <span className="hidden md:inline-block px-3 py-1 rounded-full bg-gray-800 text-gray-400 text-xs font-semibold border border-gray-700">Mode Guest</span>
              <Link href="/desktop/login" className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-elixir to-purple-600 hover:from-elixir-dark hover:to-purple-700 text-white shadow-[0_0_20px_rgba(217,70,239,0.3)] hover:shadow-[0_0_30px_rgba(217,70,239,0.5)] hover:-translate-y-0.5 transition-all text-sm font-bold">
                <LogIn className="w-4 h-4" /> Masuk / Daftar
              </Link>
            </>
          )}
        </div>
      </header>

      {/* WORKSPACE LAYOUT */}
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 lg:grid-cols-12 gap-6 relative z-10"
      >
        
        {/* KOLOM KIRI (Kontrol) */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          
          <motion.div variants={itemVariants} className={`p-6 rounded-3xl border relative overflow-hidden group transition-all flex flex-col ${role === 'leader' ? 'bg-gradient-to-br from-[#121318] to-[#0a0a0b] border-gold/30 shadow-[0_10px_40px_rgba(250,204,21,0.05)] hover:border-gold/50' : 'bg-black/40 border-white/5 grayscale opacity-80'}`}>
            <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none transform group-hover:scale-110 transition-transform duration-700">
              <Trophy className="w-32 h-32 text-gold" />
            </div>
            
            <div className="mb-6 relative z-10">
              <h2 className="text-lg font-black text-white flex items-center gap-2 uppercase tracking-wide">
                <Sparkles className="w-5 h-5 text-gold" /> Impor Data CWL
              </h2>
              <p className="text-xs text-gray-400 mt-1.5 leading-relaxed font-medium">
                {role === 'leader' 
                  ? 'Tarik pemain terbaik berdasarkan akumulasi Bintang & Persentase dari 7 ronde peperangan.' 
                  : 'Fitur terkunci. Verifikasi token API di Profil untuk membuka.'}
              </p>
            </div>

            <div className="space-y-4 relative z-20 mt-auto">
              <div>
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                  <CalendarDays className="w-3.5 h-3.5" /> Pilih Musim CWL
                </label>
                <div className="relative group/select">
                  <select 
                    value={selectedSeason}
                    onChange={(e) => setSelectedSeason(e.target.value)}
                    disabled={role !== 'leader' || isLoadingApi || isLoadingSeasons}
                    className="w-full appearance-none bg-black/50 border border-white/10 group-hover/select:border-gold/40 rounded-xl px-4 py-3.5 text-sm font-medium text-white focus:outline-none focus:ring-1 focus:ring-gold transition-all disabled:opacity-50 cursor-pointer shadow-inner"
                  >
                    <option value="current">Sedang Berlangsung (Live)</option>
                    {availableSeasons.map(season => (
                      <option key={season} value={season}>{formatSeason(season)}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none group-hover/select:text-gold transition-colors" />
                </div>
              </div>

              <div className="flex items-end gap-3">
                <div className="w-24">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                    <Hash className="w-3.5 h-3.5" /> Top Limit
                  </label>
                  <input 
                    type="number" 
                    min="1" 
                    max="50"
                    value={topN}
                    onChange={(e) => setTopN(Number(e.target.value))}
                    disabled={role !== 'leader' || isLoadingApi}
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-3.5 text-center text-white focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold transition-all disabled:opacity-50 font-black text-lg shadow-inner"
                  />
                </div>
                <button 
                  onClick={fetchCwlTopN}
                  disabled={role !== 'leader' || isLoadingApi}
                  className="flex-1 py-3.5 rounded-xl bg-gradient-to-r from-gold to-yellow-500 hover:from-yellow-400 hover:to-yellow-300 text-black font-black flex items-center justify-center gap-2 transition-all disabled:opacity-30 disabled:cursor-not-allowed uppercase tracking-widest text-xs shadow-[0_0_20px_rgba(250,204,21,0.3)] hover:shadow-[0_0_30px_rgba(250,204,21,0.5)] hover:-translate-y-0.5"
                >
                  {isLoadingApi ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Users className="w-4 h-4" />}
                  Tarik Data
                </button>
              </div>
            </div>
          </motion.div>

          {/* CARD PESERTA MANUAL (PERBAIKAN: min-h-0 agar scroll berfungsi sempurna) */}
          <motion.div variants={itemVariants} className="flex-1 rounded-3xl bg-black/40 border border-white/10 backdrop-blur-md p-6 flex flex-col h-full min-h-[400px] overflow-hidden shadow-2xl relative">
            <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />

            <div className="flex items-center justify-between mb-5 flex-shrink-0 relative z-10">
              <h2 className="text-lg font-black text-white flex items-center gap-2 uppercase tracking-wide">
                <Users className="w-5 h-5 text-elixir" /> Daftar Peserta
              </h2>
              <span className="text-xs bg-elixir/20 text-elixir border border-elixir/30 px-3 py-1 rounded-full font-bold shadow-[0_0_10px_rgba(217,70,239,0.2)]">
                {participants.length} Orang
              </span>
            </div>
            
            <div className="flex gap-2 mb-5 flex-shrink-0 relative z-10">
              <input 
                type="text"
                disabled={isSpinning}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ketik nama manual lalu Enter..."
                className="flex-1 bg-black/60 border border-white/10 rounded-xl px-4 py-3.5 text-sm text-white focus:outline-none focus:border-elixir/50 focus:ring-1 focus:ring-elixir/50 transition-all disabled:opacity-50 shadow-inner"
              />
              <button 
                onClick={handleAddParticipant}
                disabled={isSpinning || !inputValue.trim()}
                className="bg-gradient-to-br from-elixir to-purple-600 hover:from-elixir-dark hover:to-purple-700 text-white p-3.5 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shadow-[0_0_15px_rgba(217,70,239,0.3)] hover:-translate-y-0.5"
              >
                <Plus className="w-5 h-5 font-bold" />
              </button>
            </div>

            {/* min-h-0 di flex child krusial agar list bisa scroll ke bawah alih-alih melebarkan grid */}
            <div className="flex-1 overflow-y-auto min-h-0 pr-2 space-y-2.5 custom-scrollbar relative z-10">
              <AnimatePresence>
                {participants.length === 0 ? (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-full flex flex-col items-center justify-center text-gray-500 text-sm text-center px-4 py-10">
                    <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-3 border border-white/5">
                      <Users className="w-8 h-8 opacity-40" />
                    </div>
                    <p className="font-medium">Ruang undian masih kosong.</p>
                    <p className="text-xs mt-1 opacity-70">Tambahkan manual atau tarik dari sistem CWL.</p>
                  </motion.div>
                ) : (
                  participants.map((name, index) => (
                    <motion.div
                      key={`${name}-${index}`}
                      initial={{ opacity: 0, x: -20, scale: 0.9 }}
                      animate={{ opacity: 1, x: 0, scale: 1 }}
                      exit={{ opacity: 0, x: 20, scale: 0.9, transition: { duration: 0.2 } }}
                      className="flex items-center justify-between bg-black/50 border border-white/5 rounded-xl px-4 py-3.5 group hover:border-white/20 hover:bg-white/[0.02] transition-all shadow-sm"
                    >
                      <span className="text-sm font-bold text-gray-200 truncate group-hover:text-white transition-colors">{name}</span>
                      <button 
                        onClick={() => handleRemoveParticipant(index)} 
                        disabled={isSpinning} 
                        className="text-gray-500 hover:text-red-400 hover:bg-red-400/10 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all disabled:opacity-0"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>

        {/* KOLOM KANAN (Roda 3D Epic) */}
        {/* PERBAIKAN: flex-col digunakan agar Tombol Putar ditempatkan rapi DI BAWAH Roda, bukan absolute menabrak batas */}
        <motion.div variants={itemVariants} className="lg:col-span-8 rounded-3xl bg-[#0a0a0b]/80 backdrop-blur-2xl border border-white/10 relative flex flex-col items-center justify-center py-12 px-6 overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-elixir/5 blur-[100px] rounded-full pointer-events-none" />

          {/* Wrapper Presisi untuk Wheel & Pointer */}
          <div className="relative w-[350px] h-[350px] md:w-[450px] md:h-[450px] perspective-1000 mt-2 md:mt-4 z-10">
            
            {/* Pointer (Segitiga Emas) terikat ke sisi atas roda */}
            <div className="absolute top-[-35px] left-1/2 -translate-x-1/2 z-30 drop-shadow-[0_10px_15px_rgba(0,0,0,0.8)]">
              <div className="relative">
                 <div className="w-0 h-0 border-l-[18px] border-l-transparent border-r-[18px] border-r-transparent border-t-[45px] border-t-white relative z-10"></div>
                 <div className="absolute top-0 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[14px] border-l-transparent border-r-[14px] border-r-transparent border-t-[40px] border-t-gray-300 z-20"></div>
              </div>
            </div>

            {/* RODA SPINNER */}
            <motion.div 
              animate={{ rotate: rotation }}
              transition={{ duration: 7, ease: [0.15, 0.9, 0.1, 1] }} 
              className="w-full h-full rounded-full border-[12px] border-[#1a1c23] relative flex items-center justify-center overflow-hidden"
              style={{ 
                background: generateConicGradient(),
                boxShadow: 'inset 0 0 40px rgba(0,0,0,0.7), 0 0 50px rgba(217,70,239,0.15), 0 20px 40px rgba(0,0,0,0.6)'
              }}
            >
              <div className="absolute inset-0 rounded-full border-[4px] border-white/20 z-10 mix-blend-overlay"></div>
              
              <div className="w-20 h-20 bg-[#121318] rounded-full border-[6px] border-gray-800 shadow-[0_10px_25px_rgba(0,0,0,0.8)] z-30 flex items-center justify-center relative">
                <div className="absolute inset-0 rounded-full border border-white/10"></div>
                <div className="w-8 h-8 bg-gradient-to-br from-gold to-yellow-600 rounded-full shadow-inner relative flex items-center justify-center">
                  <div className="w-3 h-3 bg-yellow-200/50 rounded-full blur-[1px] absolute top-1.5 left-1.5"></div>
                </div>
              </div>

              {participants.map((name, i) => {
                 if (participants.length > 50) return null;
                 const sliceAngle = 360 / participants.length;
                 const rotationAngle = (i * sliceAngle) + (sliceAngle / 2);
                 return (
                   <div 
                     key={i} 
                     className="absolute w-[50%] h-8 left-[50%] origin-left flex items-center justify-end pr-10 text-white font-black tracking-wide drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] z-20" 
                     style={{ transform: `rotate(${rotationAngle - 90}deg)` }}
                   >
                     <span className="truncate max-w-[130px] text-sm md:text-base">{name}</span>
                   </div>
                 );
              })}
            </motion.div>
            
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/10 to-transparent pointer-events-none z-20 mix-blend-overlay"></div>
          </div>

          {/* TOMBOL PUTAR BAWAH (Sekarang pakai margin top agar rapi sejajar tanpa tumpang tindih) */}
          <div className="mt-12 mb-4 z-30">
            <button 
              onClick={spinWheel} 
              disabled={isSpinning || participants.length < 2} 
              className="group relative px-14 py-4 bg-gradient-to-b from-white to-gray-300 text-black text-xl font-black tracking-widest uppercase rounded-full shadow-[0_10px_30px_rgba(255,255,255,0.2),_0_20px_0_#9ca3af] hover:shadow-[0_10px_40px_rgba(255,255,255,0.4),_0_20px_0_#9ca3af] hover:-translate-y-1 active:translate-y-4 active:shadow-[0_0px_10px_rgba(255,255,255,0.2),_0_0px_0_#9ca3af] transition-all duration-200 disabled:opacity-50 disabled:translate-y-0 disabled:shadow-[0_10px_30px_rgba(255,255,255,0.1),_0_20px_0_#4b5563] disabled:bg-gray-600 disabled:text-gray-400 disabled:cursor-not-allowed flex items-center gap-3"
            >
              {isSpinning ? (
                <>Mengundi <RefreshCw className="w-6 h-6 animate-spin" /></>
              ) : (
                <>Putar <Play className="w-6 h-6 fill-black" /></>
              )}
            </button>
          </div>

          {/* MODAL PEMENANG (EPIC ANIMATION) */}
          <AnimatePresence>
            {winner && (
              <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                exit={{ opacity: 0 }}
                className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md"
              >
                <motion.div 
                  animate={{ rotate: 360 }}
                  transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-[-50%] bg-[conic-gradient(from_0deg,transparent_0deg,rgba(250,204,21,0.2)_10deg,transparent_20deg,transparent_90deg,rgba(250,204,21,0.2)_100deg,transparent_110deg,transparent_180deg,rgba(250,204,21,0.2)_190deg,transparent_200deg,transparent_270deg,rgba(250,204,21,0.2)_280deg,transparent_290deg)] pointer-events-none"
                />

                <motion.div 
                  initial={{ scale: 0.5, y: 50, opacity: 0 }} 
                  animate={{ scale: 1, y: 0, opacity: 1, transition: { type: "spring", bounce: 0.5 } }} 
                  className="bg-gradient-to-br from-[#1a1c23] to-[#0a0a0b] border-2 border-gold/50 p-10 rounded-[2rem] max-w-md w-full text-center shadow-[0_0_100px_rgba(250,204,21,0.4)] relative overflow-hidden"
                >
                  <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-transparent via-gold to-transparent" />
                  
                  <motion.div 
                    initial={{ scale: 0 }} 
                    animate={{ scale: 1, rotate: [0, -10, 10, -10, 0] }} 
                    transition={{ delay: 0.2, duration: 0.5 }}
                  >
                    <Trophy className="w-28 h-28 text-gold mx-auto mb-6 drop-shadow-[0_0_20px_rgba(250,204,21,0.6)]" />
                  </motion.div>
                  
                  <h3 className="text-gray-400 font-bold uppercase tracking-widest text-sm mb-2">🏆 Pemenang Giveaway 🏆</h3>
                  <p className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white via-yellow-100 to-gold mb-10 drop-shadow-md py-2 truncate px-2">{winner}</p>
                  
                  <div className="space-y-3 relative z-10">
                    <button 
                      onClick={() => setWinner(null)} 
                      className="w-full py-4 bg-white text-black font-black uppercase tracking-widest rounded-xl hover:bg-gray-200 transition-colors shadow-lg"
                    >
                      Tutup
                    </button>
                    {!user && (
                      <Link href="/desktop/login" className="block w-full py-4 bg-white/5 border border-white/10 text-white text-center font-bold rounded-xl hover:bg-white/10 hover:border-white/20 transition-all text-sm uppercase tracking-wider">
                        Simpan Hasil? Login Dulu
                      </Link>
                    )}
                    {user && (
                      <div className="px-4 py-3 bg-green-500/10 border border-green-500/20 rounded-xl flex items-center justify-center gap-2 text-green-400 text-xs font-bold uppercase tracking-wider">
                        <Sparkles className="w-4 h-4" /> Hasil Disimpan ke Riwayat
                      </div>
                    )}
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: rgba(0, 0, 0, 0.2); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.1); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(250, 204, 21, 0.5); }
        .perspective-1000 { perspective: 1000px; }
      `}</style>
    </div>
  );
}