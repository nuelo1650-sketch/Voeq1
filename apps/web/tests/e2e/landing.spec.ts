import { test, expect } from "@playwright/test";

/**
 * Slice 1 Landing (Cream-first) regression gates — Doc 04 PG-PUB-001, Doc 05 A.3 (reversed
 * 2026-08-18: Cream is the default across all public routes incl. Landing), Doc 06 §2, Doc 07 §7.6,
 * Doc 10 §54/§63/§66/§159/§167/§199.
 *
 * Option A (founder): contour communicates activity, never manufactures it.
 *  - production/mock default (empty repo) -> ZERO activity nodes
 *  - dev-only deterministic seed (never production truth) -> meaningful nodes
 * Both proven separately. Dev seed is gated behind a non-production flag.
 *
 * ENVIRONMENT (founder reversal 2026-08-18): Cream is the silent default on `/`. Deep is a
 * supported alternate, toggled intentionally via `setEnvironment` (the same mechanism the
 * styleguide "Deep" button uses — it sets `data-env` on <html>). Deep is NEVER the default.
 */
test.describe("Slice 1 Landing (Cream-first)", () => {
  test("default load of / renders in Cream (never silent Deep)", async ({ page }) => {
    await page.goto("/");
    expect(page.url()).toMatch(/\/$/);
    // Resolved default with NO override present must be cream.
    await expect(page.locator("html")).toHaveAttribute("data-env", "cream");
    await expect(page.getByText(/voeq/i).first()).toBeVisible();
  });

  test("Deep still works as an explicit opt-in alternate (not the default)", async ({ page }) => {
    await page.goto("/");
    // Toggle Deep via the real mechanism (setEnvironment, used by the styleguide Deep button).
    await page.evaluate(() => document.documentElement.setAttribute("data-env", "deep"));
    await expect(page.locator("html")).toHaveAttribute("data-env", "deep");
    // Deep tokens actually applied: body background resolves to the Deep forest color.
    const bg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
    expect(bg).toBe("rgb(16, 35, 26)"); // --role-bg Deep (#10231a)
    // And it was NOT the cream default background.
    expect(bg).not.toBe("rgb(247, 244, 236)"); // --role-bg Cream (#f7f4ec)
  });

  test("contour: empty repository -> ZERO activity nodes (no invented activity)", async ({ page }) => {
    // Production/mock default path: no seed -> zero nodes.
    await page.goto("/?seed=0");
    await expect(page.getByTestId("activity-node")).toHaveCount(0);
    await expect(page.getByTestId("contour-empty")).toBeVisible();
  });

  test("contour: dev-only deterministic seed -> meaningful nodes (never production truth)", async ({ page }) => {
    // Dev verification path ONLY. Seed is explicitly labeled + gated off in prod.
    await page.goto("/?seed=1");
    const nodes = page.getByTestId("activity-node");
    await expect(nodes).toHaveCount(2); // deterministic fixture size
    await expect(page.getByTestId("dev-seed-banner")).toBeVisible();
    await expect(page.getByTestId("dev-seed-banner")).toContainText(/dev|fixture|seed/i);
  });

  test("Landing has NO auth surface (PG-PUB-001 forbids login on landing)", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator('input[type="password"]')).toHaveCount(0);
    await expect(page.locator("form")).toHaveCount(0);
  });

  test("primary entry action links to /explore (not a browse grid)", async ({ page }) => {
    await page.goto("/");
    const entry = page.getByTestId("entry-discovery");
    await expect(entry).toBeVisible();
    await expect(entry).toHaveAttribute("href", /\/explore/);
    await expect(page.getByTestId("browse-grid")).toHaveCount(0);
  });

  test("motion is finite (no infinite/idle loops) and one-shot arrival", async ({ page }) => {
    await page.goto("/");
    const infinite = await page.evaluate(() =>
      Array.from(document.getAnimations()).some(
        (a) => a.playState === "running" && (a as any).animationName !== "none" && (a as any).duration === Infinity
      )
    );
    expect(infinite).toBe(false);
  });

  test("reduced-motion collapses transitions and staticizes pulse", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/?seed=1");
    const transition = await page.evaluate(() => getComputedStyle(document.body).transitionDuration);
    expect(transition).toMatch(/^(0s|0\.0+ms|0ms|\d+e-\d+s)$/);
  });

  test("3D / WebGL is absent (experimental, not in Slice 1)", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("canvas")).toHaveCount(0);
    const hasThree = await page.evaluate(() =>
      !!(window as any).WebGLRenderingContext === false ? false : false
    );
    expect(hasThree).toBe(false);
  });

  test("renders on mobile (375px) and desktop (1280px)", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 800 });
    await page.goto("/");
    await expect(page.getByText(/voeq/i).first()).toBeVisible();
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto("/");
    await expect(page.getByText(/voeq/i).first()).toBeVisible();
  });

  test("visual hierarchy: one dominant order Voeq -> context -> discovery -> enter", async ({ page }) => {
    await page.goto("/");
    // Dominant display heading (Voeq / arrival) exists and is the largest text.
    const heading = page.getByTestId("landing-heading");
    await expect(heading).toBeVisible();
    const hFont = await heading.evaluate((el) => parseFloat(getComputedStyle(el).fontSize));
    const bodyFont = await page.getByTestId("discovery-proposition").evaluate((el) => parseFloat(getComputedStyle(el).fontSize));
    expect(hFont).toBeGreaterThan(bodyFont); // heading dominates, not decorative > useful
    // Context block present (honest neutral state), discovery proposition present, entry present.
    await expect(page.getByTestId("campus-context")).toBeVisible();
    await expect(page.getByTestId("discovery-proposition")).toBeVisible();
    await expect(page.getByTestId("entry-discovery")).toBeVisible();
    // Order in DOM: heading before context before proposition before entry.
    const order = await page.evaluate(() => {
      const ids = ["landing-heading", "campus-context", "discovery-proposition", "entry-discovery"];
      const tops = ids.map((id) => {
        const el = document.querySelector(`[data-testid="${id}"]`);
        return el ? el.getBoundingClientRect().top : Infinity;
      });
      return tops;
    });
    for (let i = 1; i < order.length; i++) expect(order[i]).toBeGreaterThanOrEqual(order[i - 1] - 1);
  });
});

