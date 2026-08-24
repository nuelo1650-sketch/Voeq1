"use client";

import { useState, useEffect, useCallback } from "react";

/**
 * useBookmarks — localStorage-based bookmark persistence.
 * Stores listing IDs that user has bookmarked.
 */

const STORAGE_KEY = "voeq:bookmarks";

export function useBookmarks() {
  const [bookmarks, setBookmarks] = useState<Set<string>>(new Set());
  const [mounted, setMounted] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    setMounted(true);
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const ids = JSON.parse(stored) as string[];
        setBookmarks(new Set(ids));
      }
    } catch {
      // Ignore parse errors
    }
  }, []);

  // Save to localStorage whenever bookmarks change
  useEffect(() => {
    if (!mounted) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(bookmarks)));
    } catch {
      // Ignore storage errors
    }
  }, [bookmarks, mounted]);

  const toggle = useCallback((listingId: string) => {
    setBookmarks((prev) => {
      const next = new Set(prev);
      if (next.has(listingId)) {
        next.delete(listingId);
      } else {
        next.add(listingId);
      }
      return next;
    });
  }, []);

  const isBookmarked = useCallback(
    (listingId: string) => bookmarks.has(listingId),
    [bookmarks]
  );

  return { bookmarks: Array.from(bookmarks), toggle, isBookmarked, count: bookmarks.size };
}
