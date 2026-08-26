/**
 * VS7.1 — Staff capability matrix + server-authoritative enforcement.
 *
 * Three tiers (Doc 09 §9.6 LOCKED). Capability checks are ALWAYS evaluated here
 * on the server — client claims are never trusted. Promotion is additive: it never
 * removes shopper/vendor capabilities.
 */

import type { StaffCase } from "./interfaces";

export type StaffRole = "moderator" | "admin" | "super_admin";

/** Capability strings used across admin routes (Doc 02 VOEQ-STAFF-*). */
export type Capability =
  | "case.review"
  | "review.moderate"
  | "listing.moderate"
  | "audit.read"
  | "staff.promote"
  | "account.suspend"
  | "vendor.verify"
  | "analytics.read"
  | "config.write"
  | "features.moderate"
  | "staff.impersonate"
  | "data.erasure";

/** Ordered for hierarchy comparisons (highest last). */
export const ROLE_RANK: Record<StaffRole, number> = {
  moderator: 1,
  admin: 2,
  super_admin: 3,
};

export const ROLE_CAPABILITIES: Record<StaffRole, Capability[]> = {
  moderator: ["case.review", "review.moderate", "listing.moderate", "audit.read"],
  admin: [
    "case.review",
    "review.moderate",
    "listing.moderate",
    "audit.read",
    "staff.promote",
    "account.suspend",
    "vendor.verify",
    "analytics.read",
    "config.write",
    "features.moderate",
  ],
  super_admin: [
    "case.review",
    "review.moderate",
    "listing.moderate",
    "audit.read",
    "staff.promote",
    "account.suspend",
    "vendor.verify",
    "analytics.read",
    "config.write",
    "features.moderate",
    "staff.impersonate",
    "data.erasure",
  ],
};

/** Does `actor` (with role) hold `cap`? */
export function hasCapability(actorRole: StaffRole | null | undefined, cap: Capability): boolean {
  if (!actorRole) return false;
  return ROLE_CAPABILITIES[actorRole].includes(cap);
}

/**
 * Server-authoritative promotion check (Doc 09 §9.6).
 * - Actor must outrank target promotion level.
 * - Only super_admin may grant super_admin.
 * - Cannot promote an already-staff identity.
 */
export function canPromote(
  actorRole: StaffRole | null | undefined,
  targetIsStaff: boolean,
  newRole: StaffRole,
): { ok: boolean; reason?: string } {
  if (!actorRole) return { ok: false, reason: "not_staff" };
  if (targetIsStaff) return { ok: false, reason: "already_staff" };
  if (newRole === "super_admin" && actorRole !== "super_admin") {
    return { ok: false, reason: "super_admin_only" };
  }
  if (ROLE_RANK[actorRole] < ROLE_RANK[newRole]) {
    return { ok: false, reason: "insufficient_rank" };
  }
  return { ok: true };
}

/**
 * Server-authoritative account-action check.
 * - No self-harm (cannot act on own identity).
 * - super_admin role is protected (cannot be suspended/banned by anyone).
 * - suspend/ban require >= admin.
 */
export function canAccountAction(
  actorRole: StaffRole | null | undefined,
  actorId: string,
  targetId: string,
  targetRole: StaffRole | null | undefined,
  action: "suspend" | "ban" | "reinstate",
): { ok: boolean; reason?: string } {
  if (!actorRole || ROLE_RANK[actorRole] < ROLE_RANK.admin) {
    return { ok: false, reason: "admin_required" };
  }
  if (actorId === targetId) return { ok: false, reason: "no_self_action" };
  if (targetRole === "super_admin") return { ok: false, reason: "protected_role" };
  return { ok: true };
}

/**
 * VS7.2 — Bootstrap the first super_admin from an env-var email. Idempotent:
 * returns the existing super_admin if one is already present. Run once on first
 * deploy; the route that calls this is dev/prod-guarded.
 */
export async function bootstrapSuperAdmin(): Promise<{
  ok: boolean;
  identityId?: string;
  reason?: string;
}> {
  const envEmail = process.env.SUPER_ADMIN_EMAIL ?? process.env.VOEQ_SUPER_ADMIN_EMAIL;
  if (!envEmail) return { ok: false, reason: "VOEQ_SUPER_ADMIN_EMAIL_not_set" };
  const { mockIdentityRepo } = await import("./auth");
  const email = envEmail.trim().toLowerCase();
  const existing = await mockIdentityRepo.getByEmail(email);
  if (existing) {
    if (existing.staffRole === "super_admin") {
      return { ok: true, identityId: existing.id };
    }
    const patched = await mockIdentityRepo.patch(existing.id, {
      staffRole: "super_admin",
      accountStatus: "active",
      emailVerified: true,
    });
    return { ok: true, identityId: patched?.id ?? existing.id };
  }
  const created = await mockIdentityRepo.createPending({
    email,
    name: "Super Admin",
    passwordHash: null,
    method: "email",
    intent: null,
    googleSubject: null,
  });
  const patched = await mockIdentityRepo.patch(created.id, {
    staffRole: "super_admin",
    accountStatus: "active",
    emailVerified: true,
  });
  return { ok: true, identityId: patched?.id ?? created.id };
}
