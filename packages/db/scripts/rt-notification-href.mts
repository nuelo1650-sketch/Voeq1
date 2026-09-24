/** Verify NOT-06 fix: notificationHref() maps every type+refId to the right route.
 *  This mirrors the producer contracts in apps/web/app/api/.../route.ts. */
import { notificationHref, notificationGroup } from "../../../apps/web/lib/notification-href";

const cases: Array<{ type: string; refId: string | null; role: "shopper" | "vendor" | "staff"; expected: string | null }> = [
  { type: "new_message", refId: "conv-123", role: "shopper", expected: "/messages/conv-123" },
  { type: "new_message", refId: null, role: "shopper", expected: "/messages" },
  { type: "new_review", refId: "vendor-9", role: "shopper", expected: "/vendor/reviews" },
  { type: "review_response", refId: "vendor-9", role: "shopper", expected: "/vendor/reviews" },
  { type: "new_follower", refId: "vendor-9", role: "shopper", expected: "/vendor/storefront" },
  { type: "comment", refId: "listing-42", role: "shopper", expected: "/listing/listing-42" },
  { type: "comment", refId: null, role: "shopper", expected: "/explore" },
  { type: "account_action", refId: "vendor-9", role: "vendor", expected: "/vendor/dashboard" },
  { type: "account_action", refId: null, role: "staff", expected: "/admin" },
  { type: "system", refId: null, role: "shopper", expected: "/explore" },
];

let pass = 0;
for (const c of cases) {
  const got = notificationHref(c.type, c.refId, c.role);
  const ok = got === c.expected;
  if (!ok) console.log(`FAIL: ${c.type} ref=${c.refId} role=${c.role} -> ${got} (expected ${c.expected})`);
  else pass++;
}
console.log(`notificationHref: ${pass}/${cases.length} PASS`);

// Also verify group normalization (NOT-06 dependency for icons + filters)
const groupCases = [
  ["new_message", "message"], ["new_review", "review"], ["review_response", "review"],
  ["new_follower", "follower"], ["comment", "comment"], ["account_action", "system"],
];
let gpass = 0;
for (const [t, exp] of groupCases) {
  const got = notificationGroup(t);
  if (got === exp) gpass++;
  else console.log(`FAIL group: ${t} -> ${got} (expected ${exp})`);
}
console.log(`notificationGroup: ${gpass}/${groupCases.length} PASS`);
