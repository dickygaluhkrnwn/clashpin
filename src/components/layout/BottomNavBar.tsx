"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Home, Clock, Shield, BarChart2, User } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";

const MENUS = [
  { path: "/", label: "Beranda", icon: Home, color: "text-gold" },
  { path: "/history", label: "Riwayat", icon: Clock, color: "text-blue-400" },
  { path: "/cwl", label: "Data CWL", icon: Shield, color: "text-elixir" },
  { path: "/stats", label: "Statistik", icon: BarChart2, color: "text-green-400" },
  { path: "/profile", label: "Profil", icon: User, color: "text-purple-400" },
];

export function BottomNavBar() {
  const pathname = usePathname();
  const { user } = useAuthStore();

  if (!user) return null;

  return (
    <div className="fixed bottom-0 left-0 w-full z-50 px-4 pb-safe-4 pt-2 bg-gradient-to-t from-[#050505] via-[#050505]/95 to-transparent border-t border-white/5 backdrop-blur-md">
      <nav className="flex items-center justify-between max-w-md mx-auto">
        {MENUS.map((menu) => {
          const isActive = pathname === menu.path;
          const Icon = menu.icon;

          return (
            <Link 
              key={menu.path} 
              href={menu.path}
              className="relative flex flex-col items-center justify-center w-16 h-14"
            >
              {/* Animasi Indikator Aktif */}
              {isActive && (
                <motion.div
                  layoutId="active-nav-indicator"
                  className="absolute inset-0 bg-white/5 rounded-2xl border border-white/10"
                  initial={false}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}

              {/* Ikon */}
              <div className="relative z-10 flex flex-col items-center gap-1">
                <Icon 
                  className={`w-5 h-5 transition-all duration-300 ${
                    isActive ? menu.color : "text-gray-500 opacity-60 hover:opacity-100"
                  }`}
                  strokeWidth={isActive ? 2.5 : 2}
                />
                
                {/* Label hanya muncul kalau aktif (efek dinamis mobile app native) */}
                <motion.span
                  initial={false}
                  animate={{ 
                    height: isActive ? "auto" : 0, 
                    opacity: isActive ? 1 : 0,
                    marginTop: isActive ? 4 : 0
                  }}
                  className={`text-[9px] font-bold uppercase tracking-wider ${isActive ? menu.color : "text-gray-500"}`}
                >
                  {isActive ? menu.label : ""}
                </motion.span>
              </div>

              {/* Glow/Bayangan Aktif di belakang ikon */}
              {isActive && (
                <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full blur-[10px] opacity-20 bg-current ${menu.color}`} />
              )}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
