import Link from 'next/link';

export function LandingFooter() {
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
            <h2 className="footer-logo">Voeq</h2>
            <p className="footer-tagline">Find. Connect. Grow.</p>
            <p className="footer-description">
              The campus marketplace connecting Nigerian students with verified vendors.
            </p>
          </div>
          
          <div className="footer-col">
            <h4 className="footer-col-title">Discover</h4>
            <Link href="/explore" className="footer-link">Explore</Link>
            <Link href="/browse" className="footer-link">Categories</Link>
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
          </div>
        </div>
      </div>
    </footer>
  );
}
