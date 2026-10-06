"use client";

import React, { useEffect } from 'react';
import { create } from 'zustand';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info';

interface ToastState {
  message: string;
  type: ToastType;
  isVisible: boolean;
  showToast: (message: string, type?: ToastType) => void;
  hideToast: () => void;
}

// Global Store untuk Toast
export const useToastStore = create<ToastState>((set) => ({
  message: '',
  type: 'info',
  isVisible: false,
  showToast: (message, type = 'info') => set({ message, type, isVisible: true }),
  hideToast: () => set({ isVisible: false }),
}));

// Komponen Provider (akan dipasang di layout.tsx nantinya)
export const ToastProvider = () => {
  const { message, type, isVisible, hideToast } = useToastStore();

  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        hideToast();
      }, 3000); // Otomatis hilang setelah 3 detik
      return () => clearTimeout(timer);
    }
  }, [isVisible, hideToast]);

  const icons = {
    success: <CheckCircle className="w-5 h-5 text-green-400" />,
    error: <AlertCircle className="w-5 h-5 text-red-400" />,
    info: <Info className="w-5 h-5 text-blue-400" />,
  };

  const styles = {
    success: 'border-green-500/30 bg-green-950/80 shadow-[0_5px_30px_rgba(74,222,128,0.2)]',
    error: 'border-red-500/30 bg-red-950/80 shadow-[0_5px_30px_rgba(239,68,68,0.2)]',
    info: 'border-blue-500/30 bg-blue-950/80 shadow-[0_5px_30px_rgba(59,130,246,0.2)]',
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.9 }}
          transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] px-4 w-full max-w-sm pointer-events-none"
        >
          <div className={`flex items-center gap-3 p-4 rounded-2xl border backdrop-blur-xl pointer-events-auto ${styles[type]}`}>
            {icons[type]}
            <p className="flex-1 text-sm font-bold text-white tracking-wide">{message}</p>
            <button onClick={hideToast} className="text-gray-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10">
              <X className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
