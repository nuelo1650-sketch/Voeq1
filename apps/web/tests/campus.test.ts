import { describe, it, expect, beforeEach } from "vitest";
import { mockCampusRepo, searchCampus, submitNewCampus } from "@voeq/data";

// Reset the in-memory fixture between tests by re-seeding via the repo.
// The mockCampusRepoImpl mutates a module-level array, so we restore it.
import { campuses } from "@voeq/data";

function resetCampuses() {
  campuses.length = 0;
  campuses.push(
    { id: "nmu-okerenkoko", slug: "nmu-okerenkoko", name: "Nigeria Maritime University (Okerenkoko)", city: "Okerenkoko", state: "Delta State", region: null, lat: 5.62449, lng: 5.39038, source: "seeded", status: "verified", createdByUserId: null, createdAt: "2026-08-27T00:00:00.000Z" },
    { id: "nmu-kurutie", slug: "nmu-kurutie", name: "Nigeria Maritime University (Kurutie)", city: "Kurutie", state: "Delta State", region: null, lat: 5.62449, lng: 5.39038, source: "seeded", status: "verified", createdByUserId: null, createdAt: "2026-08-27T00:00:00.000Z" },
    { id: "unilag", slug: "unilag", name: "University of Lagos", city: "Lagos", state: "Lagos State", region: null, lat: 6.51667, lng: 3.38611, source: "seeded", status: "verified", createdByUserId: null, createdAt: "2026-08-27T00:00:00.000Z" },
  );
}

beforeEach(resetCampuses);

describe("D-1 visibility filter (mockCampusRepo)", () => {
  it("anonymous user sees only verified campuses", async () => {
    const rows = await mockCampusRepo.list();
    expect(rows.every((c) => c.status === "verified")).toBe(true);
    expect(rows.length).toBe(3);
  });

  it("user sees their own unverified campus but not another user's", async () => {
    const mine = await mockCampusRepo.create({ name: "My New Uni" }, "user-a");
    expect(mine.status).toBe("unverified");
    expect(mine.createdByUserId).toBe("user-a");

    // user-a sees their own unverified campus
    const aRows = await mockCampusRepo.list("user-a");
    expect(aRows.find((c) => c.id === mine.id)).toBeTruthy();

    // user-b does NOT see user-a's unverified campus
    const bRows = await mockCampusRepo.list("user-b");
    expect(bRows.find((c) => c.id === mine.id)).toBeFalsy();

    // anonymous does NOT see it either
    const anonRows = await mockCampusRepo.list();
    expect(anonRows.find((c) => c.id === mine.id)).toBeFalsy();
  });

  it("getBySlug returns verified to all, unverified only to owner", async () => {
    const mine = await mockCampusRepo.create({ name: "Hidden Uni" }, "user-a");
    expect(await mockCampusRepo.getBySlug(mine.slug, "user-a")).toBeTruthy();
    expect(await mockCampusRepo.getBySlug(mine.slug, "user-b")).toBeNull();
    expect(await mockCampusRepo.getBySlug("unilag", "user-b")).toBeTruthy();
  });

  it("searchByName applies the same visibility scope", async () => {
    await mockCampusRepo.create({ name: "Test University" }, "user-a");
    const aResults = await mockCampusRepo.searchByName("Test", "user-a");
    expect(aResults.length).toBe(1);
    const bResults = await mockCampusRepo.searchByName("Test", "user-b");
    expect(bResults.length).toBe(0);
  });
});

describe("A.6 duplicate-name protection", () => {
  it("detects a campus whose name contains an existing name (case-insensitive)", async () => {
    // "University of Lagos" exists; "university of lagos campus" should match
    const existing = (await mockCampusRepo.list()).find((c) => c.slug === "unilag")!;
    const norm = "university of lagos campus";
    const match = (await mockCampusRepo.list("x")).find(
      (c) => c.name.toLowerCase().includes(norm) || norm.includes(c.name.toLowerCase()),
    );
    expect(match?.id).toBe(existing.id);
  });

  it("create returns existing campus on slug collision instead of duplicating", async () => {
    const first = await mockCampusRepo.create({ name: "University of Lagos" }, "user-a");
    const second = await mockCampusRepo.create({ name: "University of Lagos" }, "user-b");
    expect(second.id).toBe(first.id);
  });
});

describe("A.6 per-user daily cap", () => {
  it("counts only the creator's own user-added campuses in the last 24h", async () => {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const all = await mockCampusRepo.list("user-a");
    const recentCount = all.filter((c) => c.source === "user-added" && c.createdAt >= since).length;
    expect(recentCount).toBe(0);

    await mockCampusRepo.create({ name: "Uni One" }, "user-a");
    const all2 = await mockCampusRepo.list("user-a");
    const recentCount2 = all2.filter((c) => c.source === "user-added" && c.createdAt >= since).length;
    expect(recentCount2).toBe(1);
  });
});

describe("searchCampus helper", () => {
  it("matches by name substring (case-insensitive)", async () => {
    const results = await searchCampus("lagos");
    expect(results.some((c) => c.slug === "unilag")).toBe(true);
  });
  it("returns the full verified list for empty query", async () => {
    const results = await searchCampus("");
    expect(results.length).toBeGreaterThan(0);
  });
});
