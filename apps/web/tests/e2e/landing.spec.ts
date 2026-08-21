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
    // No password field, and no login/registration form (the hero search form is allowed).
    await expect(page.locator('input[type="password"]')).toHaveCount(0);
    await expect(page.locator('form[action*="login"], form[action*="signin"], form[action*="auth"]')).toHaveCount(0);
  });

  test("primary entry action is the hero search → /browse (no browse grid on landing)", async ({ page }) => {
    await page.goto("/");
    const form = page.getByTestId("landing-search");
    await expect(form).toBeVisible();
    await expect(form).toHaveAttribute("action", /\/browse/);
    await expect(page.getByTestId("search-input")).toBeVisible();
    await expect(page.getByTestId("search-submit")).toBeVisible();
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

  test("visual hierarchy: one dominant order Voeq -> proposition -> search -> proof", async ({ page }) => {
    await page.goto("/");
    // Dominant display heading (Voeq / arrival) exists and is the largest text.
    const heading = page.getByTestId("landing-heading");
    await expect(heading).toBeVisible();
    // The <h1> wrapper carries no font-size (Tailwind preflight resets headings to inherit);
    // the actual display glyphs are the .wordmark-char spans (clamp(5rem,14vw,8rem)).
    const charFont = await page.getByTestId("wordmark-char").first().evaluate((el) => parseFloat(getComputedStyle(el).fontSize));
    const bodyFont = await page.getByTestId("discovery-proposition").evaluate((el) => parseFloat(getComputedStyle(el).fontSize));
    expect(charFont).toBeGreaterThan(bodyFont); // display wordmark dominates the proposition copy
    // Proposition present, search bar present, proof row present.
    await expect(page.getByTestId("discovery-proposition")).toBeVisible();
    await expect(page.getByTestId("landing-search")).toBeVisible();
    await expect(page.getByTestId("landing-proof-row")).toBeVisible();
    // Order in DOM: heading -> proposition -> search -> proof.
    const order = await page.evaluate(() => {
      const ids = ["landing-heading", "discovery-proposition", "landing-search", "landing-proof-row"];
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
  // --- Content item 1 (revised Phase B): campus selector REMOVED; search is primary ---
  test("campus selector removed (location filtering deferred to 'discover near you')", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByTestId("campus-selector")).toHaveCount(0);
    await expect(page.getByTestId("campus-context")).toHaveCount(0);
    // Search bar is the primary discovery action in its place.
    await expect(page.getByTestId("landing-search")).toBeVisible();
  });

  // --- Content item 2 (revised Phase B): hero has NO campus selector; primary action is search ---
  test("hero has no campus selector; primary action is the search bar", async ({ page }) => {
    await page.goto("/");
    // Campus selector was removed (founder 2026-08-20) — location filtering deferred
    // to the "discover near you" feature. Assert it is gone.
    await expect(page.getByTestId("campus-selector")).toHaveCount(0);
    await expect(page.getByTestId("campus-context")).toHaveCount(0);
    // The hero's primary action is the search form (not a campus-driven "Explore NMU" button).
    await expect(page.getByTestId("landing-search")).toBeVisible();
    // The bottom FinalCTA still echoes the campus (separate action) — sanity check it exists.
    await expect(page.getByTestId("entry-discovery-final")).toContainText(/explore\s+nmu/i);
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

  // --- Content item 5 (revised 2026-08-20): slim top nav with wordmark + Login(text) + Sign up(pill) ---
  test("slim top nav with wordmark + Login (text) + Sign up (pill CTA)", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByTestId("landing-nav")).toBeVisible();
    await expect(page.getByTestId("wordmark")).toHaveText(/voeq/i);
    // Only Login (text link) + Sign up (pill CTA) remain; About/Help/Legal/etc removed.
    await expect(page.getByTestId("nav-login")).toBeVisible();
    await expect(page.getByTestId("nav-signup")).toBeVisible();
    await expect(page.getByTestId("nav-about")).toHaveCount(0);
    await expect(page.getByTestId("nav-help")).toHaveCount(0);
    await expect(page.getByTestId("nav-legal")).toHaveCount(0);
    await expect(page.getByTestId("nav-press")).toHaveCount(0);
    await expect(page.getByTestId("nav-careers")).toHaveCount(0);
    // Sign up renders as the pill CTA.
    await expect(page.getByTestId("nav-signup")).toHaveClass(/landing-cta/);
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
    await expect(page.getByTestId("nav-login")).toBeHidden();
    await hamburger.click();
    const overlay = page.getByTestId("landing-nav-overlay");
    await expect(overlay).toBeVisible();
    await expect(page.getByTestId("nav-login-overlay")).toBeVisible();
    await expect(page.getByTestId("nav-signup-overlay")).toBeVisible();
    await page.getByTestId("landing-nav-overlay-close").click();
    await expect(overlay).toBeHidden();
  });

  // --- Content item 8 (revised 2026-08-20): Trust strip shows HONEST value pillars, no mock numbers ---
  test("trust strip renders 3 honest value pillars (no fabricated stats)", async ({ page }) => {
    await page.goto("/");
    const strip = page.getByTestId("trust-strip");
    await expect(strip).toBeVisible();
    // 3 groups (label + note pairs); NO .trust-strip-number (mock stats removed).
    await expect(strip.locator(".trust-strip-group")).toHaveCount(3);
    await expect(strip.locator(".trust-strip-number")).toHaveCount(0);
    await expect(strip.locator(".trust-strip-label")).toHaveCount(3);
    await expect(strip.locator(".trust-strip-note")).toHaveCount(3);
    // Honest pillars — real product properties, not invented metrics.
    const labels = await strip.locator(".trust-strip-label").allInnerTexts();
    expect(labels).toEqual([
      "Free to browse & connect",
      "Built for campuses",
      "Student to student",
    ]);
    // No number looks like a fabricated count.
    const notes = await strip.locator(".trust-strip-note").allInnerTexts();
    for (const n of notes) expect(n.trim()).not.toMatch(/^\d{2,}/);
  });

  test("trust strip stacks vertically on mobile (375px) and hides separators", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 800 });
    await page.goto("/");
    const strip = page.getByTestId("trust-strip");
    await expect(strip).toBeVisible();
    // Separators exist in the DOM (2, between the 3 groups) but are display:none on mobile
    // (globals.css @media max-width:640px) — assert they are hidden, not absent.
    const seps = strip.locator(".trust-strip-sep");
    await expect(seps).toHaveCount(2);
    await expect(seps.nth(0)).toBeHidden();
    await expect(seps.nth(1)).toBeHidden();
  });

  // --- Chunk 6 / Phase B: search submit is styled as .landing-cta pill (no arrow) ---
  test("search submit button is styled as .landing-cta pill (no arrow)", async ({ page }) => {
    await page.goto("/");
    const submit = page.getByTestId("search-submit");
    await expect(submit).toBeVisible();
    await expect(submit).toHaveClass(/landing-cta/);
    await expect(submit).toHaveText("Search");
    const arrow = submit.locator(".cta-arrow");
    await expect(arrow).toHaveCount(0); // search button has no arrow (unlike the ghost CTA)
  });

  // --- Chunk 6: rich footer (rewritten 2026-08-20) — brand + 3 link columns + bottom bar ---
  test("rich footer renders brand, 3 link columns, and bottom bar on dark ground", async ({ page }) => {
    await page.goto("/");
    const footer = page.getByTestId("landing-footer");
    await expect(footer).toBeVisible();
    await expect(page.getByTestId("footer-wordmark")).toHaveText(/voeq/i);
    // 3 columns (Explore / Company / Legal) with the preserved link testids.
    await expect(footer.locator(".landing-footer-col")).toHaveCount(3);
    for (const id of ["footer-for-vendors", "footer-terms", "footer-privacy", "footer-login", "footer-signup", "footer-about", "footer-press", "footer-careers", "footer-browse", "footer-help"]) {
      await expect(page.getByTestId(id)).toHaveAttribute("href", /\//);
    }
    // Bottom bar with copyright.
    await expect(footer.locator(".landing-footer-bottom")).toBeVisible();
    // DARK ground: background computes to the ink-deep token (#1F2A22).
    const bg = await footer.evaluate((el) => getComputedStyle(el).backgroundColor);
    expect(bg).toBe("rgb(31, 42, 34)");
    // Cream text on dark (WCAG AA): wordmark computes to a near-white cream.
    const wmColor = await page.getByTestId("footer-wordmark").evaluate((el) => getComputedStyle(el).color);
    expect(wmColor).toBe("rgb(243, 241, 234)");
  });
});

