'use client';
import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { InfoPageShell } from "@/components/info/InfoPageShell";

export default function HelpPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const faqs = [
    {
      category: 'Getting Started',
      questions: [
        {
          q: 'How do I find vendors on my campus?',
          a: 'Select your campus from the homepage, then browse by category or search for specific vendors or services. All listings are organized by campus to show you what&apos;s available near you.'
        },
        {
          q: 'Do I need an account to browse?',
          a: 'No. You can browse all vendor listings without creating an account. An account is only needed if you want to save favorites or contact vendors through the platform.'
        },
        {
          q: 'Is Voeq free to use?',
          a: 'Yes. Voeq is completely free for students. Vendors can also list their business for free with no hidden fees or commissions.'
        }
      ]
    },
    {
      category: 'For Students',
      questions: [
        {
          q: 'How do I contact a vendor?',
          a: 'Each vendor listing includes a "Message" button. Click it to start a conversation through Voeq&apos;s in-app chat. All communication happens securely within the platform.'
        },
        {
          q: 'Can I filter by category?',
          a: 'Yes. Use the category filter on the Explore page to narrow your search to Food, Fashion, Services, Tech, Health & Beauty, Stationery, or any other category.'
        },
        {
          q: 'What if a vendor isn&apos;t responding?',
          a: 'Vendors manage their own availability. If you don&apos;t get a response, try reaching out through an alternative contact method or browse similar vendors in the same category.'
        },
        {
          q: 'How do payments work?',
          a: 'Voeq does not process payments. All transactions happen directly between you and the vendor using your agreed payment method (cash, transfer, etc.).'
        }
      ]
    },
    {
      category: 'For Vendors',
      questions: [
        {
          q: 'How do I list my business?',
          a: 'Click "Become a vendor" from the homepage or footer, then fill out the listing form with your business details, category, and contact information. Your listing will go live immediately.'
        },
        {
          q: 'Does Voeq take a commission?',
          a: 'No. Voeq is free for vendors. We don&apos;t take commissions, transaction fees, or charge for listings. You keep 100% of what you earn.'
        },
        {
          q: 'Can I update my listing after it&apos;s live?',
          a: 'Yes. Log into your vendor account to edit your business details, contact information, or operating hours anytime.'
        },
        {
          q: 'What categories can I list under?',
          a: 'Choose from Food & Drinks, Fashion & Accessories, Tech & Electronics, Health & Beauty, Stationery & Supplies, Services, and more. Pick the category that best fits your business.'
        }
      ]
    },
    {
      category: 'Safety & Trust',
      questions: [
        {
          q: 'How does Voeq verify vendors?',
          a: 'Vendor presence is self-reported. We do not independently verify business details. Use your judgment when engaging with vendors, just as you would with any campus service.'
        },
        {
          q: 'What if I have a dispute with a vendor?',
          a: 'All transactions happen directly between students and vendors. Voeq is not involved in disputes, refunds, or exchanges. Contact the vendor directly to resolve any issues.'
        },
        {
          q: 'Can I report a suspicious listing?',
          a: 'Yes. If you encounter a fraudulent or misleading listing, email us at support@voeq.ng with details. We investigate all reports and remove listings that violate our Terms of Service.'
        }
      ]
    },
    {
      category: 'Technical',
      questions: [
        {
          q: 'Which campuses does Voeq support?',
          a: 'Voeq is currently expanding across Nigerian universities. Select your campus on the homepage to see if it&apos;s available. Don&apos;t see yours? Let us know — we&apos;re adding new campuses regularly.'
        },
        {
          q: 'Is there a mobile app?',
          a: 'Not yet. Voeq works on any mobile browser. A dedicated app may be released in the future based on demand.'
        },
        {
          q: 'I found a bug. How do I report it?',
          a: 'Email us at support@voeq.ng with a description of the issue and any screenshots. We appreciate your help improving the platform.'
        }
      ]
    }
  ];

  const toggleAccordion = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  let globalIndex = 0;

  return (
    <InfoPageShell title="Help & FAQ">
      <div className="info-page-content">
        <section className="info-section">
          <p>
            Find answers to common questions about using Voeq. Can&apos;t find what 
            you&apos;re looking for? Email us at{' '}
            <a href="mailto:support@voeq.ng" className="info-link">support@voeq.ng</a>.
          </p>
        </section>

        {faqs.map((section, sectionIdx) => (
          <section key={sectionIdx} className="info-section">
            <h2 className="info-heading">{section.category}</h2>
            <div className="faq-accordion">
              {section.questions.map((faq, questionIdx) => {
                const currentIndex = globalIndex++;
                const isOpen = openIndex === currentIndex;
                
                return (
                  <div key={questionIdx} className="faq-item">
                    <button
                      onClick={() => toggleAccordion(currentIndex)}
                      className="faq-question"
                      aria-expanded={isOpen}
                    >
                      <span>{faq.q}</span>
                      <ChevronDown 
                        size={20} 
                        className={`faq-icon ${isOpen ? 'open' : ''}`}
                      />
                    </button>
                    {isOpen && (
                      <div className="faq-answer">
                        <p>{faq.a}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        ))}

        <section className="info-section">
          <h2 className="info-heading">Still Need Help?</h2>
          <p>
            Contact our support team at{' '}
            <a href="mailto:support@voeq.ng" className="info-link">support@voeq.ng</a>. 
            We typically respond within 24 hours.
          </p>
        </section>
      </div>
    </InfoPageShell>
  );
}
