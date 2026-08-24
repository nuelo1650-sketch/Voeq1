import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { BrandLogo } from '../landing/BrandLogo';
import { LandingFooter } from '../landing/LandingFooter';

interface InfoPageShellProps {
  children: React.ReactNode;
  title?: string;
}

export function InfoPageShell({ children, title }: InfoPageShellProps) {
  return (
    <div className="info-page-wrapper">
      {/* Simple top nav */}
      <nav className="info-page-nav">
        <div className="info-page-nav-content">
          <Link href="/" className="info-page-logo" aria-label="Voeq">
            <BrandLogo width={64} />
          </Link>
          <Link href="/" className="info-page-back">
            <ArrowLeft size={16} />
            <span>Back to home</span>
          </Link>
        </div>
      </nav>

      {/* Main content container */}
      <main className="info-page-main">
        <div className="info-page-container">
          {title && <h1 className="info-page-title">{title}</h1>}
          {children}
        </div>
      </main>

      {/* Footer */}
      <LandingFooter />
    </div>
  );
}
