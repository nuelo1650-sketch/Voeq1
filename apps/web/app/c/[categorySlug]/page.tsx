'use client';
import { use } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Explore } from '@/components/explore/Explore';
import { LandingFooter } from '@/components/landing/LandingFooter';

/**
 * /c/[categorySlug] — Category browse. Uses the SINGLE discover surface (Explore)
 * with a category preset so filters/sort/search all run through loadExplore (VS4.9).
 * No duplicated browse grid — one surface, honest filtering.
 */
export default function CategoryPage({ params }: { params: Promise<{ categorySlug: string }> }) {
  const { categorySlug } = use(params);

  return (
    <div className="explore-page">
      <nav className="explore-nav">
        <div className="explore-nav-content">
          <Link href="/" className="explore-logo">Voeq</Link>
          <Link href="/explore" className="explore-back">
            <ArrowLeft size={16} />
            <span>Back to explore</span>
          </Link>
        </div>
      </nav>
      <Explore categoryPreset={categorySlug} />
      <LandingFooter />
    </div>
  );
}
