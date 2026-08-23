/**
 * Server-only entry point for @voeq/data.
 *
 * Re-exports the full public barrel PLUS the modules that must never be bundled
 * into a client component: media (Cloudinary signing uses node:crypto), images
 * (server-side upload pipeline), and email (Resend server calls).
 *
 * Only import this from server code (API routes, server actions). Client
 * components must import from "@voeq/data" (the client-safe barrel), which does
 * NOT include these modules — otherwise `next build` fails on the `node:crypto`
 * scheme in the browser bundle.
 */
export * from "./index";
export * from "./media";
export * from "./images";
export * from "./email";
