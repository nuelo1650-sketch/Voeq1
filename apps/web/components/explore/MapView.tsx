"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import L from "leaflet";
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from "react-leaflet";
import type { ExploreListing } from "@voeq/data";
import { TILE_URL, TILE_ATTRIBUTION, TILE_MAX_ZOOM, TILE_SUBDOMAINS } from "@/lib/map/tileConfig";
import { hashToOffset } from "@/lib/map/hashToOffset";

// Leaflet v5 + Next.js bundler fix: reimport default icon assets so pins render.
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x.src,
  iconUrl: markerIcon.src,
  shadowUrl: markerShadow.src,
});

interface MapViewProps {
  listings: ExploreListing[];
  campus: string;
  campusName: string;
  centroid: [number, number];
  pinOffsets: Map<string, [number, number]>;
}

/** Invalidates map size after container mounts (fixes zero-height render). */
function MapSizeFixer() {
  const map = useMap();
  useEffect(() => {
    setTimeout(() => map.invalidateSize(), 100);
  }, [map]);
  return null;
}

export default function MapView({ listings, campusName, centroid, pinOffsets }: MapViewProps) {
  const [tileFailed, setTileFailed] = useState(false);
  const tileTimer = useRef<ReturnType<typeof setTimeout>>(null);

  useEffect(() => {
    return () => {
      if (tileTimer.current) clearTimeout(tileTimer.current);
    };
  }, []);

  // ... keep tile-fallback but simplify the timer-based detection

  if (tileFailed) {
    return (
      <div
        data-testid="map-fallback"
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          height: "100%",
          gap: 12,
          padding: 24,
          textAlign: "center",
          background: "var(--color-cream)",
          borderRadius: 12,
        }}
      >
        <p style={{ color: "var(--color-ink-muted)" }}>
          Map unavailable — showing list view instead.
        </p>
        <button
          onClick={() => setTileFailed(false)}
          style={{
            padding: "8px 16px",
            borderRadius: 8,
            border: "1px solid var(--color-forest)",
            background: "transparent",
            color: "var(--color-forest)",
            cursor: "pointer",
            fontWeight: 600,
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div data-testid="map-container" style={{ position: "relative", height: "100%", width: "100%", minHeight: 400 }}>
      {/* Approximate-location disclaimer (always visible) */}
      <div
        data-testid="map-disclaimer"
        style={{
          position: "absolute",
          top: 12,
          left: 12,
          right: 12,
          zIndex: 1000,
          padding: "8px 12px",
          borderRadius: 8,
          background: "rgba(247, 244, 236, 0.92)",
          backdropFilter: "blur(4px)",
          fontSize: 12,
          color: "var(--color-ink-deep)",
          border: "1px solid var(--color-forest)",
        }}
      >
        Approximate location — vendors list their campus, not an exact address.
      </div>

      <MapContainer
        center={centroid}
        zoom={15}
        scrollWheelZoom={false}
        style={{ height: "100%", width: "100%", borderRadius: 12 }}
      >
        <TileLayer
          url={TILE_URL}
          attribution={TILE_ATTRIBUTION}
          maxZoom={TILE_MAX_ZOOM}
          subdomains={TILE_SUBDOMAINS}
        />
        <MapSizeFixer />

        {/* Campus-area radius */}
        <Circle
          center={centroid}
          radius={1000}
          pathOptions={{ color: "var(--color-forest)", fillColor: "var(--color-forest)", fillOpacity: 0.05, weight: 1 }}
        />

        {listings.map((l) => {
          const offset = pinOffsets.get(l.id) ?? [0, 0];
          const pos: [number, number] = [centroid[0] + offset[0], centroid[1] + offset[1]];
          return (
            <Marker key={l.id} position={pos}>
              <Popup>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  {l.image && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={l.image} alt="" style={{ width: 28, height: 28, borderRadius: 4, objectFit: "cover" }} />
                  )}
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{l.title}</div>
                    <div style={{ fontSize: 12, color: "var(--color-ink-muted)" }}>{l.vendorName}</div>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
