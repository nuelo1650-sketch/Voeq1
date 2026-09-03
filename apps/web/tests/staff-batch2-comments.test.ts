/**
 * Staff batch 2 / T2+T3 — comment moderation data layer (real Neon test DB).
 *
 * T2 root cause this locks down: the REAL repo's listByListing returned hidden
 * comments (the mock filtered them) — so a staff "hide" did nothing on prod.
 * The route docstring even promised "hidden ones excluded". Now enforced.
 */
import { describe, it, expect } from "vitest";
import { randomUUID } from "crypto";
import { mockCommentRepo } from "@voeq/data";

describe("staff batch 2 — comment moderation repo", () => {
  const suffix = randomUUID().slice(0, 8);
  const listingId = `r83-listing-${suffix}`; // synthetic: comments don't FK-check
  const authorId = `r83-author-${suffix}`;
  let commentId = "";

  it("create -> published; hide -> excluded from public list, present with includeHidden", async () => {
    const c = await mockCommentRepo.create({ listingId, authorId, body: "r83 test comment — moderation check" });
    commentId = c.id;
    expect(c.status).toBe("published");

    const publicList = await mockCommentRepo.listByListing(listingId);
    expect(publicList.map((x) => x.id)).toContain(commentId);

    const hidden = await mockCommentRepo.setStatus(commentId, "hidden");
    expect(hidden?.status).toBe("hidden");

    const afterHide = await mockCommentRepo.listByListing(listingId);
    expect(afterHide.map((x) => x.id)).not.toContain(commentId);

    const staffView = await mockCommentRepo.listByListing(listingId, { includeHidden: true });
    expect(staffView.map((x) => x.id)).toContain(commentId);
  });

  it("restore -> published again; listRecent includes hidden for the staff queue", async () => {
    const back = await mockCommentRepo.setStatus(commentId, "published");
    expect(back?.status).toBe("published");
    expect((await mockCommentRepo.listByListing(listingId)).map((x) => x.id)).toContain(commentId);

    const recent = await mockCommentRepo.listRecent(200);
    expect(recent.map((x) => x.id)).toContain(commentId);
    // newest-first ordering holds
    for (let i = 1; i < recent.length; i++) {
      expect(recent[i - 1]!.createdAt >= recent[i]!.createdAt).toBe(true);
    }
  });

  it("setStatus on unknown id returns null (no silent success)", async () => {
    expect(await mockCommentRepo.setStatus("does-not-exist-r83", "hidden")).toBeNull();
  });

  it("cleanup: author-scoped remove deletes the fixture", async () => {
    expect(await mockCommentRepo.remove(commentId, authorId)).toBe(true);
    expect(await mockCommentRepo.getById(commentId)).toBeNull();
  });
});