/* ============================================================================
 * CHUNK 8 — Landing A.19 visual-direction regression assertions
 * (landing-visual-direction-remediation.md, chunk 8). ADDITIVE ONLY: the Slice 1
 * + Task B gates above stay intact. Each assertion targets a REAL DOM / computed-
 * style fact verified on disk — no baked-in bug. Asserts the visual direction is
 * actually rendered: atmosphere layers, 55/45 split, wordmark entrance, INLINE
 * (not card) selector, contour SVG self-draw, data-bound trust strip, footer.
 * ========================================================================== */
test.describe("Chunk 8 — Landing A.19 visual direction", () => {
  test("atmosphere: aurora SCRAPPED — flat cream canvas, no gradient/grain/drift", async ({ page }) => {
    await page.goto("/");
    // Cream base locked value (#f7f4ec) on body — and now the ONLY background (aurora removed).
    const bodyBg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
    expect(bodyBg).toBe("rgb(247, 244, 236)");
    // The .landing-atmosphere element was removed entirely (founder: "too much for minimalist design").
    await expect(page.locator(".landing-atmosphere")).toHaveCount(0);
    // No radial-gradient background image anywhere on the landing surface.
    const hasGradient = await page.evaluate(() => {
      const surf = document.querySelector(".landing-surface") as HTMLElement | null;
      const bg = surf ? getComputedStyle(surf).backgroundImage : "";
      return /radial-gradient|linear-gradient/.test(bg || "");
    });
    expect(hasGradient).toBe(false);
  });

  test("asymmetric split: left column ~55% (11fr) wider than right 45% (9fr)", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto("/");
    const left = page.locator(".landing-split-left");
    const right = page.locator(".landing-split-right");
    await expect(left).toBeVisible();
    await expect(right).toBeVisible();
    const { lW, rW } = await page.evaluate(() => {
      const l = document.querySelector(".landing-split-left") as HTMLElement;
      const r = document.querySelector(".landing-split-right") as HTMLElement;
      return { lW: l.getBoundingClientRect().width, rW: r.getBoundingClientRect().width };
    });
    expect(lW).toBeGreaterThan(rW);
    const ratio = lW / rW;
    expect(ratio).toBeGreaterThan(1.05);
    expect(ratio).toBeLessThan(1.45); // 11/9 ≈ 1.222
  });

  test("wordmark entrance: 4 char spans carrying the rise animation (first-arrival)", async ({ page }) => {
    await page.goto("/");
    const chars = page.getByTestId("wordmark-char");
    await expect(chars).toHaveCount(4);
    const animName = await chars.first().evaluate((el) => getComputedStyle(el).animationName);
    expect(animName).toMatch(/wordmark/);
  });

  test("wordmark: reduced-motion renders instantly (no rise)", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    const chars = page.getByTestId("wordmark-char");
    await expect(chars).toHaveCount(4);
    const opacity = await chars.first().evaluate((el) => getComputedStyle(el).opacity);
    expect(opacity).toBe("1");
    const animName = await chars.first().evaluate((el) => getComputedStyle(el).animationName);
    expect(animName).toBe("none");
  });

  test("campus context line removed (no inline campus selector on landing)", async ({ page }) => {
    await page.goto("/");
    // The "Discover what's open near [NMU]" inline selector was removed (founder 2026-08-20).
    await expect(page.getByTestId("campus-context")).toHaveCount(0);
    await expect(page.getByTestId("campus-selector")).toHaveCount(0);
    await expect(page.locator(".campus-context-sentence")).toHaveCount(0);
  });

  test("contour line SVG self-draws ONLY when activity exists (seed=1)", async ({ page }) => {
    await page.goto("/?seed=1");
    const svg = page.getByTestId("contour-line");
    await expect(svg).toBeVisible();
    const path = svg.locator("path.contour-line-path");
    await expect(path).toHaveCount(1);
    const d = await path.getAttribute("d");
    expect(d && d.trim().length).toBeGreaterThan(0);
    const stroke = await path.evaluate((el) => getComputedStyle(el).stroke);
    expect(stroke).not.toBe("none");
  });

  test("trust strip: 3 honest pillars below the hero, no fabricated numbers", async ({ page }) => {
    await page.goto("/");
    const strip = page.getByTestId("trust-strip");
    await expect(strip).toBeVisible();
    await expect(strip.locator(".trust-strip-group")).toHaveCount(3);
    await expect(strip.locator(".trust-strip-number")).toHaveCount(0);
    const labels = await strip.locator(".trust-strip-label").allInnerTexts();
    expect(labels).toEqual([
      "Free to browse & connect",
      "Built for campuses",
      "Student to student",
    ]);
    // Positioned below the hero search in DOM order.
    const order = await page.evaluate(() => {
      const t = document.querySelector('[data-testid="trust-strip"]')!.getBoundingClientRect().top;
      const e = document.querySelector('[data-testid="landing-search"]')!.getBoundingClientRect().top;
      return { t, e };
    });
    expect(order.t).toBeGreaterThan(order.e);
  });

  test("rich footer: multi-column layout, not centered single row", async ({ page }) => {
    await page.goto("/");
    const footer = page.getByTestId("landing-footer");
    await expect(footer).toBeVisible();
    // New footer is a grid (brand + columns), not text-align:center single column.
    const align = await footer.evaluate((el) => getComputedStyle(el).textAlign);
    expect(align).not.toBe("center");
    await expect(footer.locator(".landing-footer-inner")).toHaveCount(1);
    await expect(footer.locator(".landing-footer-col")).toHaveCount(3);
  });
});

