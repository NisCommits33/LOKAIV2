/**
 * components/ui/pagination.tsx — Reusable Pagination Component
 * 
 * Provides a clean, responsive pagination control with:
 * - Current page indicator
 * - Next/Previous buttons
 * - Results summary (Showing X-Y of Z)
 * - Intelligent page range ellipsis logic
 */

"use client";

import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  className?: string;
  isLoading?: boolean;
}

export function Pagination({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
  className,
  isLoading = false,
}: PaginationProps) {
  if (totalPages <= 1 && totalItems > 0) {
      // Still show the "Showing X of Y" row but hide the buttons if only one page
      return (
        <div className={cn("flex items-center justify-between px-2 py-4", className)}>
             <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Showing <span className="font-bold text-slate-900 dark:text-slate-100">{totalItems}</span> results
             </p>
        </div>
      );
  }
  
  if (totalItems === 0) return null;

  const startIdx = (currentPage - 1) * itemsPerPage + 1;
  const endIdx = Math.min(currentPage * itemsPerPage, totalItems);

  // Logic to generate page numbers with ellipsis
  const getPageNumbers = () => {
    const pages = [];
    const showMax = 5; // Max number of page buttons to show

    if (totalPages <= showMax) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      // Complex ellipsis logic
      if (currentPage <= 3) {
        pages.push(1, 2, 3, 4, "ellipsis", totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1, "ellipsis", totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, "ellipsis", currentPage - 1, currentPage, currentPage + 1, "ellipsis", totalPages);
      }
    }
    return pages;
  };

  return (
    <div className={cn("flex flex-col sm:flex-row items-center justify-between gap-4 px-2 py-6", className)}>
      {/* Selection Stats */}
      <p className="text-xs font-medium text-slate-500 dark:text-slate-400 order-2 sm:order-1">
        Showing <span className="font-bold text-slate-900 dark:text-slate-100">{startIdx}</span> to{" "}
        <span className="font-bold text-slate-900 dark:text-slate-100">{endIdx}</span> of{" "}
        <span className="font-bold text-slate-900 dark:text-slate-100">{totalItems}</span> results
      </p>

      {/* Pagination Controls */}
      <div className="flex items-center gap-1 order-1 sm:order-2">
        <Button
          variant="outline"
          size="icon"
          className="h-9 w-9 rounded-xl border-slate-200 dark:border-slate-800"
          disabled={currentPage === 1 || isLoading}
          onClick={() => onPageChange(currentPage - 1)}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <div className="flex items-center gap-1 mx-1">
          {getPageNumbers().map((page, idx) => (
            <div key={idx}>
              {page === "ellipsis" ? (
                <div className="flex h-9 w-9 items-center justify-center">
                  <MoreHorizontal className="h-4 w-4 text-slate-400" />
                </div>
              ) : (
                <Button
                  variant={currentPage === page ? "default" : "ghost"}
                  size="icon"
                  className={cn(
                    "h-9 w-9 rounded-xl text-sm font-bold transition-all",
                    currentPage === page
                      ? "bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900"
                      : "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900"
                  )}
                  disabled={isLoading}
                  onClick={() => typeof page === "number" && onPageChange(page)}
                >
                  {page}
                </Button>
              )}
            </div>
          ))}
        </div>

        <Button
          variant="outline"
          size="icon"
          className="h-9 w-9 rounded-xl border-slate-200 dark:border-slate-800"
          disabled={currentPage === totalPages || isLoading}
          onClick={() => onPageChange(currentPage + 1)}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
