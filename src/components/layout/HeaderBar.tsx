"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LogOut, Settings, ChevronDown, Download } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useToastStore } from "@/components/ui/Toast";

// Interface untuk event beforeinstallprompt
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export function HeaderBar() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logoutUser, clanTag } = useAuthStore();
  const { showToast } = useToastStore();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await logoutUser();
    setIsDropdownOpen(false);
    router.push("/login");
  };

  const handleInstallApp = async () => {
    setIsDropdownOpen(false);
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    } else {
      // Fallback untuk iOS/Safari atau jika aplikasi sudah terinstall
      showToast("Gunakan fitur 'Add to Home Screen' (Bagikan -> Tambahkan ke Layar Utama) di menu browser Anda.", "info");
    }
  };

  const getPageTitle = () => {
    switch (pathname) {
      case "/": return "Ruang Undian";
      case "/history": return "Riwayat Undian";
      case "/cwl": return "Data CWL";
      case "/stats": return "Statistik CWL";
      case "/profile": return "Profil Saya";
      default: return "Clashpin";
    }
  };

  if (!user) return null;

  return (
    <header className="fixed top-0 left-0 w-full h-[calc(4rem+env(safe-area-inset-top))] pt-[env(safe-area-inset-top)] bg-[#0f0f13]/80 backdrop-blur-2xl border-b border-white/10 shadow-lg shadow-black/50 z-[100] px-4 flex items-center justify-between">
      <div className="flex flex-col">
        <h1 className="text-lg font-black tracking-wide text-white">{getPageTitle()}</h1>
        {clanTag && <span className="text-[10px] text-gold font-mono uppercase tracking-widest">{clanTag}</span>}
      </div>

      <div className="relative" ref={dropdownRef}>
        <button 
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="flex items-center gap-2 p-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 transition-colors"
        >
          {user.photoURL ? (
            <img src={user.photoURL} alt="Avatar" className="w-8 h-8 rounded-full object-cover shadow-inner" />
          ) : (
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gold to-yellow-600 flex items-center justify-center shadow-inner">
              <span className="text-black font-bold text-xs uppercase">
                {user.displayName?.charAt(0) || "U"}
              </span>
            </div>
          )}
          <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isDropdownOpen ? "rotate-180" : ""}`} />
        </button>

        <AnimatePresence>
          {isDropdownOpen && (
            <motion.div 
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute top-full right-0 mt-3 w-48 bg-[#121318] border border-white/10 rounded-2xl shadow-2xl overflow-hidden py-2 z-[100] origin-top-right"
            >
              <div className="px-4 py-2 mb-2 border-b border-white/5">
                <p className="text-sm font-bold text-white truncate">{user.displayName}</p>
                <p className="text-xs text-gray-500 truncate">{user.email}</p>
              </div>
              
              <Link href="/profile" onClick={() => setIsDropdownOpen(false)} className="flex items-center gap-3 px-4 py-3 text-sm text-gray-300 hover:text-white hover:bg-white/5 transition-colors">
                <Settings className="w-4 h-4" />
                Pengaturan Klan
              </Link>
              
              <button onClick={handleInstallApp} className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-300 hover:text-white hover:bg-white/5 transition-colors text-left">
                <Download className="w-4 h-4" />
                Install Aplikasi
              </button>
              
              <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-400 hover:text-red-300 hover:bg-red-400/10 transition-colors text-left">
                <LogOut className="w-4 h-4" />
                Keluar
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
}
