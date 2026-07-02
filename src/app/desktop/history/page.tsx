"use client";

import { useState, useEffect, Fragment } from "react";
import Link from "next/link";
import { ArrowLeft, Trophy, Calendar, Users, User, History, ChevronDown, ChevronUp, Loader2, RefreshCw } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";

interface HistoryItem {
  id: string;
  tournamentName: string;
  winner: string;
  participants: string[];
  totalParticipants: number;
  createdBy: string;
  createdAt: string;
}

export default function HistoryDashboard() {
  const { clanTag, role, isInitialized, initAuth } = useAuthStore();
  const [historyList, setHistoryData] = useState<HistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  // Tarik data riwayat undian klan dari API
  useEffect(() => {
    const fetchHistory = async () => {
      if (clanTag) {
        setIsLoading(true);
        try {
          const res = await fetch(`/api/giveaway/history?clanTag=${encodeURIComponent(clanTag)}`);
          if (res.ok) {
            const data = await res.json();
            setHistoryData(data.history || []);
          }
        } catch (error) {
          console.error("Gagal memuat riwayat:", error);
        } finally {
          setIsLoading(false);
        }
      }
    };
    if (isInitialized && clanTag) {
      fetchHistory();
    }
  }, [isInitialized, clanTag]);

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  if (!isInitialized || isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
        <Loader2 className="w-10 h-10 text-gold animate-spin mb-4" />
        <p className="text-gray-400 font-mono tracking-widest uppercase text-sm">Membuka Arsip Undian...</p>
      </div>
    );
  }

  if (role !== 'leader') {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
        <History className="w-16 h-16 text-gray-500 mb-4 opacity-30" />
        <h2 className="text-xl font-bold text-white mb-2">Akses Terkunci</h2>
        <p className="text-gray-400 mb-6 text-center max-w-sm">Hanya Leader atau Co-Leader terverifikasi klan yang dapat melihat rekap riwayat undian.</p>
        <Link href="/desktop/spinner">
          <button className="px-6 py-3 bg-white text-black rounded-xl font-bold transition hover:bg-gray-200">Kembali ke Spinner</button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6 relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-gold/5 blur-[150px] rounded-full pointer-events-none z-0" />

      <div className="max-w-5xl mx-auto relative z-10">
        
        {/* HEADER */}
        <header className="w-full flex items-center gap-4 bg-white/5 border border-white/10 backdrop-blur-md rounded-2xl px-6 py-4 mb-8">
          <Link href="/desktop/spinner" className="p-2 bg-white/5 hover:bg-white/10 rounded-xl transition-colors text-gray-400 hover:text-white">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="h-6 w-[1px] bg-white/10"></div>
          <div>
            <h1 className="text-xl font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <History className="w-5 h-5 text-gold" /> Log Riwayat Clashpin
            </h1>
            <p className="text-xs text-gray-400">Rekapitulasi pemenang giveaway untuk klan {clanTag}</p>
          </div>
        </header>

        {/* LOG DATA TABLE / CARDS */}
        {historyList.length === 0 ? (
          <div className="bg-black/30 border border-white/5 border-dashed rounded-3xl p-12 text-center flex flex-col items-center justify-center">
            <Trophy className="w-16 h-16 text-gray-600 mb-4 opacity-40" />
            <h3 className="text-lg font-bold text-white mb-1">Belum Ada Riwayat</h3>
            <p className="text-sm text-gray-400 max-w-sm">Anda belum pernah menyimpan hasil putaran roda spinner di klan ini.</p>
          </div>
        ) : (
          <div className="bg-black/40 border border-white/5 rounded-3xl overflow-hidden shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-white/[0.02] border-b border-white/5 text-[10px] font-bold uppercase tracking-widest text-gold">
                    <th className="px-6 py-4">Nama Acara / Turnamen</th>
                    <th className="px-6 py-4">Pemenang</th>
                    <th className="px-6 py-4 text-center">Jumlah Peserta</th>
                    <th className="px-6 py-4">Waktu Diundi</th>
                    <th className="px-6 py-4 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-sm">
                  {historyList.map((item) => {
                    const isExpanded = expandedId === item.id;
                    return (
                      // PERBAIKAN: Gunakan Fragment untuk mensejajarkan dua baris (tr)
                      <Fragment key={item.id}>
                        <tr className="hover:bg-white/[0.01] transition-colors group">
                          <td className="px-6 py-4 font-medium text-white">
                            {item.tournamentName}
                            <div className="text-[10px] text-gray-500 font-mono mt-0.5 flex items-center gap-1">
                              <User className="w-3 h-3" /> Oleh: {item.createdBy}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-gold/10 text-gold font-bold border border-gold/20 shadow-[0_0_10px_rgba(250,204,21,0.1)]">
                              <Trophy className="w-3.5 h-3.5" /> {item.winner}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center font-mono font-semibold text-gray-300">
                            {item.totalParticipants} Orang
                          </td>
                          <td className="px-6 py-4 text-gray-400 text-xs font-mono">
                            {new Date(item.createdAt).toLocaleDateString('id-ID', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })} WIB
                          </td>
                          <td className="px-6 py-4 text-center">
                            <button 
                              onClick={() => toggleExpand(item.id)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg transition-all border border-white/5"
                            >
                              {isExpanded ? (
                                <>Sembunyikan <ChevronUp className="w-3.5 h-3.5" /></>
                              ) : (
                                <>Cek Peserta <ChevronDown className="w-3.5 h-3.5" /></>
                              )}
                            </button>
                          </td>
                        </tr>
                        
                        {/* SUB ROW: SEKARANG MENJADI SIBLING, BUKAN CHILD */}
                        {isExpanded && (
                          <tr className="bg-black/60 shadow-inner">
                            <td colSpan={5} className="px-8 py-4 border-t border-b border-white/5">
                              <div className="space-y-2 animate-in fade-in duration-200">
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                                  <Users className="w-3.5 h-3.5 text-elixir" /> Daftar Seluruh Peserta Undian:
                                </p>
                                <div className="flex flex-wrap gap-2 pt-1">
                                  {item.participants.map((p, idx) => (
                                    <span 
                                      key={`${p}-${idx}`} 
                                      className={`px-3 py-1 rounded-lg text-xs font-medium border ${
                                        p === item.winner 
                                          ? 'bg-gold/20 text-gold border-gold/40 font-bold' 
                                          : 'bg-white/5 text-gray-300 border-white/5'
                                      }`}
                                    >
                                      {p} {p === item.winner && "🏆"}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}