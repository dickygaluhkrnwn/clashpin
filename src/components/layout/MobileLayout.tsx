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
      <main className="bg-[#050505]">
        {children}
        <ToastProvider />
      </main>
    );
  }

  return (
    <div className="relative min-h-screen w-full bg-[#050505] font-sans flex flex-col">
      
      {/* TOP HEADER BAR (GLOBAL) */}
      <HeaderBar />

      {/* KONTEN UTAMA - Dengan padding top (header) dan bottom (nav) agar tidak tertutup */}
      <main 
        className="flex-1 w-full relative flex flex-col"
        style={{
          paddingTop: 'calc(4rem + env(safe-area-inset-top))',
          paddingBottom: 'calc(5rem + env(safe-area-inset-bottom))'
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
