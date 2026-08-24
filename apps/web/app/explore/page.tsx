import { Explore } from "@/components/explore/Explore";
import { getCurrentIdentity } from "@/lib/session";
import { campuses } from "@voeq/data";

/**
 * /explore — the SINGLE discover surface (PG-PUB-002, Doc 04).
 * Renders the loadExplore-driven Explore component (filters/sort/search/campus all
 * real). Campus is dynamic: resolved from the session identity when authed, else the
 * public default. VS4.9 — no longer a hardcoded NMU; no duplicated browse grid.
 * 
 * Now reads URL params: ?q= (search query) and ?category= (category slug)
 */
export default async function ExplorePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string }>;
}) {
  const identity = await getCurrentIdentity();
  const campus = identity?.campus ?? campuses[0]?.id ?? "NMU";
  const params = await searchParams;

  return (
    <div className="explore-page">
      <Explore 
        campus={campus} 
        initialQuery={params.q}
        categoryPreset={params.category}
      />
    </div>
  );
}
