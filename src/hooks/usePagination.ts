import { useState, useMemo, useEffect, useRef } from 'react';

interface UsePaginationProps<T> {
  data: T[];
  itemsPerPage?: number;
}

interface UsePaginationReturn<T> {
  currentPage: number;
  totalPages: number;
  paginatedData: T[];
  goToPage: (page: number) => void;
  resetPage: () => void;
}

export function usePagination<T>({ 
  data, 
  itemsPerPage = 10 
}: UsePaginationProps<T>): UsePaginationReturn<T> {
  const [currentPage, setCurrentPage] = useState(1);
  
  // Ensure data is always an array
  const safeData = data || [];
  const previousDataLengthRef = useRef(safeData.length);

  const totalPages = Math.ceil(safeData.length / itemsPerPage);

  // Auto-reset to page 1 when data length changes (like filters applied)
  useEffect(() => {
    if (safeData.length !== previousDataLengthRef.current) {
      setCurrentPage(1);
      previousDataLengthRef.current = safeData.length;
    }
  }, [safeData.length]);

  // Ensure currentPage doesn't exceed totalPages when data changes
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return safeData.slice(startIndex, endIndex);
  }, [safeData, currentPage, itemsPerPage]);

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const resetPage = () => {
    setCurrentPage(1);
  };

  return {
    currentPage,
    totalPages,
    paginatedData,
    goToPage,
    resetPage
  };
}
