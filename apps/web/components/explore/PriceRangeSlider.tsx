"use client";

import { useState, useMemo, useCallback, useRef, useEffect } from "react";

interface PriceRangeSliderProps {
  min: number;
  max: number;
  valueMin?: number;
  valueMax?: number;
  onChange: (min?: number, max?: number) => void;
  histogram?: number[];
  currency?: string;
}

const BUCKETS = 12;

function buildHistogram(values: number[], min: number, max: number): number[] {
  if (!values.length) return Array(BUCKETS).fill(0);
  const range = max - min || 1;
  const counts = Array(BUCKETS).fill(0);
  for (const v of values) {
    const idx = Math.min(BUCKETS - 1, Math.floor(((v - min) / range) * BUCKETS));
    counts[idx]++;
  }
  return counts;
}

function formatPrice(value: number): string {
  // value is in kobo (minor units) — display as whole naira
  return new Intl.NumberFormat("en-NG").format(Math.round(value / 100));
}

export function PriceRangeSlider({
  min,
  max,
  valueMin,
  valueMax,
  onChange,
  histogram = [],
  currency = "₦",
}: PriceRangeSliderProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState<"min" | "max" | null>(null);

  const range = max - min || 1;
  const currentMin = valueMin ?? min;
  const currentMax = valueMax ?? max;

  // Debounced commits — thumbs track drag immediately, filter state updates after 150ms
  const [pendingMin, setPendingMin] = useState(currentMin);
  const [pendingMax, setPendingMax] = useState(currentMax);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(null);

  // Sync external value changes (e.g. clear filters) into pending state
  useEffect(() => {
    setPendingMin(currentMin);
    setPendingMax(currentMax);
  }, [currentMin, currentMax]);

  // Debounced commit to parent filter state
  // P-A round 7 (FIND-04): only commit AFTER a real user drag. Previously the
  // sync effect set pending -> debounce fired on mount -> Explore received
  // phantom Min/Max filters on load and re-fetched (infinite re-render loop).
  const didDragRef = useRef(false);
  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (!didDragRef.current) return;
    timerRef.current = setTimeout(() => {
      onChange(pendingMin, pendingMax);
    }, 150);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [pendingMin, pendingMax, onChange]);

  const pct = useCallback((v: number) => ((v - min) / range) * 100, [min, range]);

  const handleMinChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      didDragRef.current = true;
      const v = Number(e.target.value);
      setPendingMin(Math.min(v, pendingMax));
    },
    [pendingMax]
  );

  const handleMaxChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      didDragRef.current = true;
      const v = Number(e.target.value);
      setPendingMax(Math.max(v, pendingMin));
    },
    [pendingMin]
  );

  const minPct = pct(currentMin);
  const maxPct = pct(currentMax);

  return (
    <div data-testid="price-range-slider" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {/* Histogram bars */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          gap: 2,
          height: 32,
          marginBottom: 4,
        }}
        aria-hidden="true"
      >
        {histogram?.map((count, i) => {
          const maxCount = Math.max(...histogram, 1);
          const height = (count / maxCount) * 100;
          const bucketStart = min + (i / BUCKETS) * range;
          const bucketEnd = min + ((i + 1) / BUCKETS) * range;
          const inRange = bucketStart >= currentMin && bucketEnd <= currentMax;
          return (
            <div
              key={i}
              style={{
                flex: 1,
                height: `${Math.max(height, 4)}%`,
                borderRadius: 2,
                background: inRange ? "var(--color-forest)" : "var(--color-ink-subtle)",
                opacity: inRange ? 1 : 0.4,
                transition: "all 0.15s ease",
              }}
            />
          );
        })}
      </div>

      {/* Range inputs */}
      <div ref={trackRef} style={{ position: "relative", height: 24 }}>
        {/* Track background */}
        <div
          style={{
            position: "absolute",
            top: "50%",
            transform: "translateY(-50%)",
            left: 0,
            right: 0,
            height: 4,
            borderRadius: 2,
            background: "var(--color-ink-subtle)",
          }}
        />
        {/* Active range */}
        <div
          style={{
            position: "absolute",
            top: "50%",
            transform: "translateY(-50%)",
            left: `${minPct}%`,
            width: `${maxPct - minPct}%`,
            height: 4,
            borderRadius: 2,
            background: "var(--color-forest)",
          }}
        />
        {/* Min thumb */}
        <input
          data-testid="price-slider-min"
          type="range"
          min={min}
          max={max}
          value={currentMin}
          onChange={handleMinChange}
          onFocus={() => setActive("min")}
          onBlur={() => setActive(null)}
          aria-label="Minimum price"
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuenow={currentMin}
          style={{
            position: "absolute",
            top: "50%",
            left: 0,
            width: "100%",
            height: 24,
            transform: "translateY(-50%)",
            background: "transparent",
            WebkitAppearance: "none",
            appearance: "none",
            cursor: "pointer",
            zIndex: active === "min" ? 3 : 2,
          }}
        />
        {/* Max thumb */}
        <input
          data-testid="price-slider-max"
          type="range"
          min={min}
          max={max}
          value={currentMax}
          onChange={handleMaxChange}
          onFocus={() => setActive("max")}
          onBlur={() => setActive(null)}
          aria-label="Maximum price"
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuenow={currentMax}
          style={{
            position: "absolute",
            top: "50%",
            left: 0,
            width: "100%",
            height: 24,
            transform: "translateY(-50%)",
            background: "transparent",
            WebkitAppearance: "none",
            appearance: "none",
            cursor: "pointer",
            zIndex: active === "max" ? 3 : 2,
          }}
        />
      </div>

      {/* Price labels */}
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "var(--color-ink-muted)" }}>
        <span>{currency}{formatPrice(currentMin)}</span>
        <span>{currency}{formatPrice(currentMax)}</span>
      </div>

      {/* Screen-reader live region */}
      <div aria-live="polite" style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0,0,0,0)" }}>
        Price range: {currency}{formatPrice(currentMin)} to {currency}{formatPrice(currentMax)}
      </div>
    </div>
  );
}