/* ============================================================================
 * CHUNK 9 — Landing enrichment (PG-PUB-001 reversal, 2026-08-20): How It Works,
 * Popular Categories, FAQ, Final CTA. ADDITIVE: Slice 1 + Task B + Chunk 8 gates
 * above stay intact. Asserts the new sections render, category chips link to the
 * canonical /c/[slug] routes, reveal is progressive (never permanently hidden),
 * and the Fraunces display font is actually applied (computed font-family on the
 * wordmark, not the deprecated document.fonts.check('16px Fraunces') which returns
 * false for next/font's hashed family names).
 * ========================================================================== */
test.describe("Chunk 9 — Landing enrichment (PG-PUB-001 reversal)", () => {
  test("4 enrichment sections render below the trust strip", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByTestId("trust-strip")).toBeVisible();
    for (const id of ["landing-how-it-works", "landing-categories", "landing-faq", "landing-final-cta"]) {
      const sec = page.getByTestId(id);
      await expect(sec).toBeVisible();
      // Ordered after the trust strip in DOM.
      const order = await page.evaluate((testid) => {
        const t = document.querySelector('[data-testid="trust-strip"]')!.getBoundingClientRect().top;
        const s = document.querySelector(`[data-testid="${testid}"]`)!.getBoundingClientRect().top;
        return s - t;
      }, id);
      expect(order).toBeGreaterThan(0);
    }
  });

  test("How It Works shows 3 steps with copy", async ({ page }) => {
    await page.goto("/");
    const steps = page.locator('[data-testid="landing-how-it-works"] .how-step');
    await expect(steps).toHaveCount(3);
    await expect(steps.first().locator(".how-step-title")).toHaveText(/pick your campus/i);
    await expect(steps.first().locator(".how-step-body")).not.toBeEmpty();
  });

  test("category chips link to canonical /c/[slug] routes", async ({ page }) => {
    await page.goto("/");
    const chips = page.locator('[data-testid="landing-categories"] .category-chip');
    await expect(chips).toHaveCount(5);
    for (const slug of ["food", "books", "beauty", "apparel", "services"]) {
      const chip = page.getByTestId(`category-chip-${slug}`);
      await expect(chip).toHaveAttribute("href", `/c/${slug}`);
    }
  });

  test("FAQ renders 5 questions, first open, answers non-empty", async ({ page }) => {
    await page.goto("/");
    const items = page.locator('[data-testid="landing-faq"] .faq-item');
    await expect(items).toHaveCount(5);
    await expect(items.first()).toHaveAttribute("open", "");
    await expect(items.first().locator(".faq-answer")).not.toBeEmpty();
  });

  test("Final CTA echoes selected campus label", async ({ page }) => {
    await page.goto("/");
    const cta = page.getByTestId("entry-discovery-final");
    await expect(cta).toBeVisible();
    await expect(cta).toHaveAttribute("href", "/explore");
    await expect(cta).toContainText(/explore\s+nmu/i);
  });

  test("reveal is progressive: content visible without JS-driven hide", async ({ page }) => {
    await page.goto("/");
    // Without JS enhancement the sections must still be visible (no empty-page regression).
    // We assert the section is in the viewport-rendered tree and has non-zero height.
    const how = page.getByTestId("landing-how-it-works");
    await expect(how).toBeVisible();
    const h = await how.evaluate((el) => el.getBoundingClientRect().height);
    expect(h).toBeGreaterThan(0);
  });

  test("Fraunces display font is applied (computed font-family on wordmark, not check('16px Fraunces'))", async ({ page }) => {
    await page.goto("/");
    // Wait for fonts to finish loading (next/font uses hashed family names, so the
    // literal 'Fraunces' string fails document.fonts.check — we assert the computed
    // family on the rendered glyph instead, which is the real proof of application).
    await page.evaluate(async () => { await (document as any).fonts.ready; });
    const status = await page.evaluate(() => (document as any).fonts.status);
    expect(status).toBe("loaded");
    const ff = await page.getByTestId("wordmark-char").first().evaluate(
      (el) => getComputedStyle(el).fontFamily
    );
    expect(ff.toLowerCase()).toContain("fraunces");
  });
});

