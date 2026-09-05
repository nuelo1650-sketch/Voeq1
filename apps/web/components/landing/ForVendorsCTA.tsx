import Link from 'next/link';
import { ArrowRight, Store, TrendingUp, Users } from 'lucide-react';

const benefits = [
  {
    icon: Store,
    title: 'Free to list',
    description: 'No setup fees, no monthly subscriptions. List your business in minutes.',
  },
  {
    icon: Users,
    title: 'Reach students',
    description: 'Connect directly with thousands of students on your campus.',
  },
  {
    icon: TrendingUp,
    title: 'Grow your business',
    description: 'Build your reputation with reviews and get discovered organically.',
  },
];

export function ForVendorsCTA() {
  return (
    <section className="for-vendors-section">
      <div className="for-vendors-container">
        <div className="for-vendors-content">
          <div className="for-vendors-text">
            <h2 className="for-vendors-title">Are you a campus vendor?</h2>
            <p className="for-vendors-subtitle">
              Join hundreds of student entrepreneurs already growing their business on Voeq.
            </p>

            <div className="for-vendors-benefits">
              {benefits.map((benefit) => {
                const Icon = benefit.icon;
                
                return (
                  <div key={benefit.title} className="for-vendors-benefit">
                    <div className="for-vendors-benefit-icon">
                      <Icon size={24} />
                    </div>
                    <div className="for-vendors-benefit-text">
                      <h3 className="for-vendors-benefit-title">{benefit.title}</h3>
                      <p className="for-vendors-benefit-description">{benefit.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            <Link href="/for-vendors" className="for-vendors-cta-btn">
              Become a vendor
              <ArrowRight size={20} />
            </Link>
          </div>

          <div className="for-vendors-visual">
            {/* P-A round 81 (H): the founder's own landing.jpg replaces the
                gradient monogram — a real Voeq asset, richer than the word
                panel (the old comment banned *stock* photos; this is ours). */}
            <div className="for-vendors-image-wrapper">
              <img
                src="/landing.jpg"
                alt="Voeq campus marketplace"
                width={1280}
                height={853}
                loading="lazy"
                decoding="async"
                style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
