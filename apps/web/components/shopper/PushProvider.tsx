"use client";

import { useEffect } from "react";
import { PushNotificationPrompt } from "@/components/shopper/PushNotificationPrompt";

/**
 * NOT-10: Register the service worker for push notifications.
 * Runs once on app load in browsers that support it.
 */
export function PushProvider({ role }: { role: "shopper" | "vendor" | "staff" }) {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in window) || !("PushManager" in window)) return;
    let cancelled = false;
    (async () => {
      try {
        const reg = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
        if (!cancelled) {
          window.addEventListener("load", () => {
            if ("sync" in reg) {
              (reg as ServiceWorkerRegistration & { sync: { register: (tag: string) => Promise<unknown> } }).sync.register("sync-push-setup");
            }
          });
        }
      } catch (e) {
        console.error("[sw] registration failed:", e);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return <PushNotificationPrompt viewerRole={role === "vendor" ? "vendor" : "shopper"} />;
}
