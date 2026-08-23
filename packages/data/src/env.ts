/**
 * D.1 — Environment variable schema + boot validation.
 *
 * Single source of truth for required env vars, split by deploy target
 * (web = Vercel, api = Render). `validateEnv(target)` reports which keys are
 * present (real) vs missing (mock fallback), and THROWS in production if any
 * required key for that target is absent — so a misconfigured deploy fails
 * loud at boot instead of silently serving mocked behavior.
 *
 * Mock fallback rule: in dev (NODE_ENV !== "production"), missing keys are a
 * warning and the caller uses the in-memory mock. In prod, missing keys throw.
 */
export type DeployTarget = "web" | "api";

export interface EnvReport {
  target: DeployTarget;
  mode: "production" | "development";
  real: string[];
  missing: string[];
  /** Var names that are present but should be treated as mock-only in dev. */
  mocked: string[];
  ok: boolean;
}

const WEB_REQUIRED = [
  "NEXT_PUBLIC_API_URL",
  "NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME",
  "NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET",
  "NEXT_PUBLIC_TURNSTILE_SITE_KEY",
] as const;

const API_REQUIRED = [
  "DATABASE_URL",
  "VOEQ_SESSION_SECRET",
  "CLOUDINARY_CLOUD_NAME",
  "CLOUDINARY_API_KEY",
  "CLOUDINARY_API_SECRET",
  "SIGHTENGINE_USER",
  "SIGHTENGINE_SECRET",
  "RESEND_API_KEY",
  "RESEND_FROM_EMAIL",
  "AUTH_GOOGLE_CLIENT_ID",
  "AUTH_GOOGLE_CLIENT_SECRET",
  "TURNSTILE_SECRET_KEY",
  "CORS_ALLOWLIST",
  "SUPER_ADMIN_EMAIL",
] as const;

function present(name: string): boolean {
  const v = process.env[name];
  return v !== undefined && v !== "";
}

export function validateEnv(target: DeployTarget): EnvReport {
  const mode: EnvReport["mode"] = process.env.NODE_ENV === "production" ? "production" : "development";
  const required = target === "web" ? WEB_REQUIRED : API_REQUIRED;
  const real = required.filter(present);
  const missing = required.filter((k) => !present(k));
  const ok = missing.length === 0;

  if (!ok && mode === "production") {
    throw new Error(
      `[validateEnv:${target}] MISSING REQUIRED KEYS: ${missing.join(", ")}. ` +
        `Boot aborted — set these in the deploy dashboard before starting.`,
    );
  }

  if (!ok) {
    // eslint-disable-next-line no-console
    console.warn(`[validateEnv:${target}] dev mode — missing (using mock): ${missing.join(", ")}`);
  } else {
    // eslint-disable-next-line no-console
    console.log(`[validateEnv:${target}] ${real.length} real, ${missing.length} missing — ok=${ok}`);
  }

  return { target, mode, real, missing, mocked: mode === "development" ? missing : [], ok };
}
