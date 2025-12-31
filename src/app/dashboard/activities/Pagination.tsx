'use client';

import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
}

export default function Pagination({ currentPage, totalPages }: PaginationProps) {
  if (totalPages <= 1) return null;

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const showEllipsis = totalPages > 7;

    if (!showEllipsis) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    if (currentPage <= 3) {
      pages.push(1, 2, 3, 4, '...', totalPages);
    } else if (currentPage >= totalPages - 2) {
      pages.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
    } else {
      pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
    }

    return pages;
  };

  return (
    <div className="flex items-center justify-center gap-2">
      <Link
        href={`?page=${currentPage - 1}`}
        className={`
          flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors
          ${currentPage === 1
            ? 'text-zinc-600 cursor-not-allowed pointer-events-none'
            : 'text-zinc-300 hover:bg-zinc-900 hover:text-white'
          }
        `}
      >
        <ChevronLeft size={18} />
        Previous
      </Link>

      <div className="flex gap-1">
        {getPageNumbers().map((page, idx) => {
          if (page === '...') {
            return (
              <span key={`ellipsis-${idx}`} className="px-3 py-2 text-zinc-600">
                ...
              </span>
            );
          }

          const pageNum = page as number;
          const isActive = pageNum === currentPage;

          return (
            <Link
              key={pageNum}
              href={`?page=${pageNum}`}
              className={`
                px-4 py-2 rounded-lg font-medium transition-colors
                ${isActive
                  ? 'bg-cyan-600 text-white'
                  : 'text-zinc-400 hover:bg-zinc-900 hover:text-white'
                }
              `}
            >
              {pageNum}
            </Link>
          );
        })}
      </div>

      <Link
        href={`?page=${currentPage + 1}`}
        className={`
          flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors
          ${currentPage === totalPages
            ? 'text-zinc-600 cursor-not-allowed pointer-events-none'
            : 'text-zinc-300 hover:bg-zinc-900 hover:text-white'
          }
        `}
      >
        Next
        <ChevronRight size={18} />
      </Link>
    </div>
  );
}
