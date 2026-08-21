import Link from 'next/link';
import { Store } from 'lucide-react';
import { campuses } from '@voeq/data';

export function EmptyState() {
  const defaultCampus = campuses.find(c => c.isDefault) || campuses[0];

  return (
    <div className="browse-empty">
      <div className="browse-empty-icon">
        <Store size={48} />
      </div>
      <h3 className="browse-empty-title">
        No vendors yet on {defaultCampus.name}
      </h3>
      <p className="browse-empty-text">
        Be the first to list your business and connect with students on campus.
      </p>
      <Link href="/for-vendors" className="browse-empty-cta">
        Become a vendor
      </Link>
    </div>
  );
}
