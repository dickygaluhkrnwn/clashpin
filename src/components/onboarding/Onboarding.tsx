"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, Dices, Trophy, Users } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";

const ONBOARDING_SLIDES = [
  {
    id: 1,
    title: "Selamat Datang di Clashpin",
    description: "Platform undian e-sports yang didesain khusus untuk klan profesional.",
    icon: Dices,
    color: "text-gold"
  },
  {
    id: 2,
    title: "Tarik Data CWL Otomatis",
    description: "Terintegrasi langsung dengan API Supercell. Tidak perlu lagi input nama manual satu per satu.",
    icon: Users,
    color: "text-elixir"
  },
  {
    id: 3,
    title: "Adil & Transparan",
    description: "Riwayat putaran roda disimpan permanen dan dapat dilihat oleh seluruh member klan.",
    icon: Trophy,
    color: "text-blue-400"
  }
];

export function Onboarding() {
  const [currentSlide, setCurrentSlide] = useState(0);

  const handleNext = () => {
    if (currentSlide < ONBOARDING_SLIDES.length - 1) {
      setCurrentSlide(prev => prev + 1);
    }
  };

  const slide = ONBOARDING_SLIDES[currentSlide];
  const Icon = slide.icon;

  return (
    <div className="h-full bg-[#050505] text-white flex flex-col items-center justify-center relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[300px] h-[300px] bg-elixir/10 blur-[100px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[400px] h-[400px] bg-gold/10 blur-[120px] rounded-full pointer-events-none" />
      
      {/* Slides Content */}
      <div className="flex-1 w-full flex flex-col items-center justify-center p-8 relative z-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col items-center text-center max-w-sm"
          >
            <div className="w-32 h-32 mb-8 bg-white/5 border border-white/10 rounded-full flex items-center justify-center shadow-[0_0_50px_rgba(255,255,255,0.05)]">
              <Icon className={`w-16 h-16 ${slide.color}`} />
            </div>
            <h1 className="text-2xl font-black mb-4 tracking-wide">{slide.title}</h1>
            <p className="text-gray-400 text-sm leading-relaxed font-medium">
              {slide.description}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Pagination & Actions */}
      <div className="w-full px-8 pb-12 flex flex-col items-center z-10">
        {/* Dots */}
        <div className="flex gap-2 mb-8">
          {ONBOARDING_SLIDES.map((_, idx) => (
            <div 
              key={idx}
              className={`h-2 rounded-full transition-all duration-300 ${
                idx === currentSlide ? "w-8 bg-gold" : "w-2 bg-white/20"
              }`}
            />
          ))}
        </div>

        {/* Buttons */}
        <div className="w-full max-w-sm space-y-4">
          {currentSlide < ONBOARDING_SLIDES.length - 1 ? (
            <>
              <Button variant="gradient" fullWidth onClick={handleNext} className="py-4 font-bold tracking-widest rounded-2xl">
                LANJUTKAN
              </Button>
              <div className="text-center mt-4">
                <Link href="/login" className="text-sm font-bold text-gray-500 hover:text-white transition-colors uppercase tracking-widest">
                  Lewati
                </Link>
              </div>
            </>
          ) : (
            <Link href="/login" className="w-full block">
              <Button variant="gradient" fullWidth className="py-4 font-black tracking-widest rounded-2xl shadow-[0_10px_30px_rgba(250,204,21,0.2)]">
                MULAI SEKARANG
              </Button>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
