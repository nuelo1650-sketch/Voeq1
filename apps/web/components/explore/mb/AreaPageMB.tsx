"use client";

/**
 * AreaPageMB (Money Bag B3, A20-slim) — /explore/areas/[slug]: the local flyer.
 *
 * Data: /api/explore?area=<slug> + areas taxonomy from /api/areas (or inline
 * fallback from a static list until the areas API exists). Honesty (B7):
 * real listing counts only; empty area = honest "no stalls here yet" state;
 * proximity lines only render when the area is genuinely near a campus
 * (Delta pocket — Okerenkoko/Kurutie/Ugbomro near NMU).
 */

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import type { ExploreListing } from "@voeq/data";
import { MbCard } from "./MbCard";

/** Minimal client taxonomy mirror — the areas API is the canonical source at build. */
export const AREA_DIRECTORY: { state: string; areas: { id: string; name: string }[] }[] = [
  { state: "Abia", areas: [{ id: "abia-aba", name: "Aba" }, { id: "abia-umuahia", name: "Umuahia" }] },
  { state: "Adamawa", areas: [{ id: "adamawa-yola", name: "Yola" }] },
  { state: "Akwa Ibom", areas: [{ id: "akwaibom-uyo", name: "Uyo" }, { id: "akwaibom-eket", name: "Eket" }] },
  { state: "Anambra", areas: [{ id: "anambra-awka", name: "Awka" }, { id: "anambra-onitsha", name: "Onitsha" }, { id: "anambra-nnewi", name: "Nnewi" }] },
  { state: "Bauchi", areas: [{ id: "bauchi-bauchi", name: "Bauchi" }] },
  { state: "Bayelsa", areas: [{ id: "bayelsa-yenagoa", name: "Yenagoa" }] },
  { state: "Benue", areas: [{ id: "benue-makurdi", name: "Makurdi" }] },
  { state: "Borno", areas: [{ id: "borno-maiduguri", name: "Maiduguri" }] },
  { state: "Cross River", areas: [{ id: "crossriver-calabar", name: "Calabar" }] },
  { state: "Delta", areas: [{ id: "delta-asaba", name: "Asaba" }, { id: "delta-warri", name: "Warri" }, { id: "delta-okerenkoko", name: "Okerenkoko" }, { id: "delta-kurutie", name: "Kurutie" }, { id: "delta-ugbomro", name: "Ugbomro" }] },
  { state: "Ebonyi", areas: [{ id: "ebonyi-abakaliki", name: "Abakaliki" }] },
  { state: "Edo", areas: [{ id: "edo-benin-city", name: "Benin City" }, { id: "edo-ekpoma", name: "Ekpoma" }] },
  { state: "Ekiti", areas: [{ id: "ekiti-ado-ekiti", name: "Ado Ekiti" }] },
  { state: "Enugu", areas: [{ id: "enugu-enugu", name: "Enugu" }] },
  { state: "FCT", areas: [{ id: "fct-abuja-central", name: "Abuja Central" }, { id: "fct-abuja-garki", name: "Garki" }, { id: "fct-abuja-wuse", name: "Wuse" }, { id: "fct-abuja-nyanya", name: "Nyanya" }] },
  { state: "Gombe", areas: [{ id: "gombe-gombe", name: "Gombe" }] },
  { state: "Imo", areas: [{ id: "imo-owerri", name: "Owerri" }] },
  { state: "Jigawa", areas: [{ id: "jigawa-dutse", name: "Dutse" }] },
  { state: "Kaduna", areas: [{ id: "kaduna-kaduna", name: "Kaduna" }, { id: "kaduna-zaria", name: "Zaria" }] },
  { state: "Kano", areas: [{ id: "kano-kano", name: "Kano" }] },
  { state: "Katsina", areas: [{ id: "katsina-katsina", name: "Katsina" }] },
  { state: "Kebbi", areas: [{ id: "kebbi-birnin-kebbi", name: "Birnin Kebbi" }] },
  { state: "Kogi", areas: [{ id: "kogi-lokoja", name: "Lokoja" }] },
  { state: "Kwara", areas: [{ id: "kwara-ilorin", name: "Ilorin" }] },
  { state: "Lagos", areas: [{ id: "lagos-ikeja", name: "Ikeja" }, { id: "lagos-yaba", name: "Yaba" }, { id: "lagos-surulere", name: "Surulere" }, { id: "lagos-lekki", name: "Lekki" }, { id: "lagos-ikorodu", name: "Ikorodu" }] },
  { state: "Nasarawa", areas: [{ id: "nasarawa-keffi", name: "Keffi" }] },
  { state: "Niger", areas: [{ id: "niger-minna", name: "Minna" }] },
  { state: "Ogun", areas: [{ id: "ogun-abeokuta", name: "Abeokuta" }, { id: "ogun-ago-iwoye", name: "Ago Iwoye" }] },
  { state: "Ondo", areas: [{ id: "ondo-akure", name: "Akure" }] },
  { state: "Osun", areas: [{ id: "osun-osogbo", name: "Osogbo" }, { id: "osun-ile-ife", name: "Ile-Ife" }] },
  { state: "Oyo", areas: [{ id: "oyo-ibadan", name: "Ibadan" }, { id: "oyo-ogbomoso", name: "Ogbomoso" }] },
  { state: "Plateau", areas: [{ id: "plateau-jos", name: "Jos" }] },
  { state: "Rivers", areas: [{ id: "rivers-port-harcourt", name: "Port Harcourt" }, { id: "rivers-bori", name: "Bori" }] },
  { state: "Sokoto", areas: [{ id: "sokoto-sokoto", name: "Sokoto" }] },
  { state: "Taraba", areas: [{ id: "taraba-jalingo", name: "Jalingo" }] },
  { state: "Yobe", areas: [{ id: "yobe-damaturu", name: "Damaturu" }] },
  { state: "Zamfara", areas: [{ id: "zamfara-gusau", name: "Gusau" }] },
];

