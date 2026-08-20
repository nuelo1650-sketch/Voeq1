import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Browse — Voeq",
};

/**
 * /browse — Phase B stub (founder 2026-08-20). Receives ?q= from the hero search form.
 * Minimal placeholder: echoes the query, states results span ALL campuses (campus-specific
 * filtering + category grid land in Phase C). No fake listings, no invented counts — honest
 * "coming together" state, not a broken-feature apology.
 *
 * Next.js 15: searchParams is a Promise — await it.
 */
export default async function BrowsePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = q?.trim() || "";

  return (
    <main data-testid="browse-page" className="browse-stub">
      <div className="browse-stub-inner">
        <h1 data-testid="browse-title">Browse</h1>
        <p data-testid="browse-query" className="browse-query">
          {query ? (
            <>
              Results for &ldquo;{query}&rdquo;
            </>
          ) : (
            <>Everything on Voeq</>
          )}
        </p>
        <p data-testid="browse-scope" className="browse-scope">
          Showing results across all campuses.
        </p>
      </div>
    </main>
  );
}
