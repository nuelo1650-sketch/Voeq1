"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { InfoPageShell } from "@/components/info/InfoPageShell";
import { categories, campuses, searchCampus, type Campus } from "@voeq/data";
import { VENDOR_AGREEMENT_TEXT, CURRENT_VENDOR_AGREEMENT_VERSION } from "@voeq/data";

/**
 * VS3.2 Phase A wizard + VS3.7 resume/abandon.
 * - Resumes at `initialStep` with server-provided `initial` values (mid-Phase-A).
 * - Persists a localStorage draft per step so a refresh/abandon doesn't lose input.
 * - On mount, rehydrates the draft if present (draft wins over server initial for
 *   unsaved-in-progress fields; server values are the source of truth once saved).
 */

const DRAFT_KEY = "voeq:vendor-onboarding-draft";

type Step = 1 | 2 | 3;
interface Initial {
  name: string;
  description: string;
  categoryId: string;
  subArea: string;
  campusId: string | null;
}

export function OnboardingWizard({ initialStep, initial }: { initialStep: number; initial: Initial }) {
  const router = useRouter();
  const [step, setStep] = useState<Step>((initialStep as Step) || 1);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [name, setName] = useState(initial.name);
  const [description, setDescription] = useState(initial.description);
  const [categoryId, setCategoryId] = useState(initial.categoryId);
  const [campusResults, setCampusResults] = useState<Campus[]>(campuses);
  const [selectedCampus, setSelectedCampus] = useState<Campus | null>(
    initial.campusId ? campuses.find((c) => c.id === initial.campusId) ?? null : null,
  );
  const [subArea, setSubArea] = useState(initial.subArea);
  const [agreed, setAgreed] = useState(false);

  // VS3.7 — rehydrate draft on mount (unsaved local progress).
  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (!raw) return;
      const d = JSON.parse(raw) as Partial<Initial> & { step?: number; agreed?: boolean };
      if (typeof d.step === "number" && d.step >= 1 && d.step <= 3) setStep(d.step as Step);
      if (d.name) setName(d.name);
      if (d.description) setDescription(d.description);
      if (d.categoryId) setCategoryId(d.categoryId);
      if (d.subArea) setSubArea(d.subArea);
      if (d.agreed) setAgreed(true);
    } catch {
      /* ignore corrupt draft */
    }
  }, []);

  // VS3.7 — persist draft on every change.
  useEffect(() => {
    try {
      localStorage.setItem(
        DRAFT_KEY,
        JSON.stringify({ step, name, description, categoryId, subArea, agreed }),
      );
    } catch {
      /* storage may be unavailable */
    }
  }, [step, name, description, categoryId, subArea, agreed]);

  async function post(path: string, body: unknown) {
    const res = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    return { res, data };
  }

  async function submitStep1(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const { res, data } = await post("/api/onboarding/vendor/step-1", { name, description, categoryId });
      if (!res.ok) { setError(data.error ?? "Could not save."); return; }
      clearDraft();
      setStep(2);
    } catch { setError("Network error."); }
    finally { setSubmitting(false); }
  }

  async function submitStep2(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!selectedCampus) { setError("Choose your campus."); return; }
    setSubmitting(true);
    try {
      const { res, data } = await post("/api/onboarding/vendor/step-2", { campus: selectedCampus.id, subArea });
      if (!res.ok) { setError(data.error ?? "Could not save."); return; }
      clearDraft();
      setStep(3);
    } catch { setError("Network error."); }
    finally { setSubmitting(false); }
  }

  async function submitStep3(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!agreed) { setError("You must accept the Vendor Agreement."); return; }
    setSubmitting(true);
    try {
      const { res, data } = await post("/api/onboarding/vendor/step-3", { agreed: true });
      if (!res.ok) { setError(data.error ?? "Could not complete."); return; }
      clearDraft();
      router.push("/vendor/dashboard");
    } catch { setError("Network error."); }
    finally { setSubmitting(false); }
  }

  function clearDraft() {
    try { localStorage.removeItem(DRAFT_KEY); } catch { /* ignore */ }
  }

  return (
    <InfoPageShell title="Become a vendor — Account setup">
      <div className="auth-card" data-testid="vendor-onboarding">
        <ol className="wizard-steps" aria-label="Progress">
          <li className={step >= 1 ? "is-active" : ""}>1. Business</li>
          <li className={step >= 2 ? "is-active" : ""}>2. Campus</li>
          <li className={step >= 3 ? "is-active" : ""}>3. Agreement</li>
        </ol>

        {step === 1 && (
          <form className="auth-form" onSubmit={submitStep1} noValidate>
            <div className="auth-field">
              <label htmlFor="v-name">Business name</label>
              <input id="v-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Mama Nkechi Kitchen" minLength={2} required />
            </div>
            <div className="auth-field">
              <label htmlFor="v-desc">Description (min 50 characters)</label>
              <textarea id="v-desc" value={description} onChange={(e) => setDescription(e.target.value)} rows={4} placeholder="Tell shoppers what you offer…" required />
              <span className="auth-help-text">{description.trim().length}/50</span>
            </div>
            <div className="auth-field">
              <label htmlFor="v-cat">Primary category</label>
              <select id="v-cat" value={categoryId} onChange={(e) => setCategoryId(e.target.value)} required>
                <option value="">Select a category…</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            {error && <div className="auth-form-error" role="alert">{error}</div>}
            <button type="submit" className="auth-submit" disabled={submitting}>Continue</button>
          </form>
        )}

        {step === 2 && (
          <form className="auth-form" onSubmit={submitStep2} noValidate>
            <div className="auth-field">
              <label htmlFor="v-campus-search">Campus</label>
              <input
                id="v-campus-search"
                onChange={async (e) => { const q = e.target.value; setCampusResults(q.trim() === "" ? campuses : await searchCampus(q)); }}
                placeholder="Search your university"
                autoComplete="off"
              />
              <div className="campus-list" role="listbox" aria-label="Campus results">
                {campusResults.map((c) => (
                  <button type="button" key={c.id} role="option" aria-selected={selectedCampus?.id === c.id}
                    className={`campus-option${selectedCampus?.id === c.id ? " is-selected" : ""}`} onClick={() => setSelectedCampus(c)}>
                    <span className="campus-option-name">{c.name}</span>
                    <span className="campus-option-loc">{c.city}, {c.state}</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="auth-field">
              <label htmlFor="v-sub">Sub-area (optional)</label>
              <input id="v-sub" value={subArea} onChange={(e) => setSubArea(e.target.value)} placeholder="Hostel, faculty, hall…" />
            </div>
            {error && <div className="auth-form-error" role="alert">{error}</div>}
            <button type="submit" className="auth-submit" disabled={submitting || !selectedCampus}>Continue</button>
          </form>
        )}

        {step === 3 && (
          <form className="auth-form" onSubmit={submitStep3} noValidate>
            <div className="agreement-box" aria-label="Vendor Agreement">
              <h3>Vendor Agreement (v{CURRENT_VENDOR_AGREEMENT_VERSION})</h3>
              <pre className="agreement-text">{VENDOR_AGREEMENT_TEXT}</pre>
            </div>
            <label className="auth-checkbox-row">
              <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} data-testid="vendor-agree-checkbox" />
              <span>I accept the Vendor Agreement.</span>
            </label>
            {error && <div className="auth-form-error" role="alert">{error}</div>}
            <button type="submit" className="auth-submit" disabled={submitting || !agreed} data-testid="vendor-agree-submit">Create vendor account</button>
          </form>
        )}
      </div>
    </InfoPageShell>
  );
}