/** Proximity lines ONLY where geographically true (Delta pocket near NMU). */
const PROXIMITY: Record<string, string> = {
  "delta-okerenkoko": "Right next to NMU",
  "delta-kurutie": "A short ride from NMU",
  "delta-ugbomro": "Minutes from NMU",
};

function findArea(slug: string) {
  for (const s of AREA_DIRECTORY) {
    const a = s.areas.find((x) => x.id === slug);
    if (a) return { state: s.state, name: a.name, id: a.id };
  }
  return null;
}

export function AreaPageMB() {
  const params = useParams<{ slug: string }>();
  const slug = params?.slug ?? "";
  const area = useMemo(() => findArea(slug), [slug]);

  const [data, setData] = useState<ExploreListing[] | null>(null);
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");

  useEffect(() => {
    if (!area) return;
    const q = new URLSearchParams({ area: area.id, sections: "1" });
    let cancelled = false;
    fetch(`/api/explore?${q.toString()}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((res) => {
        if (cancelled) return;
        setData(res.data ?? []);
        setStatus("success");
      })
      .catch(() => !cancelled && setStatus("error"));
    return () => {
      cancelled = true;
    };
  }, [area]);

  if (!area) {
    return (
      <div style={{ minHeight: "60vh", display: "grid", placeItems: "center", padding: 24 }}>
        <div style={{ textAlign: "center" }}>
          <p style={{ fontFamily: "var(--role-font-display)", fontSize: 20, color: "var(--forest-deep, #0F2A1D)" }}>Area not found</p>
          <Link href="/explore?next=mb" style={{ color: "var(--forest-deep, #0F2A1D)", fontWeight: 700, fontSize: 14 }}>
            ← Back to the full market
          </Link>
        </div>
      </div>
    );
  }

  const proximity = PROXIMITY[area.id];
  const listings = data ?? [];

  return (
    <div data-testid="mb-area-page" style={{ minHeight: "100vh" }}>
      <header style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px var(--nav-inline-pad, 16px)", borderBottom: "1px solid var(--role-border)" }}>
        <Link href="/" aria-label="Voeq" style={{ textDecoration: "none" }}>
          <span style={{ fontFamily: "var(--role-font-display)", fontWeight: 800, fontSize: 22, color: "var(--forest-deep, #0F2A1D)" }}>
            voeq<span style={{ color: "var(--color-amber, #E8A33D)" }}>.</span>
          </span>
        </Link>
        <span style={{ fontSize: 13, color: "var(--role-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          Explore <span aria-hidden style={{ opacity: 0.5 }}>/</span> <b style={{ color: "var(--role-text)" }}>{area.name}</b>
        </span>
        <span style={{ flex: 1 }} />
        <Link href="/explore?next=mb" style={{ fontSize: 13.5, fontWeight: 700, color: "var(--forest-deep, #0F2A1D)", textDecoration: "none", whiteSpace: "nowrap" }}>
          Full market →
        </Link>
      </header>

      {/* Local flyer masthead */}
      <section style={{ background: "var(--forest-deep, #0F2A1D)", padding: "30px var(--nav-inline-pad, 16px) 26px", margin: "0 calc(-1 * var(--nav-inline-pad, 16px))" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <span style={{ fontSize: 11.5, fontWeight: 800, letterSpacing: "0.12em", color: "rgba(246,241,230,0.6)" }}>
            {area.state.toUpperCase()} · THE LOCAL FLYER
          </span>
          <h1 style={{ margin: "10px 0 0", fontFamily: "var(--role-font-display)", fontSize: "clamp(26px, 6vw, 40px)", color: "#f6f1e6", fontWeight: 900 }}>
            What&apos;s selling in {area.name}
          </h1>
          {proximity && (
            <p data-testid="mb-area-proximity" style={{ margin: "8px 0 0", fontSize: 13.5, color: "var(--color-amber, #E8A33D)", fontWeight: 600 }}>
              📍 {proximity}
            </p>
          )}
          <p style={{ margin: "10px 0 0", fontSize: 14, color: "rgba(246,241,230,0.75)" }}>
            {status === "success" ? `${listings.length} listing${listings.length === 1 ? "" : "s"} from vendors around ${area.name}` : "…"}
          </p>
        </div>
      </section>

      <main style={{ maxWidth: 1200, margin: "0 auto", padding: "22px var(--nav-inline-pad, 16px) 50px" }}>
        {status === "loading" && (
          <div data-testid="mb-area-loading" style={{ padding: "40px 0", textAlign: "center", color: "var(--role-muted)", fontSize: 14 }}>
            Checking the notice board…
          </div>
        )}
        {status === "error" && (
          <div data-testid="mb-area-error" role="alert" style={{ padding: "40px 0", textAlign: "center" }}>
            <p style={{ fontWeight: 600, color: "var(--role-text)" }}>The flyer is unreachable right now.</p>
            <button onClick={() => window.location.reload()} style={{ border: "1px solid var(--role-border)", background: "var(--role-surface)", borderRadius: 999, padding: "8px 18px", cursor: "pointer", fontWeight: 600 }}>
              Try again
            </button>
          </div>
        )}
        {status === "success" && listings.length === 0 && (
          <div data-testid="mb-area-empty" style={{ padding: "44px 22px", border: "1.5px dashed var(--role-border)", borderRadius: 20, textAlign: "center" }}>
            <p style={{ margin: 0, fontFamily: "var(--role-font-display)", fontSize: 20, color: "var(--forest-deep, #0F2A1D)" }}>
              No stalls here yet
            </p>
            <p style={{ margin: "8px 0 0", fontSize: 14, color: "var(--role-muted)" }}>
              {area.name} is on the map — the first vendor here sets the tone.
            </p>
            <Link href="/become-vendor" style={{ display: "inline-flex", marginTop: 14, background: "var(--forest-deep, #0F2A1D)", color: "#f6f1e6", borderRadius: 999, padding: "10px 20px", fontSize: 13.5, fontWeight: 700, textDecoration: "none" }}>
              Open a stall in {area.name}
            </Link>
          </div>
        )}
        {listings.length > 0 && (
          <div data-testid="mb-area-grid" style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 12 }}>
            {listings.map((l, i) => (
              <MbCard key={l.id} listing={l} revealDelay={(i % 4) * 100} eager={i < 2} />
            ))}
          </div>
        )}

        {/* Sibling areas in the same state */}
        <section style={{ marginTop: 30 }}>
          <h2 style={{ fontFamily: "var(--role-font-display)", fontSize: 19, color: "var(--forest-deep, #0F2A1D)", margin: "0 0 10px" }}>
            More in {area.state}
          </h2>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {(AREA_DIRECTORY.find((s) => s.state === area.state)?.areas ?? [])
              .filter((a) => a.id !== area.id)
              .map((a) => (
                <Link key={a.id} href={`/explore/areas/${a.id}`} style={{ border: "1px solid var(--role-border)", borderRadius: 999, padding: "7px 14px", fontSize: 13, fontWeight: 600, color: "var(--role-text)", textDecoration: "none", background: "var(--role-surface)" }}>
                  {a.name}
                </Link>
              ))}
            <Link href="/explore?next=mb" style={{ border: "1px solid rgba(15,42,29,0.3)", borderRadius: 999, padding: "7px 14px", fontSize: 13, fontWeight: 700, color: "var(--forest-deep, #0F2A1D)", textDecoration: "none" }}>
              All 36 states →
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
