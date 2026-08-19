import { LandingShell } from "@/components/landing/LandingShell";

/**
 * Landing — PG-PUB-001 (Doc 04), Cream-first environment (Doc 06 §2, reversed 2026-08-18:
 * Cream is the default across all public routes incl. Landing; Deep is an opt-in alternate only).
 * First real product surface. Visual hierarchy (one dominant order per viewport):
 *   Voeq (arrival) -> campus context -> discovery proposition -> contour meaning -> enter
 * No auth, no browse grid, no marketing drift, no 3D.
 * LandingShell owns the campus state and composes nav + hero + context + proposition +
 * contour + entry + footer (Task B additions live in the shell, outside the locked center
 * hierarchy).
 */
export default function Landing() {
  return <LandingShell />;
}
