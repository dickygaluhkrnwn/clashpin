"use client";

import { useEffect } from "react";
import { Loader2 } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { Onboarding } from "@/components/onboarding/Onboarding";
import { SpinnerWorkspace } from "@/components/workspace/SpinnerWorkspace";

export default function Home() {
  const { user, isInitialized, initAuth } = useAuthStore();

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  if (!isInitialized) {
    return (
      <div className="min-h-[100dvh] bg-[#050505] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-gold animate-spin" />
      </div>
    );
  }

  // Jika sudah login, tampilkan aplikasi Spinner. Jika belum, tampilkan Onboarding Promosi.
  return user ? <SpinnerWorkspace /> : <Onboarding />;
}
