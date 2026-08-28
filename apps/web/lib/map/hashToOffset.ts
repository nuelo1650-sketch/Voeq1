// Deterministic hash → lat/lng offset for pin scatter.
// Same listing.id always → same offset (stable across renders).
// Different ids → different offsets (spread pins around campus center).
// Always within ±0.01° (~1km at Nigerian latitudes).

const FNV_OFFSET = 2166136261;
const FNV_PRIME = 16777619;

function fnv1a(str: string): number {
  let hash = FNV_OFFSET;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, FNV_PRIME);
  }
  return hash >>> 0; // unsigned 32-bit
}

/**
 * Returns [latOffset, lngOffset] in degrees, clamped to ±0.01° (~1km).
 * Deterministic: same id → same output every time.
 */
export function hashToOffset(id: string): [number, number] {
  const h = fnv1a(id);
  const latBits = (h >> 16) & 0xffff; // 0–65535
  const lngBits = h & 0xffff;
  // Map to −1000..+1000 microdegrees (−0.01°..+0.01°)
  const lat = ((latBits - 32768) / 32768) * 0.01;
  const lng = ((lngBits - 32768) / 32768) * 0.01;
  return [lat, lng];
}
