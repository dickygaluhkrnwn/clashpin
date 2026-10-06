"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Users, Trophy, RefreshCw, Plus, X, Play, Loader2, Database, Hash, CheckCircle2, AlertTriangle, UserCircle } from "lucide-react";
import Link from "next/link";
import { useAuthStore } from "@/store/useAuthStore";
import { Button } from "@/components/ui/Button";
import { Drawer } from "@/components/ui/Drawer";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";

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

export function SpinnerWorkspace() {
  const { role, clanTag, clanId, user, isInitialized, initAuth } = useAuthStore();
  
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
  
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  useEffect(() => { initAuth(); }, [initAuth]);

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
    setParticipants([trimmed, ...participants]); 
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
      setIsDrawerOpen(false);
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
    if (participants.length === 0) {
      return "conic-gradient(#ff0000, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff, #ff0000)";
    }
    if (participants.length === 1) return `conic-gradient(${COC_COLORS[0]} 0deg 360deg)`;
    const sliceAngle = 360 / participants.length;
    let gradient = "conic-gradient(";
    participants.forEach((_, i) => {
      gradient += `${COC_COLORS[i % COC_COLORS.length]} ${i * sliceAngle}deg ${(i + 1) * sliceAngle}deg${i === participants.length - 1 ? "" : ", "}`;
    });
    return gradient + ")";
  };

  const spinWheel = () => {
    if (participants.length < 2 || isSpinning) {
       if (participants.length < 2) alert("Minimal harus ada 2 peserta untuk memutar undian!");
       return;
    }
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

  if (!isInitialized) {
    return (
      <div className="min-h-[100dvh] bg-[#050505] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-elixir animate-spin" />
      </div>
    );
  }

  const seasonOptions = [
    { label: "Sedang Berlangsung (Live)", value: "current" },
    ...availableSeasons.map(s => ({ label: formatSeason(s), value: s }))
  ];

  return (
    <div className="flex-1 w-full flex flex-col font-sans relative text-white selection:bg-gold selection:text-black">
      
      {/* FAB - PENGATURAN PESERTA (Melayang di atas Bottom Nav) */}
      <motion.button 
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsDrawerOpen(true)}
        className="fixed bottom-24 right-4 z-40 w-14 h-14 bg-gradient-to-br from-gold to-yellow-600 rounded-full shadow-[0_5px_20px_rgba(250,204,21,0.4)] flex items-center justify-center text-black border-2 border-[#121318]"
      >
        <Users className="w-6 h-6" />
        <span className="absolute -top-1 -right-1 w-5 h-5 bg-elixir rounded-full text-[10px] text-white font-bold flex items-center justify-center border-2 border-[#121318]">
          {participants.length > 99 ? '99+' : participants.length}
        </span>
      </motion.button>

      {/* AMBIENT BACKGROUND */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0 flex items-center justify-center">
        <div className="w-[300px] h-[300px] bg-blue-600/10 blur-[100px] rounded-full mix-blend-screen absolute -top-20 -left-20" />
        <div className="w-[300px] h-[300px] bg-purple-600/10 blur-[120px] rounded-full mix-blend-screen absolute -bottom-20 -right-20" />
      </div>

      {/* MAIN SPINNER AREA (FLEX GROW TO CENTER) */}
      <div className="flex-1 relative z-10 flex flex-col items-center justify-center px-4">
        
        {/* WHEEL CONTAINER */}
        <div className="relative w-full max-w-[320px] md:max-w-[450px] aspect-square perspective-1000">
          
          {/* POINTER */}
          <div className="absolute top-[-25px] left-1/2 -translate-x-1/2 z-30 drop-shadow-[0_5px_10px_rgba(0,0,0,0.8)]">
            <div className="relative">
               <div className="w-0 h-0 border-l-[14px] border-l-transparent border-r-[14px] border-r-transparent border-t-[35px] border-t-white relative z-10"></div>
               <div className="absolute top-0 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-t-[30px] border-t-gray-300 z-20"></div>
            </div>
          </div>

          {/* RODA SPINNER */}
          <motion.div 
            animate={{ 
              rotate: isSpinning ? rotation : (participants.length === 0 ? 360 : rotation)
            }}
            transition={{ 
              duration: isSpinning ? 7 : (participants.length === 0 ? 3 : 0), 
              ease: isSpinning ? [0.15, 0.9, 0.1, 1] : "linear",
              repeat: participants.length === 0 ? Infinity : 0
            }} 
            className={`w-full h-full rounded-full border-[10px] border-[#1a1c23] relative flex items-center justify-center overflow-hidden shadow-2xl ${participants.length === 0 ? 'animate-pulse shadow-[0_0_50px_rgba(255,0,0,0.5)]' : ''}`}
            style={{ background: generateConicGradient() }}
          >
            <div className="absolute inset-0 rounded-full border-[3px] border-white/20 z-10 mix-blend-overlay"></div>
            
            {/* TEXT ON SLICES */}
            {participants.map((name, i) => {
               if (participants.length > 50) return null;
               const sliceAngle = 360 / participants.length;
               const rotationAngle = (i * sliceAngle) + (sliceAngle / 2);
               return (
                 <div 
                   key={i} 
                   className="absolute w-[50%] h-6 left-[50%] origin-left flex items-center justify-end pr-8 text-white font-black tracking-wide drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] z-20" 
                   style={{ transform: `rotate(${rotationAngle - 90}deg)` }}
                 >
                   <span className="truncate max-w-[100px] text-xs">{name}</span>
                 </div>
               );
            })}
          </motion.div>
          
          {/* ANIMATED POINTER (KLIK SINI) */}
          <AnimatePresence>
            {participants.length >= 2 && !isSpinning && (
              <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: [0, -10, 0] }}
                exit={{ opacity: 0, scale: 0.5 }}
                transition={{ y: { repeat: Infinity, duration: 1, ease: "easeInOut" } }}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[85px] z-40 pointer-events-none"
              >
                <div className="bg-gold text-black text-xs font-black px-3 py-1.5 rounded-full shadow-[0_0_20px_rgba(250,204,21,0.8)] flex flex-col items-center">
                  <span>KLIK SINI!</span>
                  <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-gold absolute -bottom-1.5"></div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* CENTER DOT (SPIN BUTTON) */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30">
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.9 }}
              onClick={spinWheel}
              disabled={isSpinning || participants.length < 2}
              className="w-20 h-20 bg-gradient-to-br from-[#121318] to-[#0a0a0b] rounded-full border-[4px] border-gold shadow-[0_10px_25px_rgba(0,0,0,0.9)] flex items-center justify-center relative cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed group"
            >
              <div className="absolute inset-0 rounded-full border border-white/10 group-hover:bg-white/5 transition-colors"></div>
              <div className="flex flex-col items-center justify-center">
                {isSpinning ? (
                  <RefreshCw className="w-6 h-6 text-gold animate-spin" />
                ) : (
                  <>
                    <span className="text-gold font-black text-sm tracking-widest leading-none mt-1">SPIN</span>
                  </>
                )}
              </div>
            </motion.button>
          </div>
          
        </div>

      </div>



      {/* OPTIONS DRAWER */}
      <Drawer 
        isOpen={isDrawerOpen} 
        onClose={() => setIsDrawerOpen(false)} 
        title="Pengaturan Peserta"
      >
        <div className="flex flex-col h-[70vh] -mx-6 px-6 pb-6">
          
          {/* MANUAL INPUT */}
          <div className="flex-shrink-0 flex gap-2 mb-4 mt-2">
            <div className="flex-1">
              <Input 
                placeholder="Ketik nama manual..." 
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                leftIcon={<UserCircle className="w-4 h-4 text-gray-500" />}
              />
            </div>
            <Button onClick={handleAddParticipant} disabled={!inputValue.trim()} variant="gradient" className="px-4">
              <Plus className="w-5 h-5" />
            </Button>
          </div>

          {/* LIST OF PARTICIPANTS (SCROLLABLE) */}
          <div className="flex-1 overflow-y-auto mb-4 space-y-2 pr-2 custom-scrollbar">
            <AnimatePresence>
              {participants.length === 0 ? (
                <div className="flex flex-col items-center justify-center text-gray-500 text-sm text-center py-8">
                  <Users className="w-10 h-10 mb-2 opacity-30" />
                  <p>Daftar peserta kosong.</p>
                </div>
              ) : (
                participants.map((name, index) => (
                  <motion.div
                    key={`${name}-${index}`}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="flex items-center justify-between p-3 bg-white/5 border border-white/5 rounded-xl"
                  >
                    <span className="text-sm font-bold text-gray-200 truncate">{name}</span>
                    <button 
                      onClick={() => handleRemoveParticipant(index)} 
                      disabled={isSpinning}
                      className="p-1.5 text-gray-500 hover:text-red-400 bg-black/20 rounded-md transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>

          {/* CWL PULL (BOTTOM PINNED IN DRAWER) */}
          <div className="flex-shrink-0 border-t border-white/10 pt-4">
            <div className="bg-[#101216] border border-white/5 rounded-2xl p-4 shadow-inner">
              <div className="flex items-center gap-2 mb-3">
                 <Database className="w-4 h-4 text-gold" />
                 <h3 className="text-xs font-bold text-gray-300 uppercase tracking-widest">Tarik Data CWL</h3>
              </div>
              
              <div className="grid grid-cols-2 gap-3 mb-1">
                <div className="col-span-2">
                  <Select 
                    options={seasonOptions}
                    value={selectedSeason}
                    onChange={(val) => setSelectedSeason(String(val))}
                    disabled={role !== 'leader' || isLoadingApi || isLoadingSeasons}
                  />
                </div>
                <div className="col-span-1">
                  <Input 
                    type="number"
                    min={1}
                    max={50}
                    value={topN}
                    onChange={(e) => setTopN(Number(e.target.value))}
                    disabled={role !== 'leader' || isLoadingApi}
                    leftIcon={<Hash className="w-4 h-4 text-gray-500" />}
                  />
                </div>
                <div className="col-span-1">
                  <Button 
                    fullWidth 
                    variant="outline" 
                    onClick={fetchCwlTopN}
                    disabled={role !== 'leader' || isLoadingApi}
                    className="h-full border-gold/30 text-gold hover:bg-gold/10 hover:border-gold/50"
                  >
                    {isLoadingApi ? <Loader2 className="w-4 h-4 animate-spin" /> : "TARIK"}
                  </Button>
                </div>
              </div>
              {role !== 'leader' && (
                <p className="text-[10px] text-red-400 text-center font-medium mt-3 flex items-center justify-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> Hanya Leader yang dapat menarik data CWL.
                </p>
              )}
            </div>
          </div>
        </div>
      </Drawer>

      {/* WINNER MODAL */}
      <AnimatePresence>
        {winner && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/90 backdrop-blur-md px-4"
          >
            <motion.div 
              initial={{ scale: 0.5, y: 50, opacity: 0 }} 
              animate={{ scale: 1, y: 0, opacity: 1, transition: { type: "spring", bounce: 0.5 } }} 
              className="bg-gradient-to-br from-[#1a1c23] to-[#0a0a0b] border border-gold/30 p-8 rounded-[2rem] w-full max-w-sm text-center relative overflow-hidden shadow-[0_0_50px_rgba(250,204,21,0.2)]"
            >
              <Trophy className="w-24 h-24 text-gold mx-auto mb-4 drop-shadow-[0_0_15px_rgba(250,204,21,0.5)]" />
              <h3 className="text-gray-400 font-bold uppercase tracking-widest text-xs mb-1">Selamat Kepada</h3>
              <p className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white via-yellow-100 to-gold mb-8 truncate">{winner}</p>
              
              <div className="space-y-3 relative z-10">
                <Button variant="gradient" fullWidth onClick={() => setWinner(null)} className="py-4 text-sm tracking-widest">
                  TUTUP
                </Button>
                
                {user ? (
                  <p className="text-[10px] text-green-400 font-bold flex items-center justify-center gap-1 uppercase tracking-widest mt-2">
                    <CheckCircle2 className="w-3 h-3" /> Disimpan ke Riwayat
                  </p>
                ) : (
                  <Link href="/login" className="block text-[10px] text-gray-400 hover:text-white underline mt-2">
                    Login untuk simpan riwayat
                  </Link>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.1); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(250, 204, 21, 0.5); }
        .perspective-1000 { perspective: 1000px; }
      `}</style>
    </div>
  );
}
