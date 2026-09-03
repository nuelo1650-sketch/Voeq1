/**
 * Staff batch 1 — suspension auto-expiry sweep (real Neon test DB path).
 */
import { describe, it, expect } from "vitest";
import { randomUUID } from "crypto";
import {
  mockIdentityRepo,
  mockNotificationRepo,
  reinstateExpiredSuspensions,
  liftExpiredSuspension,
} from "@voeq/data";

async function makeSuspended(expiresAt: string | null): Promise<string> {
  const ident = await mockIdentityRepo.createPending({
    email: `r82-sweep-${randomUUID().slice(0, 8)}@voeq.test`,
    name: "R82 Sweep Test",
    passwordHash: "x",
    method: "email",
    intent: "shopper",
  });
  await mockIdentityRepo.setStatus(ident.id, "active");
  await mockIdentityRepo.setStatus(ident.id, "suspended");
  if (expiresAt) await mockIdentityRepo.patch(ident.id, { suspensionExpiresAt: expiresAt });
  return ident.id;
}

describe("staff batch 1 — auto-expiry sweep", () => {
  it("lifts suspensions whose expiry has passed, notifies, leaves future ones alone", async () => {
    const past = await makeSuspended(new Date(Date.now() - 60_000).toISOString());
    const future = await makeSuspended(new Date(Date.now() + 60 * 60_000).toISOString());
    const noExpiry = await makeSuspended(null);

    const report = await reinstateExpiredSuspensions();
    expect(report.ids).toContain(past);
    expect(report.ids).not.toContain(future);
    expect(report.ids).not.toContain(noExpiry);

    expect((await mockIdentityRepo.getById(past))?.accountStatus).toBe("active");
    expect((await mockIdentityRepo.getById(past))?.suspensionExpiresAt).toBeNull();
    expect((await mockIdentityRepo.getById(future))?.accountStatus).toBe("suspended");
    expect((await mockIdentityRepo.getById(noExpiry))?.accountStatus).toBe("suspended");

    const notes = await mockNotificationRepo.list(past);
    expect(notes.some((n) => n.title === "Your suspension has ended")).toBe(true);

    // idempotent: second sweep does not touch it again
    const again = await reinstateExpiredSuspensions();
    expect(again.ids).not.toContain(past);

    // cleanup
    await mockIdentityRepo.setStatus(future, "deleted");
    await mockIdentityRepo.setStatus(noExpiry, "deleted");
  });

  it("liftExpiredSuspension returns false for non-suspended and future rows", async () => {
    expect(await liftExpiredSuspension("does-not-exist")).toBe(false);
    const future = await makeSuspended(new Date(Date.now() + 3_600_000).toISOString());
    expect(await liftExpiredSuspension(future)).toBe(false);
    expect((await mockIdentityRepo.getById(future))?.accountStatus).toBe("suspended");
    await mockIdentityRepo.setStatus(future, "deleted");
  });
});
