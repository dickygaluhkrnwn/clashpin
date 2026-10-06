import React from 'react';
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  className = ''
}) => {
  // Sembunyikan pagination jika halamannya cuma 1
  if (totalPages <= 1) return null;

  // Logika penyederhanaan nomor halaman (menampilkan elipsis "..." jika halamannya banyak)
  const getPageNumbers = () => {
    const pages = [];
    for (let i = 1; i <= totalPages; i++) {
      if (
        i === 1 || 
        i === totalPages || 
        (i >= currentPage - 1 && i <= currentPage + 1)
      ) {
        pages.push(i);
      } else if (pages[pages.length - 1] !== '...') {
        pages.push('...');
      }
    }
    return pages;
  };

  return (
    <nav className={`flex items-center justify-center gap-1 sm:gap-2 ${className}`}>
      {/* Tombol Sebelumnya */}
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none transition-colors border border-transparent hover:border-white/5"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>

      {/* Daftar Angka */}
      {getPageNumbers().map((page, index) => {
        if (page === '...') {
          return (
            <div key={`ellipsis-${index}`} className="px-1 sm:px-2 text-gray-600 flex items-center justify-center">
              <MoreHorizontal className="w-4 h-4" />
            </div>
          );
        }

        const isCurrent = page === currentPage;
        return (
          <button
            key={page}
            onClick={() => onPageChange(page as number)}
            className={`min-w-[36px] sm:min-w-[40px] h-9 sm:h-10 px-3 sm:px-4 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              isCurrent 
                ? 'bg-gradient-to-r from-elixir to-purple-600 text-white shadow-[0_0_15px_rgba(217,70,239,0.4)] pointer-events-none' 
                : 'text-gray-400 hover:text-white hover:bg-white/10 border border-transparent hover:border-white/5'
            }`}
          >
            {page}
          </button>
        );
      })}

      {/* Tombol Selanjutnya */}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none transition-colors border border-transparent hover:border-white/5"
      >
        <ChevronRight className="w-5 h-5" />
      </button>
    </nav>
  );
};
