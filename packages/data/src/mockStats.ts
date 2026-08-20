// PLACEHOLDER — single seam for Phase 9 real-data wiring.
// All values are honest demo placeholders. UI MUST consume via getMockStats().
import { MOCK_VENDORS } from "./mock";

export type TrustStats = {
  vendorCount: number;
  campusCount: number;
  studentConnections: number;
};

export const getMockStats = (): TrustStats => ({
  vendorCount: MOCK_VENDORS.length, // honest: real demo vendor count (6)
  campusCount: 6, // PLACEHOLDER mirrors CAMPUS_OPTIONS.length (web pkg) — keep in lockstep
  studentConnections: 47, // PLACEHOLDER — no real source yet
});
