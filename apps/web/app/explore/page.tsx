import { Explore } from "@/components/explore/Explore";
import { getCurrentIdentity } from "@/lib/session";
import { mockCampusRepo } from "@voeq/data";

/**
 * /explore — the SINGLE discover surface (PG-PUB-002, Doc 04).
 * Renders the loadExplore-driven Explore component (filters/sort/search/campus all
 * real). Campus is dynamic: resolved from the session identity when authed, else the
 * public default (first verified campus). VS4.9 — no hardcoded campus; no duplicated grid.
 *
 * Reads URL params: ?q= (search query) and ?category= (category slug).
 */
export default async function ExplorePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string }>;
}) {
  const identity = await getCurrentIdentity();
  const verified = await mockCampusRepo.list(identity?.id);
  const campus = identity?.campus ?? verified[0]?.id ?? "nmu-okerenkoko";
  const params = await searchParams;

  return (
    <div className="explore-page">
      <Explore
        campus={campus}
        initialQuery={params.q}
        categoryPreset={params.category}
        viewerIdentityId={identity?.id}
      />
    </div>
  );
}
