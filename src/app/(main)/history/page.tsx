"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { Trophy, Calendar, Users, User, History, ChevronRight, Loader2, Shield, Trash2 } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/Table";
import { Pagination } from "@/components/ui/Pagination";
import { Drawer } from "@/components/ui/Drawer";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";

interface HistoryItem {
  id: string;
  tournamentName: string;
  winner: string;
  participants: string[];
  totalParticipants: number;
  createdBy: string;
  createdAt: string;
}

const ITEMS_PER_PAGE = 8;

export default function HistoryDashboard() {
  const { clanTag, role, isInitialized, initAuth } = useAuthStore();
  const [historyList, setHistoryData] = useState<HistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  
  // Detail Drawer State
  const [selectedItem, setSelectedItem] = useState<HistoryItem | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  
  // Delete Modal State
  const [historyToDelete, setHistoryToDelete] = useState<string | null>(null);

  useEffect(() => { initAuth(); }, [initAuth]);

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

  // Derived state for pagination
  const totalPages = Math.ceil(historyList.length / ITEMS_PER_PAGE);
  const currentData = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return historyList.slice(start, start + ITEMS_PER_PAGE);
  }, [historyList, currentPage]);

  const openDetail = (item: HistoryItem) => {
    setSelectedItem(item);
    setIsDrawerOpen(true);
  };

  const confirmDelete = (id: string) => {
    setHistoryToDelete(id);
  };

  const deleteHistory = async () => {
    if (!historyToDelete) return;
    
    try {
      const res = await fetch(`/api/giveaway/history?id=${encodeURIComponent(historyToDelete)}`, { method: 'DELETE' });
      if (res.ok) {
        setHistoryData(prev => prev.filter(h => h.id !== historyToDelete));
        setIsDrawerOpen(false);
        setHistoryToDelete(null);
      } else {
        alert("Gagal menghapus riwayat.");
      }
    } catch (err) {
      console.error(err);
      alert("Terjadi kesalahan sistem saat menghapus.");
    }
  };

  if (!isInitialized || isLoading) {
    return (
      <div className="min-h-[100dvh] bg-[#050505] flex flex-col items-center justify-center">
        <Loader2 className="w-10 h-10 text-gold animate-spin" />
      </div>
    );
  }

  if (role !== 'leader') {
    return (
      <div className="min-h-[100dvh] bg-[#050505] flex flex-col items-center justify-center px-6 selection:bg-gold selection:text-black">
        <Shield className="w-20 h-20 text-red-500 mb-6 opacity-80" />
        <h2 className="text-xl font-bold text-white mb-2">Akses Terkunci</h2>
        <p className="text-gray-400 mb-8 text-center text-sm">Hanya Leader yang dapat melihat riwayat undian klan.</p>
        <Link href="/" className="w-full max-w-xs">
           <button className="w-full bg-white text-black font-bold py-3.5 rounded-full hover:bg-gray-200 transition-colors">Kembali ke Spinner</button>
        </Link>
      </div>
    );
  }

  return (
    <div className="h-full flex-1 w-full text-white font-sans flex flex-col overflow-hidden selection:bg-gold selection:text-black">

      <div className="flex-1 overflow-y-auto px-4 pt-6 pb-6 flex flex-col max-w-2xl mx-auto w-full custom-scrollbar">
        
        {historyList.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center">
            <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-4">
               <History className="w-10 h-10 text-gray-500" />
            </div>
            <h3 className="text-lg font-bold text-white mb-1">Belum Ada Riwayat</h3>
            <p className="text-xs text-gray-400 max-w-[250px]">Riwayat putaran roda spinner klan akan muncul di sini.</p>
          </div>
        ) : (
          <div className="flex flex-col flex-1 h-full">
            <Table className="bg-transparent border-none">
              <TableHeader className="bg-transparent border-none">
                <TableRow className="border-b border-white/10 hover:bg-transparent">
                  <TableHead className="w-[60%] pl-1 text-gray-500">Informasi Acara</TableHead>
                  <TableHead className="text-right pr-1 text-gray-500">Pemenang</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentData.map((item) => (
                  <TableRow 
                    key={item.id} 
                    onClick={() => openDetail(item)}
                    className="cursor-pointer active:bg-white/5 border-b border-white/5 last:border-0"
                  >
                    <TableCell className="pl-1 py-4">
                      <div className="flex flex-col gap-1">
                        <span className="font-bold text-sm text-gray-200 line-clamp-1">{item.tournamentName}</span>
                        <div className="flex items-center gap-3 text-[10px] text-gray-500 font-mono">
                          <span className="flex items-center gap-1"><Calendar className="w-3 h-3"/> {new Date(item.createdAt).toLocaleDateString('id-ID', { month: 'short', day: 'numeric' })}</span>
                          <span className="flex items-center gap-1"><Users className="w-3 h-3"/> {item.totalParticipants}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right pr-1 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <div className="flex flex-col items-end">
                           <span className="text-[9px] text-gold/70 font-black uppercase tracking-widest">Winner</span>
                           <span className="text-sm font-bold text-gold max-w-[90px] truncate">{item.winner}</span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-gray-600 flex-shrink-0" />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <div className="mt-8 pt-4 border-t border-white/5 pb-safe-4 flex-shrink-0 flex items-center justify-center">
              <Pagination 
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            </div>
          </div>
        )}
      </div>

      {/* DETAIL DRAWER */}
      <Drawer 
        isOpen={isDrawerOpen} 
        onClose={() => setIsDrawerOpen(false)}
        title="Detail Riwayat"
      >
        {selectedItem && (
          <div className="flex flex-col px-6 pb-6 -mx-6 h-[75vh] overflow-hidden">
            {/* WINNER HERO */}
            <div className="flex-shrink-0 bg-gradient-to-br from-gold/20 to-yellow-600/5 border border-gold/20 rounded-3xl p-6 flex flex-col items-center justify-center text-center mb-5 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gold/10 blur-[50px] rounded-full pointer-events-none" />
              <Trophy className="w-16 h-16 text-gold mb-3 drop-shadow-[0_0_15px_rgba(250,204,21,0.5)] relative z-10" />
              <p className="text-[10px] font-black text-gold/70 uppercase tracking-widest mb-1 relative z-10">Pemenang Utama</p>
              <h2 className="text-2xl font-black text-white relative z-10">{selectedItem.winner}</h2>
            </div>

            {/* EVENT INFO */}
            <div className="flex-shrink-0 grid grid-cols-2 gap-3 mb-5">
               <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-4 flex flex-col justify-center">
                 <p className="text-[10px] text-gray-500 font-bold uppercase mb-1">Turnamen</p>
                 <p className="text-xs font-bold text-gray-200 line-clamp-2">{selectedItem.tournamentName}</p>
               </div>
               <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-4 flex flex-col justify-center">
                 <p className="text-[10px] text-gray-500 font-bold uppercase mb-1">Waktu Diundi</p>
                 <p className="text-xs font-bold text-gray-200">
                   {new Date(selectedItem.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}<br/>
                   <span className="text-gray-400 font-mono text-[10px]">{new Date(selectedItem.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB</span>
                 </p>
               </div>
               <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-4 flex flex-col justify-center">
                 <p className="text-[10px] text-gray-500 font-bold uppercase mb-1">Pengundi</p>
                 <p className="text-xs font-bold text-gray-200 flex items-center gap-1.5"><User className="w-3.5 h-3.5 text-blue-400" /> {selectedItem.createdBy}</p>
               </div>
               <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-4 flex flex-col justify-center">
                 <p className="text-[10px] text-gray-500 font-bold uppercase mb-1">Total Peserta</p>
                 <p className="text-xs font-bold text-gray-200 flex items-center gap-1.5"><Users className="w-3.5 h-3.5 text-elixir" /> {selectedItem.totalParticipants} Orang</p>
               </div>
            </div>

            {/* PARTICIPANTS LIST */}
            <div className="flex-1 overflow-hidden flex flex-col">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 flex-shrink-0">Semua Peserta</h3>
              <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 flex flex-wrap gap-2 content-start pb-4">
                {selectedItem.participants.map((p, idx) => (
                  <span 
                    key={idx}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold border ${
                      p === selectedItem.winner 
                        ? 'bg-gold/10 text-gold border-gold/30' 
                        : 'bg-white/5 text-gray-300 border-white/5'
                    }`}
                  >
                    {p} {p === selectedItem.winner && "🏆"}
                  </span>
                ))}
              </div>
            </div>
            
            {/* DELETE ACTION */}
            <div className="flex-shrink-0 mt-4 flex justify-end">
               <button 
                 onClick={() => confirmDelete(selectedItem.id)}
                 className="flex items-center gap-2 bg-red-500/10 text-red-500 px-4 py-2 rounded-xl hover:bg-red-500/20 transition-colors font-bold text-xs uppercase tracking-widest border border-red-500/20"
               >
                 <Trash2 className="w-4 h-4" /> Hapus Riwayat
               </button>
            </div>
          </div>
        )}
      </Drawer>

      {/* CONFIRM DELETE MODAL */}
      <Modal 
        isOpen={!!historyToDelete} 
        onClose={() => setHistoryToDelete(null)}
        title="Hapus Riwayat"
        maxWidth="sm"
      >
        <div className="flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-4 border border-red-500/20">
            <Trash2 className="w-8 h-8 text-red-500" />
          </div>
          <p className="text-gray-300 text-sm mb-6">
            Yakin ingin menghapus riwayat undian ini? Data yang dihapus tidak dapat dikembalikan.
          </p>
          <div className="flex w-full gap-3">
            <Button 
              variant="outline" 
              fullWidth 
              onClick={() => setHistoryToDelete(null)}
            >
              Batal
            </Button>
            <Button 
              variant="outline" 
              fullWidth 
              onClick={deleteHistory}
              className="!bg-red-600 hover:!bg-red-700 !text-white !border-none"
            >
              Hapus
            </Button>
          </div>
        </div>
      </Modal>
      
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.1); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(250, 204, 21, 0.5); }
      `}</style>
    </div>
  );
}