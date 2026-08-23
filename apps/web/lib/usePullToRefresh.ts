"use client";

import { useEffect, useState, useRef } from "react";

/**
 * usePullToRefresh - Custom pull-to-refresh hook for mobile (K2.9)
 * Features:
 * - Visual indicator at top of page
 * - 80px pull threshold
 * - Smooth spring animation
 * - Touch-only (doesn't interfere with desktop scrolling)
 */

interface UsePullToRefreshOptions {
  onRefresh: () => Promise<void> | void;
  threshold?: number;
  disabled?: boolean;
}

export function usePullToRefresh({ 
  onRefresh, 
  threshold = 80, 
  disabled = false 
}: UsePullToRefreshOptions) {
  const [pulling, setPulling] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const startY = useRef(0);
  const currentY = useRef(0);

  useEffect(() => {
    if (disabled || typeof window === "undefined") return;

    let isAtTop = true;

    const handleScroll = () => {
      isAtTop = window.scrollY === 0;
    };

    const handleTouchStart = (e: TouchEvent) => {
      if (!isAtTop || refreshing) return;
      startY.current = e.touches[0].clientY;
      currentY.current = startY.current;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isAtTop || refreshing) return;
      
      currentY.current = e.touches[0].clientY;
      const distance = currentY.current - startY.current;

      if (distance > 0) {
        // Pull down detected
        setPulling(true);
        // Apply resistance curve (diminishing returns after threshold)
        const resistedDistance = distance > threshold 
          ? threshold + (distance - threshold) * 0.3 
          : distance;
        setPullDistance(resistedDistance);
        
        // Prevent default scroll when pulling
        if (distance > 10) {
          e.preventDefault();
        }
      }
    };

    const handleTouchEnd = async () => {
      if (!pulling) return;

      const distance = currentY.current - startY.current;
      
      if (distance >= threshold) {
        // Trigger refresh
        setRefreshing(true);
        setPullDistance(threshold);
        try {
          await onRefresh();
        } finally {
          setRefreshing(false);
          setPullDistance(0);
          setPulling(false);
        }
      } else {
        // Snap back
        setPullDistance(0);
        setPulling(false);
      }

      startY.current = 0;
      currentY.current = 0;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("touchstart", handleTouchStart, { passive: true });
    window.addEventListener("touchmove", handleTouchMove, { passive: false });
    window.addEventListener("touchend", handleTouchEnd);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);
    };
  }, [disabled, onRefresh, threshold, refreshing, pulling]);

  return {
    pulling,
    refreshing,
    pullDistance,
    isPulling: pulling || refreshing,
  };
}
