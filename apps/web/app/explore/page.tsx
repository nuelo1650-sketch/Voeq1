import { Explore } from "@/components/explore/Explore";
import { ExploreMB } from "@/components/explore/mb/ExploreMB";
import { getCurrentIdentity } from "@/lib/session";
import { mockCampusRepo, resolvePublicCategories } from "@voeq/data";

/**
 * /explore — the SINGLE discover surface (PG-PUB-002, Doc 04).
 * Renders the loadExplore-driven Explore component (filters/sort/search/campus all
 * real). Campus is dynamic: resolved from the session identity when authed, else the
 * public default (first verified campus). VS4.9 — no hardcoded campus; no duplicated grid.
 *
 * Reads URL params: ?q= (search query) and ?category= (category slug).
 *
 * MONEY BAG CANARY (D8): ?next=mb renders the rebuilt MB floor (ExploreMB)
 * side-by-side with the existing explore — old path untouched until the 48h
 * canary passes and the founder cuts over. Absent param = current build.
 */
export default async function ExplorePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string; next?: string }>;
}) {
  const identity = await getCurrentIdentity();
  const verified = await mockCampusRepo.list(identity?.id);
  const campus = identity?.campus ?? verified[0]?.id ?? "nmu-okerenkoko";
  const params = await searchParams;
  // CHIPS SEAM: live taxonomy (seed ∪ config-console DB rows, deactivated
  // excluded) for chips, filter dropdown, and search suggestions.
  const cats = await resolvePublicCategories();
  const categoryOptions = cats.map((c) => ({ slug: c.slug, label: c.name }));

  if (params.next === "mb") {
    return (
      <div className="explore-page">
        <ExploreMB
          campus={campus}
          initialQuery={params.q}
          categoryPreset={params.category}
          categoryOptions={categoryOptions}
        />
      </div>
    );
  }

  return (
    <div className="explore-page">
      <Explore
        campus={campus}
        initialQuery={params.q}
        categoryPreset={params.category}
        viewerIdentityId={identity?.id}
        categoryOptions={categoryOptions}
      />
    </div>
  );
}
