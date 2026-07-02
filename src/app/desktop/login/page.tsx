"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Lock, User as UserIcon, LogIn, UserPlus, AlertTriangle, Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useAuthStore } from "@/store/useAuthStore";

export default function LoginPage() {
  const router = useRouter();
  const { user, loginWithEmail, registerWithEmail, signInWithGoogle, initAuth } = useAuthStore();
  
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: ""
  });

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  // Jika sudah login, tendang balik ke spinner
  useEffect(() => {
    if (user) {
      router.push('/desktop/spinner');
    }
  }, [user, router]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setErrorMsg(""); // Hapus error saat ngetik
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setIsLoading(true);

    try {
      if (isLoginMode) {
        await loginWithEmail(formData.email, formData.password);
      } else {
        if (!formData.name.trim()) throw new Error("Nama wajib diisi.");
        if (formData.password.length < 6) throw new Error("Password minimal 6 karakter.");
        await registerWithEmail(formData.email, formData.password, formData.name);
      }
      // Redirect diurus oleh useEffect di atas
    } catch (err: any) {
      // Parse pesan error Firebase agar lebih ramah dibaca
      let msg = err.message;
      if (msg.includes('invalid-credential')) msg = "Email atau password salah.";
      if (msg.includes('email-already-in-use')) msg = "Email ini sudah terdaftar.";
      setErrorMsg(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setErrorMsg("");
    setIsLoading(true);
    try {
      await signInWithGoogle();
    } catch (err: any) {
      setErrorMsg("Gagal login dengan Google.");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-[-100px] left-[-100px] w-[400px] h-[400px] bg-blue-500/10 blur-[100px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-100px] right-[-100px] w-[400px] h-[400px] bg-elixir/10 blur-[100px] rounded-full pointer-events-none" />

      <Link href="/desktop" className="absolute top-8 left-8 text-gray-400 hover:text-white flex items-center gap-2 transition-colors z-20">
        <ArrowLeft className="w-5 h-5" /> Kembali
      </Link>

      <div className="w-full max-w-md bg-black/40 border border-white/10 backdrop-blur-xl rounded-3xl p-8 relative z-10 shadow-2xl">
        
        {/* Toggle Login/Register */}
        <div className="flex p-1 bg-black/40 border border-white/5 rounded-2xl mb-8">
          <button 
            onClick={() => { setIsLoginMode(true); setErrorMsg(""); }}
            className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all ${isLoginMode ? 'bg-white/10 text-white shadow-md' : 'text-gray-500 hover:text-gray-300'}`}
          >
            Masuk
          </button>
          <button 
            onClick={() => { setIsLoginMode(false); setErrorMsg(""); }}
            className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all ${!isLoginMode ? 'bg-white/10 text-white shadow-md' : 'text-gray-500 hover:text-gray-300'}`}
          >
            Daftar Baru
          </button>
        </div>

        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-white mb-2">
            {isLoginMode ? 'Selamat Datang Kembali!' : 'Bergabung dengan Clashpin'}
          </h2>
          <p className="text-gray-400 text-sm">
            {isLoginMode ? 'Akses workspace undian dan kelola riwayat klanmu.' : 'Buat akun untuk menyimpan riwayat undian giveaway klanmu.'}
          </p>
        </div>

        {errorMsg && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm mb-6">
            <AlertTriangle className="w-5 h-5 flex-shrink-0" /> {errorMsg}
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <AnimatePresence mode="wait">
            {!isLoginMode && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="relative"
              >
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <UserIcon className="w-5 h-5 text-gray-500" />
                </div>
                <input 
                  type="text" 
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Nama Panggilan" 
                  className="w-full bg-[#0a0a0b] border border-white/10 rounded-xl py-3.5 pl-12 pr-4 text-white focus:border-elixir focus:ring-1 focus:ring-elixir outline-none transition-all"
                />
              </motion.div>
            )}
          </AnimatePresence>

          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Mail className="w-5 h-5 text-gray-500" />
            </div>
            <input 
              type="email" 
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              required
              placeholder="Alamat Email" 
              className="w-full bg-[#0a0a0b] border border-white/10 rounded-xl py-3.5 pl-12 pr-4 text-white focus:border-elixir focus:ring-1 focus:ring-elixir outline-none transition-all"
            />
          </div>

          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Lock className="w-5 h-5 text-gray-500" />
            </div>
            <input 
              type="password" 
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              required
              placeholder="Kata Sandi" 
              className="w-full bg-[#0a0a0b] border border-white/10 rounded-xl py-3.5 pl-12 pr-4 text-white focus:border-elixir focus:ring-1 focus:ring-elixir outline-none transition-all"
            />
          </div>

          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full py-4 mt-4 rounded-xl bg-elixir hover:bg-elixir-dark text-white font-bold tracking-wide transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(217,70,239,0.2)]"
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : (isLoginMode ? <LogIn className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />)}
            {isLoginMode ? 'MASUK SEKARANG' : 'DAFTAR AKUN'}
          </button>
        </form>

        <div className="mt-8 flex items-center gap-4">
          <div className="h-px bg-white/10 flex-1"></div>
          <span className="text-xs text-gray-500 font-bold uppercase tracking-widest">Atau</span>
          <div className="h-px bg-white/10 flex-1"></div>
        </div>

        <button 
          type="button"
          onClick={handleGoogleLogin}
          disabled={isLoading}
          className="w-full py-3.5 mt-6 rounded-xl bg-white text-black font-bold flex items-center justify-center gap-3 transition-all hover:bg-gray-200 disabled:opacity-50"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Lanjutkan dengan Google
        </button>

      </div>
    </div>
  );
}