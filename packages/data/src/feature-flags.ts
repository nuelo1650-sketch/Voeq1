/**
 * VS7.19 — Feature flags (mock, in-memory). Phase 9 swaps for real config store.
 * Flags are simple booleans the admin can toggle; defaults are conservative.
 */
import type { FeatureFlag } from "./interfaces";

const flags: Record<string, FeatureFlag> = {
  "messaging.enabled": { key: "messaging.enabled", value: true, description: "Enable native buyer-vendor messaging" },
  "reviews.enabled": { key: "reviews.enabled", value: true, description: "Enable public reviews" },
  "impersonation.enabled": { key: "impersonation.enabled", value: true, description: "Allow staff impersonation (super_admin)" },
  "signups.enabled": { key: "signups.enabled", value: true, description: "Allow new account registration" },
};

export const mockFeatureFlagRepo = {
  async list(): Promise<FeatureFlag[]> {
    return Object.values(flags);
  },
  async set(key: string, value: boolean): Promise<FeatureFlag | null> {
    const f = flags[key];
    if (!f) return null;
    f.value = value;
    return f;
  },
};
