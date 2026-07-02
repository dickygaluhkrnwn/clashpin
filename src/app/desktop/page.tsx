"use client";

import { useEffect } from "react";
import { motion, Variants } from "framer-motion";
import { Swords, Dices, LogIn, ChevronRight, Zap, Shield, Sparkles, UserCircle, Play, Key, Database, Disc, FileCheck } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useAuthStore } from "@/store/useAuthStore";

export default function DesktopHome() {
  const { user, isInitialized, initAuth } = useAuthStore();

  // Pulihkan sesi login agar navbar tahu status user saat ini
  useEffect(() => {
    initAuth();
  }, [initAuth]);

  // Varian Animasi untuk efek bertahap (Stagger)
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.15 } }
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 30 },
    show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 100, damping: 15 } }
  };

  return (
    <div className="relative w-full min-h-screen bg-[#050505] text-white overflow-x-hidden selection:bg-gold selection:text-black font-sans scroll-smooth">
      
      {/* --- AMBIENT BACKGROUND GLOWS --- */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <motion.div 
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }} 
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-elixir/20 blur-[150px] rounded-full mix-blend-screen" 
        />
        <motion.div 
          animate={{ scale: [1, 1.3, 1], opacity: [0.2, 0.4, 0.2] }} 
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-gold/15 blur-[150px] rounded-full mix-blend-screen" 
        />
        <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-[0.03] bg-repeat" />
      </div>

      {/* --- NAVBAR ALA DISCORD / GAMING LAUNCHER --- */}
      <nav className="fixed top-0 left-0 w-full z-50 border-b border-white/5 bg-black/30 backdrop-blur-xl transition-all">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          
          {/* LOGO KIRI (DIPERBESAR & PRIORITY) */}
          <Link href="/desktop" className="flex items-center gap-4 group">
            <Image 
              src="/logo.png" 
              alt="Clashpin Logo" 
              width={60} 
              height={60} 
              priority
              className="rounded-xl drop-shadow-[0_0_15px_rgba(250,204,21,0.4)] group-hover:drop-shadow-[0_0_25px_rgba(250,204,21,0.8)] group-hover:scale-105 transition-all duration-300"
            />
            <span className="text-2xl md:text-3xl font-black tracking-wider uppercase bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400 mt-1">
              CLASH<span className="text-gold">PIN</span>
            </span>
          </Link>

          {/* Navigasi Tengah */}
          <div className="hidden md:flex items-center gap-8 font-medium text-sm text-gray-400">
            <Link href="#features" className="hover:text-white transition-colors">Fitur</Link>
            <Link href="#how-it-works" className="hover:text-white transition-colors">Cara Kerja</Link>
            <Link href="#" className="hover:text-white transition-colors">Komunitas</Link>
          </div>

          {/* Action Kanan (Login / Profil) */}
          <div className="flex items-center gap-4">
            {!isInitialized ? (
              <div className="w-24 h-10 bg-white/5 rounded-xl animate-pulse" />
            ) : user ? (
              <Link href="/desktop/spinner" className="flex items-center gap-3 px-2 py-1.5 pr-4 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 transition-all group">
                {user.photoURL ? (
                  <img src={user.photoURL} alt="Profile" className="w-8 h-8 rounded-full border border-white/20 group-hover:border-gold transition-colors" />
                ) : (
                  <UserCircle className="w-8 h-8 text-gray-400 group-hover:text-gold transition-colors" />
                )}
                <span className="text-sm font-bold text-white hidden sm:block">Buka Aplikasi</span>
              </Link>
            ) : (
              <Link href="/desktop/login" className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-white hover:bg-gray-200 text-black text-sm font-bold transition-transform hover:-translate-y-0.5 shadow-[0_0_15px_rgba(255,255,255,0.2)]">
                <LogIn className="w-4 h-4" /> Masuk
              </Link>
            )}
          </div>
        </div>
      </nav>

      {/* --- HERO SECTION --- */}
      <main className="relative z-10 w-full max-w-7xl px-6 pt-40 pb-10 mx-auto flex flex-col items-center text-center">
        
        <motion.div 
          initial={{ opacity: 0, y: -20, scale: 0.8 }} 
          animate={{ opacity: 1, y: 0, scale: 1 }} 
          transition={{ duration: 0.6, type: "spring" }} 
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-md mb-8 shadow-lg"
        >
          <Sparkles className="w-4 h-4 text-gold animate-pulse" />
          <span className="text-xs font-bold text-gray-300 tracking-widest uppercase">Bagian dari Clashub Ecosystem</span>
        </motion.div>

        <motion.h1 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ duration: 0.8, delay: 0.1 }} 
          className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter mb-6 leading-tight"
        >
          <span className="text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-500">Putar Takdir </span>
          <br className="md:hidden" />
          <span className="relative inline-block">
            <span className="relative z-10 text-transparent bg-clip-text bg-gradient-to-r from-gold via-yellow-400 to-yellow-600 drop-shadow-[0_0_30px_rgba(250,204,21,0.4)]">
              Klan Anda.
            </span>
            <svg className="absolute w-full h-4 -bottom-1 left-0 z-0 text-gold/30" viewBox="0 0 100 10" preserveAspectRatio="none">
              <path d="M0 5 Q 50 10 100 5" stroke="currentColor" strokeWidth="2" fill="transparent" />
            </svg>
          </span>
        </motion.h1>

        <motion.p 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          transition={{ duration: 0.8, delay: 0.3 }} 
          className="text-base md:text-xl text-gray-400 max-w-2xl mb-12 font-medium leading-relaxed"
        >
          Platform undian E-Sports profesional. Terintegrasi langsung dengan API Supercell untuk menarik data Perang & CWL secara otomatis, adil, dan transparan.
        </motion.p>

        {/* HERO ACTION BUTTONS */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ duration: 0.8, delay: 0.4 }} 
          className="flex flex-col sm:flex-row items-center gap-6"
        >
          <Link href={user ? "/desktop/spinner" : "/desktop/login"} className="group relative w-full sm:w-auto">
            <div className="absolute -inset-1 bg-gradient-to-r from-elixir via-purple-500 to-gold rounded-2xl blur opacity-40 group-hover:opacity-100 transition duration-500 group-hover:duration-200"></div>
            <button className="relative w-full flex items-center justify-center gap-3 px-8 py-4 bg-black rounded-xl text-white font-black text-lg uppercase tracking-wider border border-white/10 transition-all hover:scale-[1.02] active:scale-95">
              <Play className="w-5 h-5 text-gold fill-gold" />
              {user ? 'Luncurkan Workspace' : 'Mulai Sekarang'}
            </button>
          </Link>

          <Link href="/desktop/spinner" className="group w-full sm:w-auto">
            <button className="relative w-full flex items-center justify-center gap-3 px-8 py-4 bg-white/5 hover:bg-white/10 rounded-xl text-gray-300 hover:text-white font-bold text-lg border border-white/10 transition-all hover:scale-[1.02] active:scale-95">
              <Dices className="w-5 h-5" />
              Mode Tamu
              <ChevronRight className="w-5 h-5 opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
            </button>
          </Link>
        </motion.div>

        {/* --- 3D ORB / SPINNER VISUAL MOCKUP --- */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.8, rotateX: 45 }}
          animate={{ opacity: 1, scale: 1, rotateX: 0 }}
          transition={{ duration: 1, delay: 0.5, type: "spring" }}
          className="mt-20 relative w-full max-w-3xl aspect-[2/1] perspective-1000"
        >
          <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-transparent z-20 pointer-events-none" />
          
          <div className="w-full h-full border border-white/10 rounded-t-full bg-black/40 backdrop-blur-md shadow-[0_-20px_50px_rgba(250,204,21,0.1)] relative overflow-hidden flex items-end justify-center pb-10">
            <motion.div 
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className="w-[400px] h-[400px] rounded-full absolute bottom-[-200px] border-[10px] border-white/5 shadow-[0_0_100px_rgba(217,70,239,0.2)]"
              style={{
                background: 'conic-gradient(from 0deg, #facc15, #d946ef, #3b82f6, #10b981, #facc15)'
              }}
            >
              <div className="absolute inset-2 bg-black rounded-full" />
            </motion.div>
            <div className="relative z-10 px-6 py-2 bg-black/80 border border-gold/30 rounded-full text-gold font-bold tracking-widest text-sm uppercase shadow-[0_0_20px_rgba(250,204,21,0.3)]">
              Real-Time Spinner
            </div>
          </div>
        </motion.div>

        {/* --- FEATURES GRID --- */}
        <motion.div 
          id="features"
          variants={containerVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-100px" }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full mt-10 relative z-20"
        >
          {[
            { icon: Zap, color: "text-blue-400 text-shadow-blue", bg: "bg-blue-500/10", border: "border-blue-500/20", title: "Otomatisasi Penuh", desc: "Tarik data perang reguler dan CWL klan Anda langsung dari server Supercell secara akurat." },
            { icon: Shield, color: "text-green-400 text-shadow-green", bg: "bg-green-500/10", border: "border-green-500/20", title: "Integritas Data", desc: "Semua hasil putaran diabadikan secara permanen di server. 100% adil dan bebas manipulasi." },
            { icon: Swords, color: "text-elixir text-shadow-elixir", bg: "bg-elixir/10", border: "border-elixir/20", title: "Mode Fleksibel", desc: "Undi hingga puluhan nama sekaligus. Mendukung input manual untuk event komunitas." }
          ].map((feature, idx) => (
            <motion.div 
              key={idx} 
              variants={itemVariants} 
              whileHover={{ y: -5, scale: 1.02 }}
              className={`group p-8 rounded-3xl bg-[#0a0a0b]/80 border ${feature.border} hover:bg-white/[0.03] transition-all duration-300 backdrop-blur-xl text-left shadow-lg`}
            >
              <div className={`w-14 h-14 rounded-2xl ${feature.bg} flex items-center justify-center mb-6 border ${feature.border} group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300`}>
                <feature.icon className={`w-7 h-7 ${feature.color}`} />
              </div>
              <h3 className="text-xl font-bold text-white mb-3 tracking-wide">{feature.title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed font-medium">{feature.desc}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* --- HOW IT WORKS SECTION --- */}
        <motion.div 
          id="how-it-works"
          variants={containerVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-100px" }}
          className="w-full mt-40 pt-10 border-t border-white/5 relative z-20 text-left"
        >
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-black uppercase bg-clip-text text-transparent bg-gradient-to-b from-white to-gray-400">
              Cara Kerja <span className="text-gold">Clashpin</span>
            </h2>
            <p className="text-gray-400 text-sm md:text-base mt-3 max-w-lg mx-auto font-medium">
              4 Langkah mudah mendistribusikan bonus klan atau hadiah giveaway secara transparan.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative">
            
            {/* Penghubung Langkah Jalur Garis (Desktop Only) */}
            <div className="hidden md:block absolute top-[44px] left-[10%] right-[10%] h-[2px] bg-gradient-to-r from-blue-500/30 via-purple-500/30 to-gold/30 z-0" />

            {[
              { step: "01", icon: Key, color: "text-blue-400 border-blue-500/20 bg-blue-500/5 shadow-blue-500/10", title: "Verifikasi Token", desc: "Leader menautkan Player Tag dan API Token dari game COC di halaman profil untuk otorisasi keamanan klan." },
              { step: "02", icon: Database, color: "text-purple-400 border-purple-500/20 bg-purple-500/5 shadow-purple-500/10", title: "Ambil Arsip CWL", desc: "Pilih musim/bulan kompetisi CWL. Sistem menarik akumulasi Bintang & Kehancuran penuh selama 7 hari ronde perang." },
              { step: "03", icon: Disc, color: "text-gold border-gold/20 bg-gold/5 shadow-gold/10", title: "Acak via Spinner", desc: "Daftar pemain terbaik otomatis diatur ke dalam piringan roda Spinner 3D. Klik 'Putar' untuk memulai pengundian nasib." },
              { step: "04", icon: FileCheck, color: "text-green-400 border-green-500/20 bg-green-500/5 shadow-green-500/10", title: "Arsipkan Log", desc: "Hasil pemenang dan daftar peserta otomatis dikunci dan diamankan secara terpisah ke dalam koleksi mandiri Firestore." }
            ].map((item, idx) => (
              <motion.div 
                key={idx} 
                variants={itemVariants}
                className="relative bg-gradient-to-b from-[#0c0d12] to-[#060608] border border-white/5 p-6 rounded-2xl shadow-xl flex flex-col group hover:border-white/10 transition-all duration-300 z-10"
              >
                <div className="absolute top-4 right-6 text-3xl font-black font-mono text-white/5 group-hover:text-gold/10 transition-colors">
                  {item.step}
                </div>

                <div className={`w-14 h-14 rounded-full border flex items-center justify-center mb-6 relative z-10 shadow-inner group-hover:scale-110 transition-transform ${item.color}`}>
                  <item.icon className="w-6 h-6" />
                </div>

                <h4 className="text-lg font-black text-white mb-2 tracking-wide uppercase">{item.title}</h4>
                <p className="text-gray-400 text-xs leading-relaxed font-medium">{item.desc}</p>
              </motion.div>
            ))}

          </div>
        </motion.div>

      </main>

      {/* --- FOOTER REGULER --- */}
      <footer className="w-full border-t border-white/5 bg-black/60 py-8 relative z-20 text-center text-xs text-gray-500 font-mono">
        &copy; {new Date().getFullYear()} Clashpin Platform. Developed inside Clashub App Network ecosystem.
      </footer>

      <style jsx global>{`
        .text-shadow-blue { text-shadow: 0 0 15px rgba(59,130,246,0.5); }
        .text-shadow-green { text-shadow: 0 0 15px rgba(74,222,128,0.5); }
        .text-shadow-elixir { text-shadow: 0 0 15px rgba(217,70,239,0.5); }
        .perspective-1000 { perspective: 1000px; }
      `}</style>
    </div>
  );
}