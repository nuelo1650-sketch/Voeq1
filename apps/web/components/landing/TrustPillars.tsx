import { Shield, Eye, Users, Heart } from 'lucide-react';

const pillars = [
  {
    icon: Shield,
    title: 'Verified vendors',
    description: 'Every vendor is manually reviewed before listing. No fake accounts, no scams.',
  },
  {
    icon: Eye,
    title: 'Transparent pricing',
    description: 'Real prices from real students. No hidden fees or surprise charges.',
  },
  {
    icon: Users,
    title: 'Real reviews',
    description: 'Honest feedback from verified students. We never fake numbers or manipulate ratings.',
  },
  {
    icon: Heart,
    title: 'Student-first',
    description: 'Built by students, for students. We exist to make campus life easier.',
  },
];

export function TrustPillars() {
  return (
    <section className="trust-pillars-section">
      <div className="trust-pillars-container">
        <div className="trust-pillars-header">
          <h2 className="trust-pillars-title">Why students trust Voeq</h2>
          <p className="trust-pillars-subtitle">
            We're committed to transparency, honesty, and building a marketplace that actually serves students.
          </p>
        </div>

        <div className="trust-pillars-grid">
          {pillars.map((pillar) => {
            const Icon = pillar.icon;
            
            return (
              <div key={pillar.title} className="trust-pillar">
                <div className="trust-pillar-icon">
                  <Icon size={32} />
                </div>
                <h3 className="trust-pillar-title">{pillar.title}</h3>
                <p className="trust-pillar-description">{pillar.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
