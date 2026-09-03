/**
 * Staff batch 2 / P6b — auth_events retention purge (real Neon test DB path).
 *
 * Backdates rows via the `at` override, then asserts the 12-month cutoff:
 * 13-month-old events die, 11-month-old survive, cap drains in batches,
 * and the purge is idempotent.
 */
import { describe, it, expect } from "vitest";
import { randomUUID } from "crypto";
import {
  mockAuthEventStore,
  purgeAuthEventsOlderThan,
  AUTH_EVENT_RETENTION_MONTHS,
} from "@voeq/data";

function isoDaysAgo(days: number): string {
  return new Date(Date.now() - days * 24 * 60 * 60_000).toISOString();
}

describe("staff batch 2 — auth_events retention purge", () => {
  const tag = randomUUID().slice(0, 8);
  const email = `r83-purge-${tag}@voeq.test`;

  it("deletes events past the 12-month window and keeps recent ones", async () => {
    await mockAuthEventStore.log({ event: "login", email, ip: "10.0.0.1", at: isoDaysAgo(400) }); // 13.3mo — doomed
    await mockAuthEventStore.log({ event: "login", email, ip: "10.0.0.2", at: isoDaysAgo(330) }); // 11mo — keep

    const purged = await purgeAuthEventsOlderThan();
    expect(purged).toBeGreaterThanOrEqual(1);

    const remaining = await mockAuthEventStore.queryBy({ email });
    expect(remaining.length).toBe(1);
    expect(remaining[0]!.ip).toBe("10.0.0.2");

    // idempotent: second run deletes nothing for this email
    const before = await mockAuthEventStore.queryBy({ email });
    await purgeAuthEventsOlderThan();
    const after = await mockAuthEventStore.queryBy({ email });
    expect(after.length).toBe(before.length);
  });

  it("honors the per-call cap (drains in batches)", async () => {
    for (let i = 0; i < 3; i++) {
      await mockAuthEventStore.log({ event: "signup", email: `${tag}-cap-${i}@voeq.test`, at: isoDaysAgo(400) });
    }
    const first = await purgeAuthEventsOlderThan(Date.now(), 2);
    expect(first).toBe(2);
    const second = await purgeAuthEventsOlderThan(Date.now(), 2);
    expect(second).toBeGreaterThanOrEqual(1);
    for (let i = 0; i < 3; i++) {
      expect((await mockAuthEventStore.queryBy({ email: `${tag}-cap-${i}@voeq.test` })).length).toBe(0);
    }
  });

  it("retention window constant is 12 months (privacy promise in code)", () => {
    expect(AUTH_EVENT_RETENTION_MONTHS).toBe(12);
  });
});
