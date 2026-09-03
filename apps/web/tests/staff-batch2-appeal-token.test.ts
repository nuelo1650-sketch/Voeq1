/**
 * Staff batch 2 / T6 — appeal token unit tests.
 * Pure crypto: no DB needed, so these run in the default vitest pass.
 */
import { describe, it, expect, beforeAll } from "vitest";

// The token module reads the secret lazily (per call), so setting it here is fine.
process.env.VOEQ_SESSION_SECRET = "unit-test-secret-not-a-real-one";

import { mintAppealToken, verifyAppealToken, appealLink } from "@voeq/data";

describe("appeal tokens (batch 2 / T6)", () => {
  const ID = "11111111-2222-3333-4444-555555555555";
  const EMAIL = "Someone@Example.com";

  it("round-trips: token verifies for the same identity+email", () => {
    const t = mintAppealToken(ID, EMAIL);
    expect(verifyAppealToken(t, "someone@example.com")).toBe(ID); // case-insensitive email
  });

  it("rejects a wrong claimed email (no existence oracle without the right pair)", () => {
    const t = mintAppealToken(ID, EMAIL);
    expect(verifyAppealToken(t, "attacker@example.com")).toBeNull();
  });

  it("rejects a tampered signature", () => {
    const t = mintAppealToken(ID, EMAIL);
    const dot = t.indexOf(".");
    const sig = t.slice(dot + 1);
    const flipped = (sig[0] === "A" ? "B" : "A") + sig.slice(1);
    expect(verifyAppealToken(`${t.slice(0, dot + 1)}${flipped}`, EMAIL)).toBeNull();
  });

  it("rejects a token re-bound to a different identity", () => {
    const t = mintAppealToken(ID, EMAIL);
    const other = mintAppealToken("99999999-8888-7777-6666-555555555555", EMAIL);
    // swap identity segment of t with other's signature
    expect(verifyAppealToken(`${other.split(".")[0]}.${t.split(".")[1]}`, EMAIL)).toBeNull();
  });

  it("rejects malformed garbage without throwing", () => {
    for (const junk of ["", ".", "abc", "abc.", ".abc", "a.b.c", "%%%", "x.y".repeat(500)]) {
      expect(() => verifyAppealToken(junk, EMAIL)).not.toThrow();
      expect(verifyAppealToken(junk, EMAIL)).toBeNull();
    }
  });

  it("is deterministic (stateless — same inputs, same token)", () => {
    expect(mintAppealToken(ID, EMAIL)).toBe(mintAppealToken(ID, EMAIL));
  });

  it("appealLink builds an absolute /appeal?t= URL", () => {
    const link = appealLink(ID, EMAIL);
    expect(link).toMatch(/^https?:\/\/[^/]+\/appeal\?t=[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/);
    const t = decodeURIComponent(link.split("?t=")[1]);
    expect(verifyAppealToken(t, EMAIL)).toBe(ID);
  });
});
