'use client';
import { useState, useEffect } from 'react';

const TABS = [
  { id: 'popular', label: 'Popular on Voeq' },
  { id: 'new', label: 'New to Voeq' },
  { id: 'top-rated', label: 'Top Rated' },
  { id: 'trending', label: 'Trending Now' },
  { id: 'verified', label: 'Verified Campus' },
] as const;

interface ExploreTabsProps {
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

export function ExploreTabs({ activeTab, onTabChange }: ExploreTabsProps) {
  const [autoRotate, setAutoRotate] = useState(true);

  // Auto-cycle tabs every 8s, paused on hover/click (user-event-gated, not perpetual idle).
  useEffect(() => {
    if (!autoRotate) return;
    const interval = setInterval(() => {
      const currentIndex = TABS.findIndex((tab) => tab.id === activeTab);
      const nextIndex = (currentIndex + 1) % TABS.length;
      onTabChange(TABS[nextIndex].id);
    }, 8000);
    return () => clearInterval(interval);
  }, [activeTab, autoRotate, onTabChange]);

  return (
    <div className="explore-tabs" onMouseEnter={() => setAutoRotate(false)} onMouseLeave={() => setAutoRotate(true)}>
      <div className="explore-tabs-container">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setAutoRotate(false);
              onTabChange(tab.id);
            }}
            className={`explore-tab ${activeTab === tab.id ? 'active' : ''}`}
            aria-current={activeTab === tab.id ? 'page' : undefined}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
}
