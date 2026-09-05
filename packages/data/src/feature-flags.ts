/**
 * VS7.19 — Feature flags. Phase 9 swaps for real config store (Neon-backed).
 * D.2/D.3 — Factory: when DATABASE_URL is set, uses realFeatureFlagRepo.
 */
import type { FeatureFlag } from "./interfaces";
import { realFeatureFlagRepo } from "@voeq/db";

const flags: Record<string, FeatureFlag> = {
  "messaging.enabled": { key: "messaging.enabled", value: true, description: "Enable native buyer-vendor messaging" },
  "reviews.enabled": { key: "reviews.enabled", value: true, description: "Enable public reviews" },
  "impersonation.enabled": { key: "impersonation.enabled", value: true, description: "Allow staff impersonation (super_admin)" },
  "signups.enabled": { key: "signups.enabled", value: true, description: "Allow new account registration" },
};

const mockFeatureFlagRepoImpl = {
  async list(): Promise<FeatureFlag[]> {
    return Object.values(flags);
  },
  async set(key: string, value: boolean, description = ""): Promise<FeatureFlag | null> {
    // P2 (config console): upsert, matching realFeatureFlagRepo.set — the
    // flags POST route relies on create-via-set for new keys.
    const existing = flags[key];
    const f: FeatureFlag = existing
      ? { ...existing, value, description: description || existing.description }
      : { key, value, description };
    flags[key] = f;
    return f;
  },
};

const USE_REAL = !!process.env.DATABASE_URL;
// P0 (config console): cast removed — realFeatureFlagRepo must satisfy the
// interface structurally. set(key, value, description?) is assignable to
// set(key, value) (extra optional param is fine). tsc enforces parity now.
export const mockFeatureFlagRepo: typeof mockFeatureFlagRepoImpl = USE_REAL
  ? realFeatureFlagRepo
  : mockFeatureFlagRepoImpl;