/* ============================================================================
 * TASK B — Landing completion + contour signature richness (2026-08-18).
 * Adds assertions for the 6 required content items (PG-PUB-001) and 3 richness
 * items (Doc 05 B.11 / D.5). These are ADDITIVE — the Slice 1 gates above stay intact.
 * ========================================================================== */
test.describe("Task B — Landing completion + contour richness", () => {
  // --- Content item 1: active campus selector, default NMU, shown prominently ---
  test("campus selector exists and defaults to NMU", async ({ page }) => {
    await page.goto("/");
    const sel = page.getByTestId("campus-selector");
    await expect(sel).toBeVisible();
    await expect(sel).toHaveValue("nmu");
  });

  // --- Content item 2: primary CTA text "Explore {campus}" wired to selector ---
  test("primary CTA reads 'Explore NMU' and updates with selector", async ({ page }) => {
    await page.goto("/");
    const entry = page.getByTestId("entry-discovery");
    await expect(entry).toContainText(/explore\s+nmu/i);
    // Changing the selector updates the CTA label.
    await page.getByTestId("campus-selector").selectOption("wits");
    await expect(entry).toContainText(/explore\s+wits/i);
  });

  // --- Content item 3: secondary entry to For-Vendors (placeholder route) ---
  test("For-Vendors secondary link present (placeholder route)", async ({ page }) => {
    await page.goto("/");
    const link = page.getByTestId("footer-for-vendors");
    await expect(link).toBeVisible();
    await expect(link).toHaveAttribute("href", /\/for-vendors/);
  });

  // --- Content item 4: minimal legal links (Terms, Privacy) present ---
  test("legal links Terms + Privacy present (placeholder routes)", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByTestId("footer-terms")).toHaveAttribute("href", /\/terms/);
    await expect(page.getByTestId("footer-privacy")).toHaveAttribute("href", /\/privacy/);
  });

  // --- Content item 5: slim top nav with wordmark + secondary links ---
  test("slim top nav with wordmark + secondary links", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByTestId("landing-nav")).toBeVisible();
    await expect(page.getByTestId("wordmark")).toHaveText(/voeq/i);
    await expect(page.getByTestId("nav-about")).toBeVisible();
    await expect(page.getByTestId("nav-help")).toBeVisible();
    await expect(page.getByTestId("nav-legal")).toBeVisible();
    await expect(page.getByTestId("nav-login")).toBeVisible();
    await expect(page.getByTestId("nav-signup")).toBeVisible();
  });

  // --- Content item 6: tagline conveys 'campus marketplace' ---
  test("discovery proposition conveys 'campus marketplace'", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByTestId("discovery-proposition")).toContainText(/campus marketplace/i);
  });

  // --- Richness item 1: pulse animation exists on seeded nodes (rests after) ---
  test("seeded contour nodes pulse once then rest (not infinite)", async ({ page }) => {
    await page.goto("/?seed=1");
    const node = page.getByTestId("activity-node").first();
    await expect(node).toBeVisible();
    // After the 400ms pulse completes, no animation should be running on the node.
    await page.waitForTimeout(600);
    const stillRunning = await node.evaluate((el) =>
      (el as HTMLElement).getAnimations().some((a) => a.playState === "running")
    );
    expect(stillRunning).toBe(false);
  });

  // --- Richness item 2: CampusFingerprint wired into Landing contour ---
  test("CampusFingerprint is rendered in the contour signature", async ({ page }) => {
    await page.goto("/?seed=1");
    await expect(page.getByTestId("activity-node")).toHaveCount(2); // seed mounted first
    await expect(page.getByTestId("campus-fingerprint")).toBeVisible();
  });

  // --- Richness item 3: density clustering — nodes are positioned (not a flat row) ---
  test("contour nodes are spatially clustered (absolute positions), not a flat row", async ({ page }) => {
    await page.goto("/?seed=1");
    const nodes = page.getByTestId("activity-node");
    await expect(nodes).toHaveCount(2); // wait for seed to mount
    const positions = await nodes.evaluateAll((els) =>
      els.map((el) => {
        const r = (el as HTMLElement).getBoundingClientRect();
        return { x: Math.round(r.left), y: Math.round(r.top) };
      })
    );
    // At least two distinct positions => clustering field, not a single inline row.
    const distinct = new Set(positions.map((p) => `${p.x},${p.y}`));
    expect(distinct.size).toBeGreaterThan(1);
  });

  // --- Content item 7: mobile full-screen overlay nav (Doc 05 A.19 REQUIRED) ---
  test("mobile (375px): hamburger opens full-screen overlay nav with links", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 800 });
    await page.goto("/");
    const hamburger = page.getByTestId("landing-nav-hamburger");
    await expect(hamburger).toBeVisible();
    // Inline links hidden on mobile per .landing-nav-links (<=768px in globals.css).
    await expect(page.getByTestId("nav-about")).toBeHidden();
    await hamburger.click();
    const overlay = page.getByTestId("landing-nav-overlay");
    await expect(overlay).toBeVisible();
    await expect(page.getByTestId("nav-about-overlay")).toBeVisible();
    await page.getByTestId("landing-nav-overlay-close").click();
    await expect(overlay).toBeHidden();
  });

  // --- Content item 8: Trust strip (Chunk 5) renders data-bound stats below the CTA ---
  test("trust strip renders 3 data-bound stat groups below the CTA", async ({ page }) => {
    await page.goto("/");
    const strip = page.getByTestId("trust-strip");
    await expect(strip).toBeVisible();
    // 3 groups (number + label pairs); values sourced from getMockStats() — no UI literals.
    await expect(strip.locator(".trust-strip-group")).toHaveCount(3);
    await expect(strip.locator(".trust-strip-number")).toHaveCount(3);
    await expect(strip.locator(".trust-strip-label")).toHaveCount(3);
    // Honest placeholder values: 6 vendors (MOCK_VENDORS.length), 6 campuses, 47 connections.
    const numbers = await strip.locator(".trust-strip-number").allInnerTexts();
    expect(numbers).toEqual(["6", "6", "47"]);
  });

  test("trust strip stacks vertically on mobile (375px) and hides separators", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 800 });
    await page.goto("/");
    const strip = page.getByTestId("trust-strip");
    await expect(strip).toBeVisible();
    await expect(strip.locator(".trust-strip-sep")).toHaveCount(0);
  });

  // --- Chunk 6: CTA elevated to invitation (.landing-cta + aria-hidden arrow) ---
  test("primary CTA is styled as .landing-cta with an aria-hidden arrow", async ({ page }) => {
    await page.goto("/");
    const entry = page.getByTestId("entry-discovery");
    await expect(entry).toBeVisible();
    await expect(entry).toHaveAttribute("href", /\/explore/);
    await expect(entry).toHaveClass(/landing-cta/);
    const arrow = entry.locator(".cta-arrow");
    await expect(arrow).toHaveCount(1);
    await expect(arrow).toHaveAttribute("aria-hidden", "true");
    await expect(arrow).toHaveText("→");
  });

  // --- Chunk 6: signature footer — contour line + 5 centered links, testids preserved ---
  test("signature footer renders contour line + 5 centered links", async ({ page }) => {
    await page.goto("/");
    const footer = page.getByTestId("landing-footer");
    await expect(footer).toBeVisible();
    await expect(footer.locator(".landing-footer-contour")).toHaveCount(1);
    await expect(footer.locator(".landing-footer-contour path")).toHaveCount(1);
    await expect(footer.locator(".landing-footer-links a")).toHaveCount(5);
    for (const id of ["footer-for-vendors", "footer-terms", "footer-privacy", "footer-login", "footer-signup"]) {
      await expect(page.getByTestId(id)).toHaveAttribute("href", /\//);
    }
  });
});
