"use client";

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export interface SelectProps {
  label?: string;
  error?: string;
  placeholder?: string;
  options: { label: string; value: string | number }[];
  value?: string | number;
  onChange?: (value: string | number) => void;
  disabled?: boolean;
  className?: string;
}

export function Select({
  label,
  error,
  placeholder,
  options,
  value,
  onChange,
  disabled = false,
  className = ''
}: SelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleSelect = (val: string | number) => {
    if (onChange) onChange(val);
    setIsOpen(false);
  };

  return (
    <div className="w-full flex flex-col gap-1.5" ref={containerRef}>
      {label && (
        <label className="text-sm font-medium text-gray-300 ml-1">
          {label}
        </label>
      )}
      <div className="relative">
        <button
          type="button"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
          className={`w-full flex items-center justify-between bg-[#0a0a0c] border ${
            error ? 'border-red-500/50' : isOpen ? 'border-gold/50' : 'border-white/10'
          } rounded-xl px-4 py-3 text-white outline-none transition-all ${
            disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-white/20'
          } ${className}`}
        >
          <span className={`truncate text-sm ${!selectedOption ? 'text-gray-500' : 'text-white'}`}>
            {selectedOption ? selectedOption.label : (placeholder || 'Pilih salah satu')}
          </span>
          <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
            <ChevronDown className="w-4 h-4 text-gray-400" />
          </motion.div>
        </button>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
              className="absolute z-50 w-full top-full mt-2 bg-[#121318] border border-white/10 rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.8)] overflow-hidden"
            >
              <div className="max-h-56 overflow-y-auto custom-scrollbar">
                {options.length === 0 ? (
                  <div className="p-4 text-center text-sm text-gray-500">Tidak ada opsi</div>
                ) : (
                  options.map((opt, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => handleSelect(opt.value)}
                      className="w-full flex items-center justify-between px-4 py-3 text-left text-sm hover:bg-white/5 transition-colors border-b border-white/5 last:border-0"
                    >
                      <span className={value === opt.value ? 'text-gold font-bold' : 'text-gray-200'}>
                        {opt.label}
                      </span>
                      {value === opt.value && <Check className="w-4 h-4 text-gold" />}
                    </button>
                  ))
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      {error && <span className="text-xs text-red-400 font-medium ml-1">{error}</span>}
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.1); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(250, 204, 21, 0.5); }
      `}</style>
    </div>
  );
}
