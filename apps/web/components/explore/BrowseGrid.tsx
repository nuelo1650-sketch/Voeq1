import { VendorCard } from '../landing/VendorCard';
import type { VendorSummary } from '@voeq/data';

interface BrowseGridProps {
  vendors: VendorSummary[];
}

export function BrowseGrid({ vendors }: BrowseGridProps) {
  return (
    <div className="browse-grid">
      {vendors.map((vendor) => (
        <VendorCard key={vendor.id} vendor={vendor} />
      ))}
    </div>
  );
}
