/**
 * P-A round 40 (env hygiene): boot-time env validation.
 *
 * Logs the validateEnv("api") report at server start so a misconfigured deploy
 * is visible in logs immediately instead of failing silently mid-request.
 *
 * NOTE — deliberately LOG-ONLY (never throws at boot): validateEnv throws in
 * production when a required key is missing. Until the Render dashboard is
 * confirmed against the required list, a hard boot failure would take the API
 * down on a single missing key. Once that's verified, flip throwOnMissing to
 * true for true fail-loud boots.
 */
import { validateEnv } from "@voeq/data/server";

export async function register() {
  try {
    const report = validateEnv("api");
    if (!report.ok) {
      console.error(
        `[env] API targets: MISSING ${report.missing.join(", ")} (fallbacks tried: ` +
          `SIGHTENGINE_USER/API_USER, RESEND_FROM_EMAIL/RESEND_FROM, SUPER_ADMIN_EMAIL/VOEQ_SUPER_ADMIN_EMAIL)`,
      );
    } else {
      console.log(`[env] API targets ok — ${report.real.length} required keys present`);
    }
  } catch (e) {
    // validateEnv throws in prod when keys are missing — log, don't crash.
    console.error(`[env] validateEnv(api) failed: ${e instanceof Error ? e.message : String(e)}`);
  }
}
