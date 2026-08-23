"use client";

import { useEffect, useState, useRef } from "react";

/**
 * useInfiniteScroll - Pagination with auto-load on scroll (K2.9)
 * Features:
 * - Triggers at 80% scroll position
 * - Prevents duplicate loads
 * - Shows "Load more" button as fallback
 * - Respects hasMore flag
 */

interface UseInfiniteScrollOptions {
  onLoadMore: () => Promise<void> | void;
  hasMore: boolean;
  threshold?: number; // 0-1, percentage of page height
  disabled?: boolean;
}

export function useInfiniteScroll({ 
  onLoadMore, 
  hasMore, 
  threshold = 0.8,
  disabled = false 
}: UseInfiniteScrollOptions) {
  const [loading, setLoading] = useState(false);
  const loadingRef = useRef(false);

  useEffect(() => {
    if (disabled || !hasMore || typeof window === "undefined") return;

    const handleScroll = async () => {
      // Prevent duplicate loads
      if (loadingRef.current) return;

      const scrollTop = window.scrollY;
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;

      const scrollPosition = (scrollTop + windowHeight) / documentHeight;

      if (scrollPosition >= threshold) {
        loadingRef.current = true;
        setLoading(true);
        
        try {
          await onLoadMore();
        } finally {
          setLoading(false);
          loadingRef.current = false;
        }
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [disabled, hasMore, onLoadMore, threshold]);

  const manualLoadMore = async () => {
    if (loading || !hasMore) return;
    
    loadingRef.current = true;
    setLoading(true);
    
    try {
      await onLoadMore();
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  };

  return {
    loading,
    manualLoadMore,
  };
}