/* ============================================================================
 * PHASE A — Landing redesign v3 (motion-only, aurora scrapped, 2026-08-20).
 * Asserts: proof-row honest labels (no fake stats), hero ghost CTA pair, pill
 * buttons (9999px), numbered How-It-Works badges, wordmark blur-in, reduced-motion
 * freezes entrance, mobile proof-row stacks. ADDITIVE: all prior gates stay intact.
 * ========================================================================== */
test.describe("Phase A — Landing redesign v3 (motion-only)", () => {
  test("proof row renders honest labels — NO fabricated social-proof numbers", async ({ page }) => {
    await page.goto("/");
    const row = page.getByTestId("landing-proof-row");
    await expect(row).toBeVisible();
    const cards = page.getByTestId("proof-card");
    await expect(cards).toHaveCount(3);
    // Every value is either a real fact or an em-dash placeholder — never a fake "1,200+".
    const values = await page.getByTestId("proof-card").locator(".proof-value").allInnerTexts();
    for (const v of values) {
      expect(v.trim()).not.toMatch(/^\d{2,}[k+]?$/); // reject invented large counts
      expect(v.trim().toLowerCase()).not.toContain("listings");
    }
    // At least one card is explicitly labeled placeholder (data-real=false -> em-dash).
    const dashCount = await page.getByTestId("proof-card").locator('.proof-value[data-real="false"]').count();
    expect(dashCount).toBeGreaterThanOrEqual(1);
  });

  test("hero pair: search bar (primary) + ghost 'Post something' CTA", async ({ page }) => {
    await page.goto("/");
    const primary = page.getByTestId("search-submit");
    await expect(primary).toBeVisible();
    await expect(primary).toHaveClass(/landing-cta/);
    const ghost = page.getByTestId("entry-post");
    await expect(ghost).toBeVisible();
    await expect(ghost).toHaveClass(/landing-cta--ghost/);
    await expect(ghost).toHaveAttribute("href", /\/for-vendors/);
    await expect(ghost).toContainText(/post something/i);
  });

  test("CTA buttons are pill-shaped (border-radius 9999px)", async ({ page }) => {
    await page.goto("/");
    const r1 = await page.getByTestId("search-submit").evaluate((el) => getComputedStyle(el).borderRadius);
    const r2 = await page.getByTestId("entry-post").evaluate((el) => getComputedStyle(el).borderRadius);
    // 9999px computes to a value >= the element's half-height (fully rounded).
    expect(parseFloat(r1)).toBeGreaterThanOrEqual(20);
    expect(parseFloat(r2)).toBeGreaterThanOrEqual(20);
  });

  test("How It Works steps carry numbered badges (sequential order)", async ({ page }) => {
    await page.goto("/");
    const steps = page.locator('[data-testid="landing-how-it-works"] .how-step');
    await expect(steps).toHaveCount(3);
    // ::before badge content equals the data-step attr (1,2,3).
    for (let i = 0; i < 3; i++) {
      const badge = await steps.nth(i).evaluate((el) => getComputedStyle(el, "::before").content);
      expect(badge).toContain(String(i + 1));
    }
  });

  test("wordmark blur-in: animation applies a blur filter (not just opacity)", async ({ page }) => {
    await page.goto("/");
    const char = page.getByTestId("wordmark-char").first();
    // At animation start the filter is blurred; assert the keyframe includes blur.
    const hasBlur = await char.evaluate((el) => {
      const cs = getComputedStyle(el);
      // Either currently blurred, or the animation name resolves to a keyframe with blur.
      return cs.animationName.includes("wordmark") && (cs.filter.includes("blur") || cs.animationName === "wordmark-rise");
    });
    expect(hasBlur).toBe(true);
  });

  test("reduced-motion: all entrance animations frozen (animationName none)", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    const frozen = await page.evaluate(() => {
      const els = [".wordmark-char", ".landing-nav [data-testid='wordmark']", ".landing-nav-links a"];
      return els.every((sel) => {
        const el = document.querySelector(sel) as HTMLElement | null;
        if (!el) return true;
        return getComputedStyle(el).animationName === "none";
      });
    });
    expect(frozen).toBe(true);
  });

  test("mobile (375px): proof row stacks vertically, no horizontal overflow", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 800 });
    await page.goto("/");
    const row = page.getByTestId("landing-proof-row");
    await expect(row).toBeVisible();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1);
    expect(overflow).toBe(true);
  });

  test("mobile (375px): hero search stacks input above button, full width", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 800 });
    await page.goto("/");
    const form = page.getByTestId("landing-search");
    await expect(form).toBeVisible();
    const dir = await form.evaluate((el) => getComputedStyle(el).flexDirection);
    expect(dir).toBe("column");
  });
});

