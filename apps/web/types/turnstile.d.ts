// Cloudflare Turnstile — minimal type declarations for the global widget API
// loaded from https://challenges.cloudflare.com/turnstile/v0/api.js (D.6).
export {};

declare global {
  interface Turnstile {
    render: (
      el: HTMLElement | string,
      opts: {
        sitekey: string;
        action?: string;
        callback?: (token: string) => void;
        "expired-callback"?: () => void;
        "error-callback"?: () => void;
        theme?: "light" | "dark" | "auto";
        size?: "normal" | "flexible" | "compact";
      },
    ) => string;
    remove: (widgetId: string) => void;
    reset: (widgetId?: string) => void;
    getResponse: (widgetId?: string) => string;
  }

  interface Window {
    turnstile?: Turnstile;
  }
}
