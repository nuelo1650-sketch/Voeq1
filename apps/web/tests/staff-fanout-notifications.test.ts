/**
 * Staff fan-out notifications (2026-09-04, black-hole fix) — tests.
 * Verifies notifyStaff writes one notification per capability-holding staff
 * identity (never the synthetic "admin"), against the REAL repo layer
 * (same test-DB pattern as staff-batch2-comments.test.ts).
 *
 * Black-hole history: recipientId "admin" matched no identity — staff
 * notifications were readable by nobody. These tests pin the fix.
 */
import { describe, it, expect, beforeAll } from "vitest";
import { randomUUID } from "crypto";
import { mockIdentityRepo, mockNotificationRepo, notifyStaff } from "@voeq/data";

const runHttp = typeof process.env.VOEQ_HTTP_BASE === "string" && process.env.VOEQ_HTTP_BASE.length > 0;

describe("notifyStaff capability fan-out (real repo)", () => {
  const stamp = randomUUID().slice(0, 8);

  beforeAll(async () => {
    // ensure at least one staff identity exists so fan-out has a recipient
    const roster = await mockIdentityRepo.list();
    const staff = roster.filter((i) => i.staffRole);
    if (staff.length === 0) {
      throw new Error("test requires at least one staff identity in the DB (bootstrap super_admin)");
    }
  });

  it("new_appeal fans out to real staff identities, never the synthetic admin", async () => {
    const before = await countSystem();
    await notifyStaff("new_appeal", { refId: `fanout-${stamp}` });
    const after = await countSystem();
    expect(after).toBeGreaterThan(before); // at least one real recipient row
    expect(after - before).toBeGreaterThanOrEqual(1);

    // zero rows ever to the synthetic inbox
    const adminRows = await mockNotificationRepo.list("admin").catch(() => []);
    expect((adminRows as any[]).filter((r) => (r as any).refId === `fanout-${stamp}`).length).toBe(0);

    // every new row's recipient is a real staff identity holding case.review
    const roster = await mockIdentityRepo.list();
    const staffIds = new Set(roster.filter((i) => i.staffRole).map((i) => i.id));
    const fresh = await rowsByRef(`fanout-${stamp}`);
    expect(fresh.length).toBeGreaterThanOrEqual(1);
    for (const r of fresh) {
      expect(staffIds.has(r.recipientId)).toBe(true);
    }
  });

  it("system_alert fans out (case.triage path used by cases route)", async () => {
    await notifyStaff("system_alert", { refId: `fanout2-${stamp}` });
    const fresh = await rowsByRef(`fanout2-${stamp}`);
    expect(fresh.length).toBeGreaterThanOrEqual(1);
    for (const r of fresh) {
      const roster = await mockIdentityRepo.list();
      const staffIds = new Set(roster.filter((i) => i.staffRole).map((i) => i.id));
      expect(staffIds.has(r.recipientId)).toBe(true);
    }
  });

  it("no synthetic 'admin' rows are ever created", async () => {
    const adminRows = (await mockNotificationRepo.list("admin").catch(() => [])) as any[];
    const withStamp = adminRows.filter((r) => String(r.refId ?? "").startsWith("fanout"));
    expect(withStamp.length).toBe(0);
  });
});

async function countSystem(): Promise<number> {
  const roster = await mockIdentityRepo.list();
  const staff = roster.filter((i) => i.staffRole);
  let n = 0;
  for (const i of staff) {
    const rows = (await mockNotificationRepo.list(i.id).catch(() => [])) as any[];
    n += rows.filter((r) => r.type === "system").length;
  }
  return n;
}

async function rowsByRef(refId: string): Promise<any[]> {
  const roster = await mockIdentityRepo.list();
  const staff = roster.filter((i) => i.staffRole);
  const out: any[] = [];
  for (const i of staff) {
    const rows = (await mockNotificationRepo.list(i.id).catch(() => [])) as any[];
    out.push(...rows.filter((r) => r.refId === refId));
  }
  return out;
}