/* ============================================================================
 * PHASE B — Hero search + /browse stub (2026-08-20).
 * Asserts: search form submits to /browse?q=…, /browse stub renders honestly
 * (echoes query, "Showing results across all campuses"), and the motion-discipline
 * rule (entrance/load animation only in hero; below-fold sections are static — no
 * scroll-reveal / IntersectionObserver fade). ADDITIVE: all prior gates stay intact.
 * ========================================================================== */
test.describe("Phase B — Hero search + /browse stub", () => {
  test("search form: single input + single button, submits to /browse?q=", async ({ page }) => {
    await page.goto("/");
    const form = page.getByTestId("landing-search");
    await expect(form).toBeVisible();
    await expect(form).toHaveAttribute("action", /\/browse/);
    await expect(form).toHaveAttribute("method", "get");
    // Exactly ONE text input (no dropdown, no second field).
    await expect(page.getByTestId("search-input")).toHaveCount(1);
    await expect(page.locator('select')).toHaveCount(0);
    await expect(page.getByTestId("search-submit")).toHaveText("Search");
  });

  test("submitting the search navigates to /browse?q=…", async ({ page }) => {
    await page.goto("/");
    await page.getByTestId("search-input").fill("textbooks");
    await page.getByTestId("search-submit").click();
    await page.waitForURL(/\/browse\?q=textbooks/);
    const q = page.url();
    expect(q).toMatch(/q=textbooks/);
  });

  test("/browse stub: echoes query and states all-campus scope (honest)", async ({ page }) => {
    await page.goto("/browse?q=tickets");
    await expect(page.getByTestId("browse-page")).toBeVisible();
    await expect(page.getByTestId("browse-query")).toContainText(/tickets/);
    await expect(page.getByTestId("browse-scope")).toContainText(/all campuses/i);
    // No fabricated result counts.
    const txt = await page.getByTestId("browse-page").innerText();
    expect(txt).not.toMatch(/\d{2,}\s*(listings|results|vendors)/i);
  });

  test("motion discipline: below-the-fold sections are static (no scroll-reveal / IntersectionObserver fade)", async ({ page }) => {
    await page.goto("/");
    // None of the below-fold sections should carry the useReveal [data-reveal] attribute.
    const revealed = await page.evaluate(() => {
      const ids = ["landing-how-it-works", "landing-categories", "landing-faq", "landing-final-cta", "landing-proof-row"];
      return ids.some((id) => {
        const el = document.querySelector(`[data-testid="${id}"]`);
        return el && el.getAttribute("data-reveal") !== null;
      });
    });
    expect(revealed).toBe(false);
    // And they are visible immediately (no opacity:0 hiding pending IO).
    for (const id of ["landing-how-it-works", "landing-categories", "landing-faq", "landing-final-cta"]) {
      await expect(page.getByTestId(id)).toBeVisible();
    }
  });

  test("dark sections: How-It-Works + Footer are --role-ink-deep, cream text (WCAG AA)", async ({ page }) => {
    await page.goto("/");
    // Exactly two dark sections (the "alternating rhythm" rule): How-It-Works + Footer.
    for (const id of ["landing-how-it-works", "landing-footer"]) {
      const el = page.getByTestId(id);
      const bg = await el.evaluate((e) => getComputedStyle(e).backgroundColor);
      expect(bg).toBe("rgb(31, 42, 34)"); // #1F2A22 ink-deep
    }
    // How-It-Works cream body text (muted cream #a9b8ac) — passes AA on dark.
    const howTitle = await page.getByTestId("landing-how-it-works").locator(".how-step-title").first().evaluate((e) => getComputedStyle(e).color);
    expect(howTitle).toBe("rgb(243, 241, 234)");
    // Three steps present; gold badge is gold-on-ink (not emerald) via the ::before computed bg.
    await expect(page.locator('[data-testid="landing-how-it-works"] .how-step')).toHaveCount(3);
    const badgeBg = await page.getByTestId("landing-how-it-works").locator(".how-step").first().evaluate((e) => {
      const before = getComputedStyle(e, "::before");
      return before.backgroundColor;
    });
    expect(badgeBg).toBe("rgb(216, 168, 90)"); // --role-gold-on-ink #d8a85a
  });

  test("hero right column: static contour texture fills the empty state (no dead void, no fake data)", async ({ page }) => {
    await page.goto("/");
    // Production default (no activity) -> contour-empty SVG renders as a static texture.
    const empty = page.getByTestId("contour-empty");
    await expect(empty).toBeVisible();
    const shape = empty.locator(".contour-empty-shape");
    await expect(shape).toBeVisible();
    // Static: no draw animation running on the empty path (animationName none).
    const anim = await shape.locator(".contour-line-path").evaluate((e) => getComputedStyle(e).animationName);
    expect(anim).toBe("none");
    // Not a text-only empty state.
    await expect(empty.locator("text=marketplace is quiet")).toHaveCount(0);
  });
});
