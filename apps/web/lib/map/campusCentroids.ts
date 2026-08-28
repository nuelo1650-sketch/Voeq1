// Verified campus centroids for Nigerian universities.
// Sources: Wikipedia infoboxes + Mapcarta/OpenStreetMap (see Pass B-1 plan).
// Coordinates are NOT vendor addresses — they are campus centers for map clustering.

export const CAMPUS_CENTROIDS: Record<string, [number, number]> = {
  "nmu-okerenkoko": [5.62449, 5.39038], // NMU Okerenkoko — Mapcarta/OSM
  "nmu-kurutie": [5.62449, 5.39038], // TODO: verify distinct Kurutie campus coords (no public source found)
  unilag: [6.51667, 3.38611], // UNILAG Akoka — Wikipedia
  ui: [7.3912, 3.9167], // UI Ibadan — Wikipedia + latitude.to
  oau: [7.51833, 4.52278], // OAU Ile-Ife — Wikipedia
  unn: [6.858, 7.396], // UNN Nsukka — Wikipedia (Nsukka town)
  covenant: [6.6699, 3.1574], // Covenant Ota — Wikipedia
  futo: [5.384, 6.995], // FUTO Owerri — Wikipedia
  uniben: [6.3337, 5.60015], // UNIBEN Benin City — Wikipedia
  abu: [11.067, 7.7], // ABU Zaria — Wikipedia
  unijos: [9.95028, 8.88917], // UNIJOS Jos — Wikipedia
};

// Nigeria geographic centroid (geodatos.net, WGS84) — fallback for unknown campuses.
export const NIGERIA_CENTROID: [number, number] = [9.081999, 8.675277];

export function getCampusCentroid(slug: string): [number, number] {
  return CAMPUS_CENTROIDS[slug] ?? NIGERIA_CENTROID;
}
