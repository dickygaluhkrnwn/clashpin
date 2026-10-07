"use client";

import { useAuthStore } from "@/store/useAuthStore";
import { HeaderBar } from "./HeaderBar";
import { BottomNavBar } from "./BottomNavBar";
import { ToastProvider } from "@/components/ui/Toast";

export function MobileLayout({ children }: { children: React.ReactNode }) {
  const { user, isInitialized } = useAuthStore();

  // Selama auth belum selesai inisialisasi atau user belum login (sedang di Onboarding)
  // jangan tampilkan Bottom Navigation Bar dan Header.
  if (!isInitialized || !user) {
    return (
      <main 
        className="min-h-[100dvh] w-full bg-[#050505] flex flex-col relative"
        style={{
          paddingTop: 'env(safe-area-inset-top)',
          paddingBottom: 'env(safe-area-inset-bottom)'
        }}
      >
        {children}
        <ToastProvider />
      </main>
    );
  }

  return (
    <div className="relative min-h-[100dvh] w-full bg-[#050505] overflow-hidden flex flex-col font-sans">
      
      {/* TOP HEADER BAR (GLOBAL) */}
      <HeaderBar />

      {/* KONTEN UTAMA - Dengan padding top (header) dan bottom (nav) agar tidak tertutup */}
      <main 
        className="flex-1 w-full overflow-y-auto flex flex-col relative"
        style={{
          paddingTop: 'calc(64px + env(safe-area-inset-top))',
          paddingBottom: 'calc(80px + env(safe-area-inset-bottom))'
        }}
      >
        {children}
      </main>

      {/* BOTTOM NAVIGATION BAR */}
      <BottomNavBar />

      {/* TOAST NOTIFICATION PROVIDER */}
      <ToastProvider />
    </div>
  );
}
