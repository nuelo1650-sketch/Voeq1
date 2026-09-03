/**
 * Staff batch 1 — enforcement ladder + auth forensics (data layer).
 * Runs against the isolated test Neon DB (vitest.config rewrites DATABASE_URL
 * to /neondb_test), so this exercises the REAL repo path, not the mock.
 */
import { describe, it, expect, beforeAll } from "vitest";
import { randomUUID } from "crypto";
import { mockIdentityRepo, mockSessionRepo } from "@voeq/data";
import { mockAuthEventStore, recordAuthEvent } from "@voeq/data";

const email = `r82-ladder-${randomUUID().slice(0, 8)}@voeq.test`;

describe("staff batch 1 — data layer", () => {
  let iid: string;

  beforeAll(async () => {
    const ident = await mockIdentityRepo.createPending({
      email,
      name: "R82 Ladder Test",
      passwordHash: "x",
      method: "email",
      intent: "shopper",
    });
    iid = ident.id;
    await mockIdentityRepo.setStatus(iid, "active");
  });

  it("ladder fields round-trip through patch (real Neon path)", async () => {
    const patched = await mockIdentityRepo.patch(iid, {
      suspensionExpiresAt: "2027-01-01T00:00:00.000Z",
      warningCount: 2,
    });
    expect(patched?.suspensionExpiresAt).toBe("2027-01-01T00:00:00.000Z");
    expect(patched?.warningCount).toBe(2);
    const again = await mockIdentityRepo.getById(iid);
    expect(again?.suspensionExpiresAt).toBe("2027-01-01T00:00:00.000Z");
    expect(again?.warningCount).toBe(2);
    // cleanup the patch
    await mockIdentityRepo.patch(iid, { suspensionExpiresAt: null, warningCount: 0 });
  });

  it("setStatus(suspended) eagerly revokes ALL sessions (parity with mock)", async () => {
    const s1 = await mockSessionRepo.create(iid);
    const s2 = await mockSessionRepo.create(iid);
    expect(await mockSessionRepo.get(s1.id)).not.toBeNull();
    await mockIdentityRepo.setStatus(iid, "suspended");
    expect(await mockSessionRepo.get(s1.id)).toBeNull();
    expect(await mockSessionRepo.get(s2.id)).toBeNull();
    const after = await mockIdentityRepo.getById(iid);
    expect(after?.accountStatus).toBe("suspended");
    await mockIdentityRepo.setStatus(iid, "active");
  });

  it("setStatus(banned) also eagerly revokes; reinstate does not", async () => {
    const s = await mockSessionRepo.create(iid);
    await mockIdentityRepo.setStatus(iid, "banned");
    expect(await mockSessionRepo.get(s.id)).toBeNull();
    const s2 = await mockSessionRepo.create(iid);
    await mockIdentityRepo.setStatus(iid, "active");
    expect(await mockSessionRepo.get(s2.id)).not.toBeNull();
    await mockSessionRepo.revoke(s2.id);
  });

  it("recordAuthEvent writes + queryBy reads back IP/UA (append-only)", async () => {
    await recordAuthEvent({
      identityId: iid,
      event: "login",
      email,
      ip: "102.89.24.7",
      userAgent: "Mozilla/5.0 (test-ua-r82)",
    });
    const rows = await mockAuthEventStore.queryBy({ identityId: iid, limit: 10 });
    expect(rows.length).toBeGreaterThanOrEqual(1);
    const mine = rows.find((r) => r.userAgent === "Mozilla/5.0 (test-ua-r82)");
    expect(mine).toBeTruthy();
    expect(mine?.ip).toBe("102.89.24.7");
    expect(mine?.event).toBe("login");
  });

  it("recordAuthEvent never throws on garbage input (fire-and-forget)", async () => {
    // unknown event kind is still a string at the DB layer — must not throw out
    await expect(
      recordAuthEvent({ identityId: null, event: "login_failed", email: "x@y.z", ip: null, userAgent: null }),
    ).resolves.toBeUndefined();
  });
});
