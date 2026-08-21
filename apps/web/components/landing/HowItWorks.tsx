import { Search, MessageSquare, ShoppingBag } from 'lucide-react';

const steps = [
  {
    number: '01',
    icon: Search,
    title: 'Discover',
    description: 'Browse verified vendors across 10+ categories on your campus. Real reviews, real prices, real people.',
  },
  {
    number: '02',
    icon: MessageSquare,
    title: 'Connect',
    description: 'Message vendors directly through Voeq\'s in-app chat. No middleman, no markup, no hassle.',
  },
  {
    number: '03',
    icon: ShoppingBag,
    title: 'Grow',
    description: 'Support student entrepreneurs building their dreams. Your purchase powers their journey.',
  },
];

export function HowItWorks() {
  return (
    <section className="how-it-works-section">
      <div className="how-it-works-container">
        <div className="how-it-works-header">
          <h2 className="how-it-works-title">How Voeq works</h2>
          <p className="how-it-works-subtitle">
            Three simple steps to discover campus services
          </p>
        </div>

        <div className="how-it-works-grid">
          {steps.map((step) => {
            const Icon = step.icon;
            
            return (
              <div key={step.number} className="how-it-works-step">
                <div className="how-it-works-step-number">{step.number}</div>
                <div className="how-it-works-step-icon">
                  <Icon size={32} />
                </div>
                <h3 className="how-it-works-step-title">{step.title}</h3>
                <p className="how-it-works-step-description">{step.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
