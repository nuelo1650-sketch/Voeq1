"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { InfoPageShell } from "@/components/info/InfoPageShell";
import { campuses, searchCampus, submitNewCampus, type Campus } from "@voeq/data";

export default function SelectCampusPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<Campus[]>(campuses);
  const [selected, setSelected] = useState<Campus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function runSearch(q: string) {
    setSearch(q);
    if (q.trim() === "") {
      setResults(campuses);
    } else {
      setResults(await searchCampus(q));
    }
  }

  async function choose(c: Campus) {
    setSelected(c);
    setError(null);
  }

  async function addNew() {
    if (search.trim() === "") return;
    const c = await submitNewCampus(search.trim());
    setSelected(c);
    setError(null);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!selected) {
      setError("Choose your campus to continue.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/set-campus", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ campus: selected.id }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not save campus.");
        return;
      }
      router.push(data.redirect ?? "/onboarding/shopper");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <InfoPageShell title="Choose your campus">
      <div className="auth-card">
        <p className="auth-lede">
          Voeq works per campus. Pick yours so we can show you what&rsquo;s open nearby.
        </p>
        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          <div className="auth-field">
            <label htmlFor="campus-search">Search your university</label>
            <input
              id="campus-search"
              type="text"
              value={search}
              onChange={(e) => runSearch(e.target.value)}
              placeholder="e.g. University of Lagos"
              autoComplete="off"
            />
          </div>
          <div className="campus-list" role="listbox" aria-label="Campus results">
            {results.map((c) => (
              <button
                type="button"
                key={c.id}
                role="option"
                aria-selected={selected?.id === c.id}
                className={`campus-option${selected?.id === c.id ? " is-selected" : ""}`}
                onClick={() => choose(c)}
              >
                <span className="campus-option-name">{c.name}</span>
                <span className="campus-option-loc">{c.city}, {c.state}</span>
              </button>
            ))}
            {results.length === 0 && (
              <div className="campus-no-results">
                <p>Can&rsquo;t find your campus?</p>
                <button type="button" className="campus-submit-btn" onClick={addNew}>
                  Add &ldquo;{search}&rdquo; →
                </button>
              </div>
            )}
          </div>
          {error && <div className="auth-form-error" role="alert">{error}</div>}
          <button type="submit" className="auth-submit" disabled={submitting || !selected} data-testid="campus-submit">
            {submitting ? "Saving…" : "Continue"}
          </button>
        </form>
      </div>
    </InfoPageShell>
  );
}
