/**
 * P-A round 79 — notification deep-link mapper.
 *
 * ROOT CAUSE of "clicking a notification goes nowhere": producers store a raw
 * ENTITY id in refId (conversation id, vendor id, listing id), but the bell
 * did router.push(notif.refId) — pushing a bare UUID as a path, which 404s.
 * The /notifications page didn't navigate at all. And the icon/filter switches
 * compared "message" while the real types are "new_message" — so every icon
 * fell through to the default bell and every filter tab showed nothing.
 *
 * This is the single source of truth: type + refId (+ the viewer's role) ->
 * the actual route. Keep in sync with the producers:
 *   new_message   refId = conversation id   -> /messages/[id]
 *   new_review    refId = vendor id         -> /vendor/reviews (recipient is the vendor)
 *   review_response refId = vendor id       -> /vendor/reviews
 *   new_follower  refId = vendor id         -> /vendor/storefront
 *   comment       refId = listing id        -> /listing/[id]
 *   system        refId = vendor/case id    -> role-dependent
 */

export type NotificationViewerRole = "shopper" | "vendor" | "staff";

/** Canonical group for icons + filter tabs (normalizes the new_* prefixes). */
export function notificationGroup(type: string): "message" | "review" | "follower" | "comment" | "system" {
  switch (type) {
    case "new_message":
      return "message";
    case "new_review":
    case "review_response":
      return "review";
    case "new_follower":
      return "follower";
    case "comment":
      return "comment";
    default:
      return "system";
  }
}

/** Where a click should land. null = nowhere to go (stay put). */
export function notificationHref(
  type: string,
  refId: string | null | undefined,
  viewerRole: NotificationViewerRole = "shopper",
): string | null {
  switch (notificationGroup(type)) {
    case "message":
      return refId ? `/messages/${refId}` : "/messages";
    case "review":
      // Recipient is the vendor being reviewed; their own reviews page.
      return "/vendor/reviews";
    case "follower":
      return "/vendor/storefront";
    case "comment":
      return refId ? `/listing/${refId}` : "/explore";
    case "system":
      if (viewerRole === "staff") return "/admin";
      if (refId && viewerRole === "vendor") return "/vendor/dashboard";
      return "/explore";
    default:
      return null;
  }
}
