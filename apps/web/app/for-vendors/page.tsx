import Link from "next/link";
import { Store, Zap, Shield, TrendingUp } from "lucide-react";
import { InfoPageShell } from "@/components/info/InfoPageShell";

export const metadata = {
  title: "For Vendors",
  description: "List your business on Voeq. Reach students on campus for free.",
};

export default function ForVendorsPage() {
  return (
    <InfoPageShell title="For Vendors">
      <div className="info-page-content">
        <section className="info-section">
          <p className="info-lead">
            List your business on Voeq and connect with students who are actively 
            looking for what you offer. No fees. No commissions. Just visibility.
          </p>
        </section>

        <section className="info-section">
          <h2 className="info-heading">Why List on Voeq?</h2>
          <div className="vendor-benefits">
            <div className="vendor-benefit">
              <div className="vendor-benefit-icon">
                <Zap size={24} />
              </div>
              <h3>Get Discovered</h3>
              <p>
                Students browse by category and campus. Your listing appears 
                exactly where students are looking — no competing with vendors 
                from other schools.
              </p>
            </div>
            <div className="vendor-benefit">
              <div className="vendor-benefit-icon">
                <Shield size={24} />
              </div>
              <h3>100% Free</h3>
              <p>
                No listing fees. No commissions. No hidden costs. You keep 
                everything you earn. Voeq makes money elsewhere, not from you.
              </p>
            </div>
            <div className="vendor-benefit">
              <div className="vendor-benefit-icon">
                <Store size={24} />
              </div>
              <h3>Direct Contact</h3>
              <p>
                Students message you through Voeq's secure in-app chat. 
                No middleman. No platform fees.
              </p>
            </div>
            <div className="vendor-benefit">
              <div className="vendor-benefit-icon">
                <TrendingUp size={24} />
              </div>
              <h3>Grow Your Reach</h3>
              <p>
                Get seen by students who might not know you exist. Your listing 
                works 24/7, even when you're not actively promoting.
              </p>
            </div>
          </div>
        </section>

        <section className="info-section">
          <h2 className="info-heading">How It Works</h2>
          <ol className="info-list info-list-numbered">
            <li>
              <strong>Create your listing</strong> — Add your business name, 
              category, description, and contact details.
            </li>
            <li>
              <strong>Go live immediately</strong> — Your listing appears on 
              your campus marketplace as soon as you publish.
            </li>
            <li>
              <strong>Connect with students</strong> — Students find you through 
              search or browse, then reach out directly via your contact info.
            </li>
          </ol>
          <p>
            Update your listing anytime. Add new products. Change your hours. 
            It's your storefront.
          </p>
        </section>

        <section className="info-section">
          <h2 className="info-heading">What You Can Sell</h2>
          <p>Voeq supports all campus-friendly categories:</p>
          <ul className="info-list info-list-compact">
            <li>Food & Drinks</li>
            <li>Fashion & Accessories</li>
            <li>Tech & Electronics</li>
            <li>Health & Beauty</li>
            <li>Stationery & Supplies</li>
            <li>Services (tutoring, repair, design, etc.)</li>
            <li>And more</li>
          </ul>
          <p>
            If it's legal and serves students, you can list it. Check our{' '}
            <Link href="/terms" className="info-link">Terms of Service</Link> for 
            full guidelines.
          </p>
        </section>

        <section className="info-section">
          <h2 className="info-heading">Ready to Get Started?</h2>
          <p>
            Create your vendor listing in under 5 minutes. No approval wait time. 
            No complicated setup.
          </p>
          <div className="vendor-cta-group" data-testid="for-vendors-cta">
            <Link href="/become-vendor" className="vendor-cta-primary">
              Create Vendor Listing
            </Link>
            <Link href="/help" className="vendor-cta-secondary">
              Read Vendor FAQ
            </Link>
          </div>
        </section>

        <section className="info-section">
          <h2 className="info-heading">Questions?</h2>
          <p>
            Email us at{' '}
            <a href="mailto:vendors@voeq.ng" className="info-link">vendors@voeq.ng</a>. 
            We're here to help you succeed.
          </p>
        </section>
      </div>
    </InfoPageShell>
  );
}
