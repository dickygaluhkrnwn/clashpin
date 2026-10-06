"use client";

import { useState, useEffect, useMemo } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { Loader2, ShieldAlert, Star, Flame, Calendar, AlertTriangle, TrendingUp, Target, Users, ShieldCheck, ChevronRight, Swords, Shield, BarChart, ArrowUpRight, ArrowDownRight, Activity } from "lucide-react";
import { Select } from "@/components/ui/Select";
import { Drawer } from "@/components/ui/Drawer";
import { motion } from "framer-motion";
import Link from "next/link";
import { Button } from "@/components/ui/Button";

interface ClanMemberStats {
  tag: string;
  name: string;
  townhallLevel: number;
  stars: number;
  destruction: number;
  missedAttacks: number;
  roundsPlayed: number;
}

interface RoundStat {
  result: 'WIN' | 'LOSS' | 'TIE';
  myClan: { name: string; stars: number; destruction: number; attacks: number };
  opponent: { name: string; stars: number; destruction: number; attacks: number };
}

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

export default function StatsDashboard() {
  const { clanTag, clanId, isInitialized, initAuth } = useAuthStore();
  const [members, setMembers] = useState<ClanMemberStats[]>([]);
  const [rounds, setRounds] = useState<RoundStat[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  const [selectedSeason, setSelectedSeason] = useState<string>("current");
  const [availableSeasons, setAvailableSeasons] = useState<string[]>([]);
  const [isLoadingSeasons, setIsLoadingSeasons] = useState(false);

  useEffect(() => { initAuth(); }, [initAuth]);

  useEffect(() => {
    const fetchSeasons = async () => {
      if (clanId) {
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
  }, [clanId]);

  useEffect(() => {
    const fetchMembers = async () => {
      if (clanTag && clanId) {
        setIsLoading(true);
        try {
          const res = await fetch(`/api/clan/members?clanTag=${encodeURIComponent(clanTag)}&clanId=${encodeURIComponent(clanId)}&season=${selectedSeason}`);
          if (res.ok) {
            const data = await res.json();
            setMembers(data.members || []);
            setRounds(data.rounds || []);
          } else {
            setMembers([]);
            setRounds([]);
          }
        } catch (error) {
          console.error("Gagal memuat data anggota:", error);
          setMembers([]);
          setRounds([]);
        } finally {
          setIsLoading(false);
        }
      }
    };
    if (isInitialized && clanTag && clanId) {
      fetchMembers();
    }
  }, [isInitialized, clanTag, clanId, selectedSeason]);

  // Aggregated Stats & Analytics
  const analytics = useMemo(() => {
    let tStars = 0;
    let tMissed = 0;
    let tAttacks = 0;
    let tDestruct = 0;
    let wCount = 0;
    let lCount = 0;
    
    // Roster Evaluation
    const evalList = [...members];
    // Sort by best performance (stars, then destruction)
    evalList.sort((a, b) => {
      if (b.stars !== a.stars) return b.stars - a.stars;
      return b.destruction - a.destruction;
    });

    const topPerformers = evalList.filter(m => m.roundsPlayed > 0).slice(0, 3);
    
    // Sort for worst performers (high missed attacks, or lowest stars/attack ratio)
    const worstPerformers = [...evalList].filter(m => m.roundsPlayed > 0).sort((a, b) => {
      // Prioritaskan yang paling banyak bolos serang
      if (b.missedAttacks !== a.missedAttacks) return b.missedAttacks - a.missedAttacks;
      // Lalu yang paling sedikit bintangnya (rasio)
      const aRatio = a.roundsPlayed - a.missedAttacks > 0 ? a.stars / (a.roundsPlayed - a.missedAttacks) : 0;
      const bRatio = b.roundsPlayed - b.missedAttacks > 0 ? b.stars / (b.roundsPlayed - b.missedAttacks) : 0;
      return aRatio - bRatio;
    }).slice(0, 3);

    // TH Analysis
    const thStats: Record<number, { count: number, totalStars: number, attacks: number }> = {};

    members.forEach(m => {
      tStars += m.stars;
      tMissed += m.missedAttacks;
      const attacked = m.roundsPlayed - m.missedAttacks;
      tAttacks += attacked;
      tDestruct += m.destruction;

      if (m.townhallLevel && m.roundsPlayed > 0) {
        if (!thStats[m.townhallLevel]) thStats[m.townhallLevel] = { count: 0, totalStars: 0, attacks: 0 };
        thStats[m.townhallLevel].count += 1;
        thStats[m.townhallLevel].totalStars += m.stars;
        thStats[m.townhallLevel].attacks += attacked;
      }
    });

    rounds.forEach(r => {
      if (r.result === 'WIN') wCount++;
      else if (r.result === 'LOSS') lCount++;
    });

    const avgD = tAttacks > 0 ? (tDestruct / tAttacks).toFixed(1) : "0.0";

    const thAnalytics = Object.entries(thStats)
      .map(([th, stats]) => ({
        th: parseInt(th),
        players: stats.count,
        avgStars: stats.attacks > 0 ? (stats.totalStars / stats.attacks).toFixed(1) : "0.0"
      }))
      .sort((a, b) => b.th - a.th);

    return {
      totalStars: tStars,
      totalMissed: tMissed,
      totalAttacks: tAttacks,
      avgDestruction: avgD,
      winCount: wCount,
      lossCount: lCount,
      topPerformers,
      worstPerformers,
      thAnalytics
    };
  }, [members, rounds]);

  if (!isInitialized) {
    return (
      <div className="min-h-[100dvh] bg-[#050505] flex flex-col items-center justify-center">
        <Loader2 className="w-10 h-10 text-gold animate-spin" />
      </div>
    );
  }

  if (!clanTag || !clanId) {
    return (
      <div className="h-full flex-1 flex flex-col items-center justify-center px-6 selection:bg-gold selection:text-black">
        <ShieldAlert className="w-20 h-20 text-red-500 mb-6 opacity-80" />
        <h2 className="text-xl font-bold text-white mb-2 text-center">Klan Belum Terhubung</h2>
        <p className="text-gray-400 mb-8 text-center text-sm">Silakan hubungkan atau verifikasi klan Anda di halaman Profil terlebih dahulu.</p>
        <Link href="/profile" className="w-full max-w-xs">
           <Button variant="primary" fullWidth>Ke Halaman Profil</Button>
        </Link>
      </div>
    );
  }

  const seasonOptions = [
    { label: "Season Terbaru", value: "current" },
    ...availableSeasons.map(s => ({ label: formatSeason(s), value: s }))
  ];

  return (
    <div className="h-full flex-1 w-full text-white font-sans flex flex-col overflow-hidden selection:bg-gold selection:text-black">
      
      {/* FILTER SECTION */}
      <div className="px-4 pt-6 pb-2 flex-shrink-0 relative z-50">
        <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-4 mb-2 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
             <TrendingUp className="w-4 h-4 text-elixir" />
             <h3 className="text-xs font-bold text-gray-300 uppercase tracking-widest">Analisis Performa CWL</h3>
          </div>
          <Select 
            options={seasonOptions}
            value={selectedSeason}
            onChange={(val) => setSelectedSeason(String(val))}
            disabled={isLoading || isLoadingSeasons}
          />
        </div>
      </div>

      {/* DASHBOARD CONTENT */}
      <div className="flex-1 overflow-y-auto px-4 pb-6 flex flex-col custom-scrollbar relative z-10">
        {isLoading ? (
          <div className="flex-1 flex flex-col items-center justify-center">
            <Loader2 className="w-8 h-8 text-elixir animate-spin mb-4" />
            <p className="text-xs text-gray-400 uppercase tracking-widest font-bold animate-pulse">Menghitung Statistik...</p>
          </div>
        ) : members.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center">
            <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-4">
               <TrendingUp className="w-10 h-10 text-gray-600" />
            </div>
            <h3 className="text-lg font-bold text-white mb-1">Tidak Ada Data</h3>
            <p className="text-xs text-gray-400 max-w-[250px]">Tidak ada catatan CWL untuk season ini.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            
            {/* RINGKASAN MUSIM */}
            <div className="grid grid-cols-2 gap-3 mb-2">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-gradient-to-br from-gold/20 to-[#0a0a0c] border border-gold/30 rounded-2xl p-4 relative overflow-hidden flex flex-col items-center justify-center text-center col-span-2"
              >
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-gold/10 blur-[50px] rounded-full pointer-events-none" />
                <Star className="w-10 h-10 text-gold mb-1 drop-shadow-[0_0_15px_rgba(250,204,21,0.6)]" fill="currentColor" />
                <p className="text-[10px] font-bold text-gold/80 uppercase tracking-widest mb-1">Total Bintang Klan</p>
                <h2 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white via-yellow-100 to-gold">{analytics.totalStars}</h2>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white/[0.03] border border-white/5 rounded-2xl p-4 flex flex-col items-center text-center">
                <Target className="w-6 h-6 text-blue-400 mb-1 opacity-80" />
                <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">Serangan</p>
                <p className="text-2xl font-black text-white">{analytics.totalAttacks}</p>
              </motion.div>
              
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="bg-white/[0.03] border border-white/5 rounded-2xl p-4 flex flex-col items-center text-center">
                <Flame className="w-6 h-6 text-orange-500 mb-1 opacity-80" />
                <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">Avg Hancur</p>
                <p className="text-2xl font-black text-white">{analytics.avgDestruction}%</p>
              </motion.div>
            </div>

            {/* WIN LOSS RECORD */}
            {rounds.length > 0 && (
              <div className="flex gap-2 mb-2">
                 <div className="flex-1 bg-green-500/10 border border-green-500/20 rounded-xl p-3 flex flex-col items-center">
                    <span className="text-xl font-black text-green-400">{analytics.winCount}</span>
                    <span className="text-[9px] font-bold text-green-500/80 uppercase tracking-widest mt-0.5">Win</span>
                 </div>
                 <div className="flex-1 bg-red-500/10 border border-red-500/20 rounded-xl p-3 flex flex-col items-center">
                    <span className="text-xl font-black text-red-400">{analytics.lossCount}</span>
                    <span className="text-[9px] font-bold text-red-500/80 uppercase tracking-widest mt-0.5">Loss</span>
                 </div>
              </div>
            )}

            {/* GRAFIK TREN BINTANG (Round by Round) */}
            {rounds.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 flex flex-col gap-4 mb-2">
                <div className="flex items-center gap-2">
                   <Activity className="w-4 h-4 text-blue-400" />
                   <h3 className="text-xs font-bold text-gray-300 uppercase tracking-widest">Tren Performa Harian</h3>
                </div>
                
                <div className="flex justify-between h-32 mt-2 px-1 gap-1 border-b border-white/10 pb-2 relative">
                  {/* Grid Lines (Latar Belakang) */}
                  <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-10 pb-2">
                     <div className="w-full border-b border-white border-dashed"></div>
                     <div className="w-full border-b border-white border-dashed"></div>
                     <div className="w-full border-b border-white border-dashed"></div>
                  </div>

                  {rounds.map((r, i) => {
                    const myStars = r.myClan.stars || 0;
                    const oppStars = r.opponent.stars || 0;
                    const maxStars = Math.max(45, ...rounds.map(ro => Math.max(ro.myClan.stars || 0, ro.opponent.stars || 0)));
                    const myHeight = Math.max(5, (myStars / maxStars) * 100);
                    const oppHeight = Math.max(5, (oppStars / maxStars) * 100);
                    
                    return (
                      <div key={i} className="flex flex-col items-center flex-1 h-full gap-1 z-10 group">
                        {/* Bars container */}
                        <div className="flex items-end justify-center w-full gap-0.5 h-full relative">
                          {/* tooltip on hover */}
                          <div className="absolute -top-8 bg-black/80 text-[9px] px-2 py-1 rounded hidden group-hover:flex whitespace-nowrap border border-white/10 z-20">
                            Kita: {myStars} | Lawan: {oppStars}
                          </div>
                          
                          {/* Our Clan Bar */}
                          <div 
                            style={{ height: `${myHeight}%` }}
                            className={`w-1/2 max-w-[12px] rounded-t-sm transition-all duration-1000 ${r.result === 'WIN' ? 'bg-gold' : r.result === 'TIE' ? 'bg-gray-400' : 'bg-red-400'}`}
                          />
                          {/* Opponent Bar */}
                          <div 
                            style={{ height: `${oppHeight}%` }}
                            className="w-1/2 max-w-[12px] rounded-t-sm bg-white/20 transition-all duration-1000"
                          />
                        </div>
                        <span className="text-[8px] font-bold text-gray-500">R{i+1}</span>
                      </div>
                    );
                  })}
                </div>
                <div className="flex justify-center gap-4 text-[9px] font-bold uppercase tracking-widest text-gray-500">
                  <div className="flex items-center gap-1"><div className="w-2 h-2 bg-gold rounded-sm"></div> Klan Kita</div>
                  <div className="flex items-center gap-1"><div className="w-2 h-2 bg-white/20 rounded-sm"></div> Lawan</div>
                </div>
              </motion.div>
            )}

            {/* ANALISIS TOWN HALL */}
            {analytics.thAnalytics.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 flex flex-col gap-3 mb-2">
                <div className="flex items-center gap-2 mb-1">
                   <BarChart className="w-4 h-4 text-purple-400" />
                   <h3 className="text-xs font-bold text-gray-300 uppercase tracking-widest">Kekuatan Berdasarkan TH</h3>
                </div>
                <div className="flex flex-col gap-2">
                  {analytics.thAnalytics.map((tha, i) => (
                    <div key={i} className="flex items-center justify-between bg-black/20 p-2 rounded-lg border border-white/5">
                       <div className="flex items-center gap-3">
                         <div className="bg-purple-500/20 text-purple-400 px-2 py-1 rounded text-xs font-black">TH {tha.th}</div>
                         <span className="text-[10px] text-gray-400 font-bold">{tha.players} Pasukan</span>
                       </div>
                       <div className="flex items-center gap-1">
                         <Star className="w-3.5 h-3.5 text-gold" fill="currentColor"/>
                         <span className="text-sm font-black text-white">{tha.avgStars} <span className="text-[9px] text-gray-500 font-normal">avg</span></span>
                       </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* EVALUASI ROSTER (Keputusan Leader) */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="grid grid-cols-2 gap-3 mb-2">
               {/* KOLOM PROMOSI (TOP 3) */}
               <div className="bg-green-500/5 border border-green-500/20 rounded-2xl p-3 flex flex-col gap-3">
                  <div className="flex items-center gap-1.5 border-b border-green-500/20 pb-2">
                     <ArrowUpRight className="w-4 h-4 text-green-400" />
                     <h3 className="text-[10px] font-bold text-green-400 uppercase tracking-widest leading-tight">Rekomendasi<br/>Pertahankan</h3>
                  </div>
                  <div className="flex flex-col gap-2">
                    {analytics.topPerformers.map((m, i) => (
                      <div key={i} className="flex flex-col">
                        <span className="text-xs font-black text-white truncate">{m.name}</span>
                        <div className="flex items-center gap-1 text-[10px] text-gray-400">
                          <Star className="w-3 h-3 text-gold" fill="currentColor"/> {m.stars} ({Math.round(m.destruction)}%)
                        </div>
                      </div>
                    ))}
                  </div>
               </div>

               {/* KOLOM DEGRADASI (WORST 3) */}
               <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-3 flex flex-col gap-3">
                  <div className="flex items-center gap-1.5 border-b border-red-500/20 pb-2">
                     <ArrowDownRight className="w-4 h-4 text-red-400" />
                     <h3 className="text-[10px] font-bold text-red-400 uppercase tracking-widest leading-tight">Zona Bahaya<br/>(Evaluasi)</h3>
                  </div>
                  <div className="flex flex-col gap-2">
                    {analytics.worstPerformers.map((m, i) => (
                      <div key={i} className="flex flex-col">
                        <span className="text-xs font-black text-red-100 truncate">{m.name}</span>
                        {m.missedAttacks > 0 ? (
                          <div className="flex items-center gap-1 text-[10px] text-red-400 font-bold">
                            <AlertTriangle className="w-3 h-3"/> Bolos {m.missedAttacks}x
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 text-[10px] text-gray-400">
                            <Star className="w-3 h-3 text-gray-500" fill="currentColor"/> {m.stars} bintang
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
               </div>
            </motion.div>

            <div className="h-4"></div> {/* Spacer bottom */}
          </div>
        )}
      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.1); border-radius: 10px; }
      `}</style>
    </div>
  );
}
