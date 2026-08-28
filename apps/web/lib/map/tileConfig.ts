// Tile provider config — one-line swap point.
// CARTO bright-voyager: free tier, no API key, production-permitted.
// Attribution per CARTO's requirement: OSM contributors + CARTO credit.
export const TILE_URL =
  "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png";

export const TILE_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>';

export const TILE_MAX_ZOOM = 19;
export const TILE_SUBDOMAINS = "abcd";
