"use client";

import Link from 'next/link';
import { BrandLogo } from './BrandLogo';

export function LandingFooter() {
  // Smart WhatsApp link: whatsapp.com domain works better on mobile
  const whatsappLink = 'https://www.whatsapp.com/channel/0029Vb8u4Md6mYPON8gMpi3i';

  return (
    <footer className="landing-footer">
      {/* Wavy organic top */}
      <svg 
        className="footer-wave" 
        viewBox="0 0 1440 80" 
        preserveAspectRatio="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path 
          d="M0,40 C240,80 480,0 720,40 C960,80 1200,0 1440,40 L1440,0 L0,0 Z" 
          fill="var(--color-forest)" 
        />
      </svg>

      <div className="footer-content">
        <div className="footer-grid">
          <div className="footer-brand">
            <BrandLogo width={120} color="var(--color-glass-white)" />
            <p className="footer-tagline">Find. Connect. Grow.</p>
            <p className="footer-description">
              The campus marketplace connecting Nigerian students with verified vendors.
            </p>
          </div>
          
          <div className="footer-col">
            <h4 className="footer-col-title">Discover</h4>
            <Link href="/explore" className="footer-link">Explore</Link>
            <Link href="/explore" className="footer-link">Categories</Link>
            <Link href="/about" className="footer-link">About</Link>
          </div>
          
          <div className="footer-col">
            <h4 className="footer-col-title">Vendors</h4>
            <Link href="/for-vendors" className="footer-link">Become a vendor</Link>
            <Link href="/for-vendors#benefits" className="footer-link">Benefits</Link>
            <Link href="/help" className="footer-link">Vendor help</Link>
          </div>
          
          <div className="footer-col">
            <h4 className="footer-col-title">Company</h4>
            <Link href="/about" className="footer-link">About us</Link>
            <Link href="/press" className="footer-link">Press</Link>
            <Link href="/careers" className="footer-link">Careers</Link>
            <Link href="/help" className="footer-link">Help center</Link>
          </div>
          
          <div className="footer-col">
            <h4 className="footer-col-title">Legal</h4>
            <Link href="/terms" className="footer-link">Terms of service</Link>
            <Link href="/privacy" className="footer-link">Privacy policy</Link>
          </div>
        </div>
        
        <div className="footer-bottom">
          <div className="footer-bottom-left">
            <span className="footer-copyright">© 2026 Voeq</span>
            <span className="footer-credit">Powered by Legacy LM</span>
          </div>
          
          <div className="footer-social">
            <a 
              href="https://instagram.com/voeq.ng" 
              target="_blank" 
              rel="noopener noreferrer"
              className="footer-social-link"
              aria-label="Instagram"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
              </svg>
            </a>
            <a 
              href="https://twitter.com/voeq_ng" 
              target="_blank" 
              rel="noopener noreferrer"
              className="footer-social-link"
              aria-label="Twitter"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"></path>
              </svg>
            </a>
            <a 
              href="https://facebook.com/voeq.ng" 
              target="_blank" 
              rel="noopener noreferrer"
              className="footer-social-link"
              aria-label="Facebook"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
              </svg>
            </a>
            <a 
              href={whatsappLink} 
              target="_blank" 
              rel="noopener noreferrer"
              className="footer-social-link"
              aria-label="WhatsApp Channel"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
              </svg>
            </a>
            <a 
              href="https://www.tiktok.com/@voeq.ng" 
              target="_blank" 
              rel="noopener noreferrer"
              className="footer-social-link"
              aria-label="TikTok"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
              </svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
