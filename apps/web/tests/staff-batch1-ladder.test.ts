/**
 * Staff batch 1 — enforcement notification contract + ladder rules.
 * Pure data-layer tests (mock store; no Neon needed).
 */
import { describe, it, expect } from "vitest";
import { notifyEnforcement, notifyContentAction, APPEAL_LINE, mockNotificationRepo, canAccountAction } from "@voeq/data";

async function latest(recipientId: string, title: string) {
  const rows = await mockNotificationRepo.list(recipientId);
  return rows.find((n) => n.title === title);
}

describe("staff batch 1 — enforcement notifications", () => {
  it("suspend notice carries reason, expiry, and appeal line", async () => {
    await notifyEnforcement({
      recipientId: "t-1",
      action: "suspend",
      reason: "Repeated fake listings after two warnings",
      expiresAt: "2027-01-01T00:00:00.000Z",
    });
    const n = await latest("t-1", "Your account is suspended");
    expect(n).toBeTruthy();
    expect(n!.type).toBe("account_action");
    expect(n!.body).toContain("Repeated fake listings");
    // Body uses human-readable UTC ("Fri, 01 Jan 2027 00:00:00 GMT"), not raw ISO.
    expect(n!.body).toContain("01 Jan 2027");
    expect(n!.body).toContain(APPEAL_LINE);
  });

  it("warn notice includes warning number", async () => {
    await notifyEnforcement({ recipientId: "t-2", action: "warn", reason: "First notice: misleading photos", warningCount: 1 });
    const n = await latest("t-2", "Warning on your account");
    expect(n!.body).toContain("warning #1");
  });

  it("content action notice keeps refId for deep-link", async () => {
    await notifyContentAction({ recipientId: "t-3", title: "Your listing was removed", reason: "Prohibited item", refId: "L-9" });
    const n = await latest("t-3", "Your listing was removed");
    expect(n!.refId).toBe("L-9");
    expect(n!.type).toBe("account_action");
  });
});

describe("staff batch 1 — canAccountAction ladder", () => {
  it("moderator cannot warn (admin+ required)", () => {
    expect(canAccountAction("moderator", "a", "b", null, "warn").ok).toBe(false);
  });
  it("admin can warn/suspend/ban/reinstate peers", () => {
    for (const action of ["warn", "suspend", "ban", "reinstate"] as const) {
      expect(canAccountAction("admin", "a", "b", "moderator", action).ok).toBe(true);
    }
  });
  it("no self-action, super_admin protected", () => {
    expect(canAccountAction("super_admin", "a", "a", null, "ban").ok).toBe(false);
    expect(canAccountAction("admin", "a", "s", "super_admin", "suspend").ok).toBe(false);
  });
});
