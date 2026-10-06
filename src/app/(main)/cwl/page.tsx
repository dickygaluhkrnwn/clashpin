"use client";

import { useState, useEffect } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { Loader2, ShieldAlert, Star, Flame, Calendar, Users, AlertTriangle, ShieldCheck, Trophy, Medal } from "lucide-react";
import { Select } from "@/components/ui/Select";
import { Drawer } from "@/components/ui/Drawer";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { ChevronRight, Swords, Shield, RefreshCw } from "lucide-react";
import { useToastStore } from "@/components/ui/Toast";

interface ClanMemberStats {
  tag: string;
  name: string;
  townhallLevel: number;
  stars: number;
  destruction: number;
  missedAttacks: number;
  roundsPlayed: number;
}

interface RoundMember {
  tag: string;
  name: string;
  attacks?: { attackerTag: string; defenderTag: string; stars: number; destructionPercentage: number }[];
}

interface RoundStat {
  result: 'WIN' | 'LOSS' | 'TIE';
  myClan: { name: string; stars: number; destruction: number; attacks: number; members: RoundMember[] };
  opponent: { name: string; stars: number; destruction: number; attacks: number; members: RoundMember[] };
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

export default function ClanDashboard() {
  const { clanTag, clanId, isInitialized, initAuth } = useAuthStore();
  const [members, setMembers] = useState<ClanMemberStats[]>([]);
  const [rounds, setRounds] = useState<RoundStat[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  const [selectedRound, setSelectedRound] = useState<{ round: RoundStat; idx: number } | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isRosterDrawerOpen, setIsRosterDrawerOpen] = useState(false);
  
  const [selectedSeason, setSelectedSeason] = useState<string>("current");
  const [availableSeasons, setAvailableSeasons] = useState<string[]>([]);
  const [isLoadingSeasons, setIsLoadingSeasons] = useState(false);
  
  const [isSyncing, setIsSyncing] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const { showToast } = useToastStore();

  useEffect(() => { initAuth(); }, [initAuth]);

  // Fetch available seasons
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
  }, [clanId, refreshTrigger]);

  // Fetch clan members stats for selected season
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
  }, [isInitialized, clanTag, clanId, selectedSeason, refreshTrigger]);


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
      
      {/* FILTER & SYNC SECTION */}
      <div className="px-4 pt-6 pb-2 flex-shrink-0 relative z-50">
        <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-4 mb-2 shadow-sm flex flex-col gap-4">
          <div className="flex items-center justify-between">
             <div className="flex items-center gap-2">
               <Calendar className="w-4 h-4 text-gold" />
               <h3 className="text-xs font-bold text-gray-300 uppercase tracking-widest">Pilih Musim CWL</h3>
             </div>
          </div>
          <Select 
            options={seasonOptions}
            value={selectedSeason}
            onChange={(val) => setSelectedSeason(String(val))}
            disabled={isLoading || isLoadingSeasons || isSyncing}
          />
        </div>
      </div>

      {/* MEMBER LIST */}
      <div className="flex-1 overflow-y-auto px-4 pb-6 flex flex-col custom-scrollbar relative">
        {isLoading ? (
          <div className="flex-1 flex flex-col items-center justify-center">
            <Loader2 className="w-8 h-8 text-elixir animate-spin mb-4" />
            <p className="text-xs text-gray-400 uppercase tracking-widest font-bold animate-pulse">Memuat Data Pasukan...</p>
          </div>
        ) : members.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center">
            <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-4">
               <Users className="w-10 h-10 text-gray-600" />
            </div>
            <h3 className="text-lg font-bold text-white mb-1">Tidak Ada Data</h3>
            <p className="text-xs text-gray-400 max-w-[250px]">Tidak ada catatan CWL untuk season ini.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between px-2 mb-1">
              <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest flex items-center gap-1"><ShieldCheck className="w-3 h-3"/> Roster CWL ({members.length})</span>
            </div>
            
            <AnimatePresence>
              {members.slice(0, 3).map((member, idx) => {
                // Rank Styling
                let rankStyle = "bg-white/[0.03] border-white/5";
                let rankLabel = null;
                
                if (idx === 0) {
                  rankStyle = "bg-gradient-to-br from-yellow-500/20 to-yellow-700/5 border-yellow-500/50 shadow-[0_0_15px_rgba(234,179,8,0.2)] scale-[1.02] z-10";
                  rankLabel = <div className="absolute -top-3 -right-3 w-10 h-10 bg-yellow-500 rounded-full flex items-center justify-center border-4 border-[#050505] shadow-lg rotate-12"><Trophy className="w-4 h-4 text-black" fill="currentColor" /></div>;
                } else if (idx === 1) {
                  rankStyle = "bg-gradient-to-br from-gray-300/20 to-gray-500/5 border-gray-300/50 shadow-[0_0_10px_rgba(209,213,219,0.1)]";
                  rankLabel = <div className="absolute -top-2 -right-2 w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center border-2 border-[#050505] shadow-lg"><Medal className="w-4 h-4 text-black" fill="currentColor" /></div>;
                } else if (idx === 2) {
                  rankStyle = "bg-gradient-to-br from-amber-700/30 to-amber-900/10 border-amber-600/50 shadow-[0_0_10px_rgba(180,83,9,0.1)]";
                  rankLabel = <div className="absolute -top-2 -right-2 w-8 h-8 bg-amber-600 rounded-full flex items-center justify-center border-2 border-[#050505] shadow-lg"><Medal className="w-4 h-4 text-black" fill="currentColor" /></div>;
                }

                if (member.missedAttacks > 0) {
                  rankStyle = "bg-red-950/20 border-red-500/30";
                }

                return (
                  <motion.div 
                    key={member.tag}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.03 }}
                    className={`relative p-4 rounded-2xl border ${rankStyle} flex flex-col gap-3 overflow-hidden`}
                  >
                    {rankLabel}

                    {/* MISSED ATTACK WARNING GLOW */}
                    {member.missedAttacks > 0 && (
                       <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 blur-[30px] rounded-full pointer-events-none" />
                    )}

                    <div className="flex items-start justify-between relative z-10">
                      <div className="flex flex-col pr-8">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className={`font-black text-lg leading-none ${idx === 0 ? 'text-yellow-400' : idx === 1 ? 'text-gray-200' : idx === 2 ? 'text-amber-500' : 'text-white'}`}>{member.name}</h3>
                          <span className="text-[10px] text-gray-500 font-mono tracking-widest">{member.tag}</span>
                        </div>
                      </div>
                      <div className="bg-[#121318] border border-white/10 px-2 py-1 rounded-lg flex flex-col items-center justify-center min-w-[40px]">
                        <span className="text-[9px] text-gray-400 font-bold uppercase">TH</span>
                        <span className="text-sm font-black text-white">{member.townhallLevel || "?"}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 relative z-10 border-t border-white/5 pt-3">
                      <div className="flex flex-col items-center justify-center bg-black/20 rounded-xl py-2">
                        <Star className="w-4 h-4 text-gold mb-1" />
                        <span className="text-sm font-black text-white leading-none">{member.stars}</span>
                        <span className="text-[8px] text-gray-500 font-bold uppercase tracking-widest mt-1">Stars</span>
                      </div>
                      <div className="flex flex-col items-center justify-center bg-black/20 rounded-xl py-2">
                        <Flame className="w-4 h-4 text-orange-400 mb-1" />
                        <span className="text-sm font-black text-white leading-none">{Math.round(member.destruction)}%</span>
                        <span className="text-[8px] text-gray-500 font-bold uppercase tracking-widest mt-1">Destruct</span>
                      </div>
                      <div className="flex flex-col items-center justify-center bg-black/20 rounded-xl py-2">
                        <ShieldCheck className="w-4 h-4 text-blue-400 mb-1" />
                        <span className="text-sm font-black text-white leading-none">{member.roundsPlayed}</span>
                        <span className="text-[8px] text-gray-500 font-bold uppercase tracking-widest mt-1">Rounds</span>
                      </div>
                    </div>

                    {member.missedAttacks > 0 && (
                      <div className="mt-1 bg-red-500/10 border border-red-500/20 rounded-xl p-2.5 flex items-center justify-center gap-2 relative z-10">
                        <AlertTriangle className="w-4 h-4 text-red-500 animate-pulse" />
                        <span className="text-xs font-bold text-red-500 uppercase tracking-wider">Bolos Serang: {member.missedAttacks}x</span>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </AnimatePresence>
            
            {members.length > 3 && (
              <Button 
                onClick={() => setIsRosterDrawerOpen(true)}
                variant="outline" 
                className="w-full mt-2 rounded-2xl border-white/10 hover:bg-white/5 h-12 text-xs tracking-widest font-bold uppercase"
              >
                Lihat Full Roster ({members.length})
              </Button>
            )}
            
            {/* ROUND BY ROUND HISTORY */}
            {rounds.length > 0 && (
              <div className="mt-8 flex flex-col gap-3">
                <div className="flex items-center gap-2 px-1 mb-1">
                   <Calendar className="w-4 h-4 text-gold" />
                   <h3 className="text-xs font-bold text-gray-300 uppercase tracking-widest">Detail Match Per Hari</h3>
                </div>
                
                {rounds.map((r, idx) => (
                  <motion.div 
                    key={`round-${idx}`}
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + (idx * 0.05) }}
                    onClick={() => { setSelectedRound({ round: r, idx }); setIsDrawerOpen(true); }}
                    whileTap={{ scale: 0.98 }}
                    className={`bg-white/[0.02] border rounded-2xl p-4 flex flex-col gap-3 relative overflow-hidden cursor-pointer hover:bg-white/5 transition-colors ${
                      r.result === 'WIN' ? 'border-green-500/30' : r.result === 'LOSS' ? 'border-red-500/30' : 'border-gray-500/30'
                    }`}
                  >
                    {/* Hasil Badge */}
                    <div className={`absolute top-0 right-0 px-3 py-1 rounded-bl-xl text-[9px] font-black tracking-widest uppercase ${
                      r.result === 'WIN' ? 'bg-green-500/20 text-green-400' : r.result === 'LOSS' ? 'bg-red-500/20 text-red-400' : 'bg-gray-500/20 text-gray-400'
                    }`}>
                      {r.result}
                    </div>
                    
                    <h4 className="text-xs font-bold text-gray-400 tracking-wider">Round {idx + 1}</h4>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex flex-col">
                        <span className="font-black text-sm mb-2 truncate max-w-[120px]" title={r.myClan.name}>{r.myClan.name}</span>
                        <div className="flex items-center gap-2 mb-1">
                          <Star className="w-3.5 h-3.5 text-gold" fill="currentColor"/> 
                          <span className="text-xs font-bold text-white">{r.myClan.stars}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Flame className="w-3.5 h-3.5 text-orange-400"/> 
                          <span className="text-[10px] font-medium text-gray-400">{r.myClan.destruction.toFixed(1)}%</span>
                        </div>
                      </div>
                      
                      <div className="flex flex-col items-end text-right">
                        <span className="font-black text-sm mb-2 truncate max-w-[120px] text-gray-400" title={r.opponent.name}>{r.opponent.name}</span>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-bold text-gray-300">{r.opponent.stars}</span>
                          <Star className="w-3.5 h-3.5 text-gray-500" fill="currentColor"/> 
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-medium text-gray-500">{r.opponent.destruction.toFixed(1)}%</span>
                          <Flame className="w-3.5 h-3.5 text-gray-600"/> 
                        </div>
                      </div>
                    </div>

                    <div className="absolute top-1/2 -right-1 -translate-y-1/2 opacity-30">
                       <ChevronRight className="w-5 h-5" />
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
            
            <div className="h-4"></div>
          </div>
        )}
      </div>

      {/* DETAIL ROUND DRAWER */}
      <Drawer 
        isOpen={isDrawerOpen} 
        onClose={() => setIsDrawerOpen(false)} 
        title={selectedRound ? `Detail Round ${selectedRound.idx + 1}` : "Detail Match"}
      >
        <div className="flex flex-col h-[70vh] -mx-6 px-6 pb-6">
          {selectedRound && (
            <>
              {/* HEADER MATCH (Modal) */}
              <div className="flex-shrink-0 flex items-center justify-between p-4 bg-[#121318] border border-white/5 rounded-2xl mb-4">
                <div className="flex flex-col">
                  <span className="font-black text-sm text-white mb-1 truncate max-w-[120px]">{selectedRound.round.myClan.name}</span>
                  <div className="flex items-center gap-2">
                    <Star className="w-3.5 h-3.5 text-gold" fill="currentColor"/> <span className="text-xs font-bold text-white">{selectedRound.round.myClan.stars}</span>
                  </div>
                </div>
                
                <div className={`px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase ${
                  selectedRound.round.result === 'WIN' ? 'bg-green-500/20 text-green-400' : selectedRound.round.result === 'LOSS' ? 'bg-red-500/20 text-red-400' : 'bg-gray-500/20 text-gray-400'
                }`}>
                  {selectedRound.round.result}
                </div>

                <div className="flex flex-col items-end text-right">
                  <span className="font-black text-sm text-gray-400 mb-1 truncate max-w-[120px]">{selectedRound.round.opponent.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-gray-400">{selectedRound.round.opponent.stars}</span> <Star className="w-3.5 h-3.5 text-gray-500" fill="currentColor"/>
                  </div>
                </div>
              </div>

              {/* LOG SERANGAN & PERTAHANAN */}
              <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar pr-2 pb-10">
                <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest px-1">Log Serangan & Pertahanan</h3>
                
                {selectedRound.round.myClan.members
                  .sort((a, b) => (b.attacks?.[0]?.stars || 0) - (a.attacks?.[0]?.stars || 0))
                  .map((m, i) => {
                    // Cari Serangan (Offense)
                    const atk = m.attacks?.[0];
                    let enemyDefenderName = "Base Lawan";
                    if (atk) {
                      const def = selectedRound.round.opponent.members.find(e => e.tag === atk.defenderTag);
                      if (def) enemyDefenderName = def.name;
                    }

                    // Cari Pertahanan (Defense)
                    let defAtk: any = null;
                    let enemyAttackerName = "Belum Diserang";
                    for (const enemy of selectedRound.round.opponent.members) {
                      const foundAtk = enemy.attacks?.find(a => a.defenderTag === m.tag);
                      if (foundAtk) {
                        defAtk = foundAtk;
                        enemyAttackerName = enemy.name;
                        break;
                      }
                    }

                    return (
                      <div key={i} className="flex flex-col bg-white/[0.02] border border-white/5 rounded-xl overflow-hidden">
                        <div className="px-3 py-2 bg-white/5 border-b border-white/5 flex items-center justify-between">
                          <span className="text-sm font-bold text-white">{m.name}</span>
                          {(!atk) && <span className="text-[9px] font-bold text-red-500 uppercase tracking-widest bg-red-500/10 px-2 py-0.5 rounded-full border border-red-500/20">Bolos Serang</span>}
                        </div>
                        
                        <div className="p-3 grid grid-cols-2 gap-3 divide-x divide-white/10">
                          {/* KOLOM KIRI: OFFENSE */}
                          <div className="flex flex-col pr-2">
                             <div className="flex items-center gap-1 mb-1.5 opacity-60">
                               <Swords className="w-3 h-3 text-blue-400" />
                               <span className="text-[9px] font-bold text-blue-400 uppercase tracking-widest">Offense</span>
                             </div>
                             {atk ? (
                               <div className="flex flex-col">
                                 <span className="text-[10px] text-gray-400 truncate mb-1" title={enemyDefenderName}>vs {enemyDefenderName}</span>
                                 <div className="flex items-center gap-3">
                                    <div className="flex items-center gap-1">
                                       <Star className="w-3.5 h-3.5 text-gold" fill="currentColor" />
                                       <span className="font-black text-white text-sm">{atk.stars}</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                       <Flame className="w-3 h-3 text-orange-400" />
                                       <span className="text-[10px] font-bold text-gray-400">{Math.round(atk.destructionPercentage)}%</span>
                                    </div>
                                 </div>
                               </div>
                             ) : (
                               <div className="flex items-center gap-1 mt-1">
                                 <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
                                 <span className="text-[10px] text-red-400 font-medium">Tidak Menyerang</span>
                               </div>
                             )}
                          </div>

                          {/* KOLOM KANAN: DEFENSE */}
                          <div className="flex flex-col pl-3">
                             <div className="flex items-center gap-1 mb-1.5 opacity-60">
                               <Shield className="w-3 h-3 text-purple-400" />
                               <span className="text-[9px] font-bold text-purple-400 uppercase tracking-widest">Defense</span>
                             </div>
                             {defAtk ? (
                               <div className="flex flex-col">
                                 <span className="text-[10px] text-gray-400 truncate mb-1" title={enemyAttackerName}>Dihajar: {enemyAttackerName}</span>
                                 <div className="flex items-center gap-3">
                                    <div className="flex items-center gap-1">
                                       <Star className="w-3.5 h-3.5 text-gray-500" fill="currentColor" />
                                       <span className="font-black text-gray-300 text-sm">-{defAtk.stars}</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                       <Flame className="w-3 h-3 text-gray-600" />
                                       <span className="text-[10px] font-bold text-gray-500">-{Math.round(defAtk.destructionPercentage)}%</span>
                                    </div>
                                 </div>
                               </div>
                             ) : (
                               <span className="text-[10px] text-gray-500 italic mt-1">Belum Diserang</span>
                             )}
                          </div>
                        </div>
                      </div>
                    );
                })}
              </div>
            </>
          )}
        </div>
      </Drawer>

      {/* FULL ROSTER DRAWER */}
      <Drawer 
        isOpen={isRosterDrawerOpen} 
        onClose={() => setIsRosterDrawerOpen(false)} 
        title="Full Roster CWL"
      >
        <div className="flex flex-col h-[70vh] -mx-6 px-6 pb-6 overflow-y-auto custom-scrollbar">
          <div className="flex flex-col gap-3">
            {members.map((member, idx) => {
                let rankStyle = "bg-white/[0.03] border-white/5";
                let rankLabel = null;
                
                if (idx === 0) {
                  rankStyle = "bg-gradient-to-br from-yellow-500/20 to-yellow-700/5 border-yellow-500/50 shadow-[0_0_15px_rgba(234,179,8,0.2)]";
                  rankLabel = <div className="absolute -top-3 -right-3 w-10 h-10 bg-yellow-500 rounded-full flex items-center justify-center border-4 border-[#050505] shadow-lg rotate-12"><Trophy className="w-4 h-4 text-black" fill="currentColor" /></div>;
                } else if (idx === 1) {
                  rankStyle = "bg-gradient-to-br from-gray-300/20 to-gray-500/5 border-gray-300/50 shadow-[0_0_10px_rgba(209,213,219,0.1)]";
                  rankLabel = <div className="absolute -top-2 -right-2 w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center border-2 border-[#050505] shadow-lg"><Medal className="w-4 h-4 text-black" fill="currentColor" /></div>;
                } else if (idx === 2) {
                  rankStyle = "bg-gradient-to-br from-amber-700/30 to-amber-900/10 border-amber-600/50 shadow-[0_0_10px_rgba(180,83,9,0.1)]";
                  rankLabel = <div className="absolute -top-2 -right-2 w-8 h-8 bg-amber-600 rounded-full flex items-center justify-center border-2 border-[#050505] shadow-lg"><Medal className="w-4 h-4 text-black" fill="currentColor" /></div>;
                }

                if (member.missedAttacks > 0) {
                  rankStyle = "bg-red-950/20 border-red-500/30";
                }

                return (
                  <div key={`full-${member.tag}`} className={`relative p-4 rounded-2xl border ${rankStyle} flex flex-col gap-3 overflow-hidden`}>
                    {rankLabel}
                    <div className="flex items-start justify-between relative z-10">
                      <div className="flex flex-col pr-8">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-gray-500 font-black">#{idx + 1}</span>
                          <h3 className={`font-black text-lg leading-none ${idx === 0 ? 'text-yellow-400' : idx === 1 ? 'text-gray-200' : idx === 2 ? 'text-amber-500' : 'text-white'}`}>{member.name}</h3>
                        </div>
                        <span className="text-[10px] text-gray-500 font-mono tracking-widest">{member.tag}</span>
                      </div>
                      <div className="bg-[#121318] border border-white/10 px-2 py-1 rounded-lg flex flex-col items-center justify-center min-w-[40px]">
                        <span className="text-[9px] text-gray-400 font-bold uppercase">TH</span>
                        <span className="text-sm font-black text-white">{member.townhallLevel || "?"}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 relative z-10 border-t border-white/5 pt-3">
                      <div className="flex flex-col items-center justify-center bg-black/20 rounded-xl py-2">
                        <Star className="w-4 h-4 text-gold mb-1" />
                        <span className="text-sm font-black text-white leading-none">{member.stars}</span>
                      </div>
                      <div className="flex flex-col items-center justify-center bg-black/20 rounded-xl py-2">
                        <Flame className="w-4 h-4 text-orange-400 mb-1" />
                        <span className="text-sm font-black text-white leading-none">{Math.round(member.destruction)}%</span>
                      </div>
                      <div className="flex flex-col items-center justify-center bg-black/20 rounded-xl py-2">
                        <ShieldCheck className="w-4 h-4 text-blue-400 mb-1" />
                        <span className="text-sm font-black text-white leading-none">{member.roundsPlayed}</span>
                      </div>
                    </div>

                    {member.missedAttacks > 0 && (
                      <div className="mt-1 bg-red-500/10 border border-red-500/20 rounded-xl p-2.5 flex items-center justify-center gap-2 relative z-10">
                        <AlertTriangle className="w-4 h-4 text-red-500" />
                        <span className="text-xs font-bold text-red-500 uppercase tracking-wider">Bolos Serang: {member.missedAttacks}x</span>
                      </div>
                    )}
                  </div>
                );
            })}
          </div>
        </div>
      </Drawer>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.1); border-radius: 10px; }
      `}</style>
    </div>
  );
}
