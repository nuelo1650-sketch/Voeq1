"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, Building2, MapPin, FileText, Check } from "lucide-react";
import { categories, type Campus } from "@voeq/data";
import { VENDOR_AGREEMENT_TEXT, CURRENT_VENDOR_AGREEMENT_VERSION } from "@voeq/data";

/**
 * VS3.2 Phase A wizard + VS3.7 resume/abandon + K3a.6 modern layout.
 * 3-step wizard: Business identity → Campus & presence → Vendor Agreement.
 * Auto-saves on step completion, resumes at last step, modern centered card design.
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

  // Step 1: Business identity
  const [name, setName] = useState(initial.name);
  const [description, setDescription] = useState(initial.description);
  const [categoryId, setCategoryId] = useState(initial.categoryId);
  const [profilePhotoUrl, setProfilePhotoUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  // Step 2: Campus & presence
  const [allCampuses, setAllCampuses] = useState<Campus[]>([]);
  const [campusResults, setCampusResults] = useState<Campus[]>([]);
  const [selectedCampus, setSelectedCampus] = useState<Campus | null>(null);
  const [subArea, setSubArea] = useState(initial.subArea);

  // Load campus list via server route (real Neon; D-1 verified visibility)
  useEffect(() => {
    fetch("/api/campuses/list")
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { campuses?: Campus[] } | null) => {
        const rows = d?.campuses ?? [];
        setAllCampuses(rows);
        setCampusResults(rows);
        if (initial.campusId) setSelectedCampus(rows.find((c) => c.id === initial.campusId) ?? null);
      })
      .catch(() => {});
  }, [initial.campusId]);

  // Step 3: Agreement
  const [agreed, setAgreed] = useState(false);

  // Rehydrate draft on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (!raw) return;
      const d = JSON.parse(raw) as Partial<Initial> & { step?: number; agreed?: boolean; profilePhotoUrl?: string | null };
      if (typeof d.step === "number" && d.step >= 1 && d.step <= 3) setStep(d.step as Step);
      if (d.name) setName(d.name);
      if (d.description) setDescription(d.description);
      if (d.categoryId) setCategoryId(d.categoryId);
      if (d.subArea) setSubArea(d.subArea);
      if (d.agreed) setAgreed(true);
      if (d.profilePhotoUrl) setProfilePhotoUrl(d.profilePhotoUrl);
    } catch {
      /* ignore corrupt draft */
    }
  }, []);

  // Persist draft on every change
  useEffect(() => {
    try {
      localStorage.setItem(
        DRAFT_KEY,
        JSON.stringify({ step, name, description, categoryId, subArea, agreed, profilePhotoUrl })
      );
    } catch {
      /* storage may be unavailable */
    }
  }, [step, name, description, categoryId, subArea, agreed, profilePhotoUrl]);

  const post = async (path: string, body: unknown) => {
    const res = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    return { res, data };
  };

  const clearDraft = () => {
    try {
      localStorage.removeItem(DRAFT_KEY);
    } catch {
      /* ignore */
    }
  };

  const uploadPhoto = async (file: File): Promise<string | null> => {
    setUploading(true);
    setError(null);
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      const res = await fetch("/api/images/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: file.name,
          context: "vendor_photo",
          mimeType: file.type,
          bytes: file.size,
          dataUrl,
        }),
      });
      const result = await res.json();
      if (!res.ok || !result.url) {
        setError(result.error ?? "Photo upload failed. You can add it later in settings.");
        return null;
      }
      return result.url as string;
    } catch {
      setError("Photo upload failed. You can add it later in settings.");
      return null;
    } finally {
      setUploading(false);
    }
  };

  const submitStep1 = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (name.trim().length < 2) {
      setError("Business name must be at least 2 characters.");
      return;
    }
    if (description.trim().length < 50) {
      setError("Detailed description must be at least 50 characters.");
      return;
    }
    if (!categoryId) {
      setError("Please select a primary category.");
      return;
    }

    setSubmitting(true);
    try {
      const { res, data } = await post("/api/onboarding/vendor/step-1", {
        name,
        description,
        categoryId,
        profilePhotoUrl,
      });
      if (!res.ok) {
        setError(data.error ?? "Could not save.");
        return;
      }
      setStep(2);
    } catch {
      setError("Network error.");
    } finally {
      setSubmitting(false);
    }
  };

  const submitStep2 = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!selectedCampus) {
      setError("Please choose your campus.");
      return;
    }

    setSubmitting(true);
    try {
      const { res, data } = await post("/api/onboarding/vendor/step-2", {
        campus: selectedCampus.id,
        subArea,
      });
      if (!res.ok) {
        setError(data.error ?? "Could not save.");
        return;
      }
      setStep(3);
    } catch {
      setError("Network error.");
    } finally {
      setSubmitting(false);
    }
  };

  const submitStep3 = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!agreed) {
      setError("You must accept the Vendor Agreement.");
      return;
    }

    setSubmitting(true);
    try {
      const { res, data } = await post("/api/onboarding/vendor/step-3", { agreed: true });
      if (!res.ok) {
        setError(data.error ?? "Could not complete.");
        return;
      }
      clearDraft();
      router.push("/vendor/dashboard");
    } catch {
      setError("Network error.");
    } finally {
      setSubmitting(false);
    }
  };

  const goBack = () => {
    if (step > 1) setStep((step - 1) as Step);
  };

  return (
    <div
      data-testid="vendor-onboarding"
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--color-glass-white)",
        padding: "var(--space-3)",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 640,
          background: "var(--color-cream)",
          border: "1px solid var(--color-ink-subtle)",
          borderRadius: 16,
          padding: "var(--space-4)",
          boxShadow: "0 4px 24px rgba(0,0,0,0.06)",
        }}
      >
        {/* Progress stepper */}
        <div style={{ marginBottom: "var(--space-4)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            {[1, 2, 3].map((s) => (
              <div key={s} style={{ flex: 1, display: "flex", alignItems: "center" }}>
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    background: step >= s ? "var(--color-forest)" : "var(--color-cream)",
                    border: `2px solid ${step >= s ? "var(--color-forest)" : "var(--color-ink-subtle)"}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 600,
                    fontSize: 14,
                    color: step >= s ? "var(--color-cream)" : "var(--color-ink-muted)",
                  }}
                >
                  {step > s ? <Check size={18} /> : s}
                </div>
                {s < 3 && (
                  <div
                    style={{
                      flex: 1,
                      height: 2,
                      background: step > s ? "var(--color-forest)" : "var(--color-ink-subtle)",
                      marginLeft: 8,
                      marginRight: 8,
                    }}
                  />
                )}
              </div>
            ))}
          </div>
          <p style={{ fontSize: 12, fontWeight: 500, color: "var(--color-ink-muted)", textAlign: "center" }}>
            Step {step} of 3
          </p>
        </div>

        {/* Step content */}
        {step === 1 && (
          <form onSubmit={submitStep1} noValidate>
            <div style={{ marginBottom: "var(--space-3)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                <Building2 size={24} style={{ color: "var(--color-forest-mid)" }} />
                <h2
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: 28,
                    margin: 0,
                    color: "var(--color-forest)",
                  }}
                >
                  Tell us about your business
                </h2>
              </div>
              <p style={{ fontSize: 14, color: "var(--color-ink-muted)", margin: 0 }}>
                What do you call it? What do you do?
              </p>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
              <Field label="Business name" required>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Mama Nkechi Kitchen"
                  style={inputStyle}
                  required
                  minLength={2}
                  data-testid="vendor-name"
                />
              </Field>

              <Field label="Business photo" hint="Shown on your storefront. Optional — add later in settings.">
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  {profilePhotoUrl ? (
                    <img src={profilePhotoUrl} alt="Business" style={{ width: 56, height: 56, borderRadius: "50%", objectFit: "cover", border: "1px solid var(--color-ink-subtle)" }} />
                  ) : (
                    <div style={{ width: 56, height: 56, borderRadius: "50%", background: "var(--color-forest-light)", color: "var(--color-cream)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, fontWeight: 600 }}>
                      {name.trim().charAt(0).toUpperCase() || "?"}
                    </div>
                  )}
                  <label style={{ ...inputStyle, display: "inline-flex", alignItems: "center", gap: 8, cursor: "pointer", flex: 1 }}>
                    {uploading ? "Uploading…" : profilePhotoUrl ? "Change photo" : "Upload photo"}
                    <input
                      type="file"
                      accept="image/*"
                      data-testid="vendor-photo"
                      style={{ display: "none" }}
                      onChange={async (e) => {
                        const f = e.target.files?.[0];
                        if (!f) return;
                        const url = await uploadPhoto(f);
                        if (url) setProfilePhotoUrl(url);
                      }}
                    />
                  </label>
                </div>
              </Field>

              <Field label="Detailed description" required>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Tell students what makes your business special…"
                  style={{ ...inputStyle, minHeight: 100, resize: "vertical", fontFamily: "var(--font-body)" }}
                  required
                  minLength={50}
                  data-testid="vendor-description"
                />
                <span
                  style={{
                    fontSize: 12,
                    color: description.length >= 50 ? "var(--color-forest-mid)" : "var(--color-ink-muted)",
                    marginTop: 4,
                  }}
                >
                  {description.length}/50 minimum
                </span>
              </Field>

              <Field label="Primary category" required>
                <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} style={inputStyle} required data-testid="vendor-category">
                  <option value="">Select a category…</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </Field>
            </div>

            {error && <ErrorMessage>{error}</ErrorMessage>}
            <NextButton disabled={submitting}>Next</NextButton>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={submitStep2} noValidate>
            <div style={{ marginBottom: "var(--space-3)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                <MapPin size={24} style={{ color: "var(--color-forest-mid)" }} />
                <h2
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: 28,
                    margin: 0,
                    color: "var(--color-forest)",
                  }}
                >
                  Where are you?
                </h2>
              </div>
              <p style={{ fontSize: 14, color: "var(--color-ink-muted)", margin: 0 }}>
                Help students on your campus find you.
              </p>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
              <Field label="Campus" required>
                <input
                  type="text"
                  onChange={(e) => {
                    const q = e.target.value;
                    const needle = q.trim().toLowerCase();
                    setCampusResults(q.trim() === "" ? allCampuses : allCampuses.filter((c) => c.name.toLowerCase().includes(needle)));
                  }}
                  placeholder="Search your university"
                  style={inputStyle}
                  autoComplete="off"
                  data-testid="vendor-campus-search"
                />
                {campusResults.length > 0 && (
                  <div
                    style={{
                      marginTop: 8,
                      maxHeight: 200,
                      overflowY: "auto",
                      border: "1px solid var(--color-ink-subtle)",
                      borderRadius: 8,
                    }}
                  >
                    {campusResults.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setSelectedCampus(c)}
                        style={{
                          width: "100%",
                          padding: 12,
                          textAlign: "left",
                          background: selectedCampus?.id === c.id ? "var(--color-forest-light)" : "transparent",
                          color: selectedCampus?.id === c.id ? "var(--color-cream)" : "var(--color-forest)",
                          border: "none",
                          borderBottom: "1px solid var(--color-ink-subtle)",
                          cursor: "pointer",
                        }}
                      >
                        <div style={{ fontWeight: 500 }}>{c.name}</div>
                        <div style={{ fontSize: 12, opacity: 0.8 }}>
                          {c.city}, {c.state}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
                {selectedCampus && (
                  <div
                    style={{
                      marginTop: 8,
                      padding: 12,
                      background: "var(--color-forest)",
                      color: "var(--color-cream)",
                      borderRadius: 8,
                    }}
                  >
                    <strong>Selected:</strong> {selectedCampus.name}
                  </div>
                )}
              </Field>

              <Field label="Sub-area (optional)" hint="e.g. North Gate, Engineering Faculty">
                <input
                  type="text"
                  value={subArea}
                  onChange={(e) => setSubArea(e.target.value)}
                  placeholder="Hostel, faculty, hall…"
                  style={inputStyle}
                  data-testid="vendor-subarea"
                />
              </Field>
            </div>

            {error && <ErrorMessage>{error}</ErrorMessage>}
            <div style={{ display: "flex", gap: 12, marginTop: "var(--space-3)" }}>
              <BackButton onClick={goBack} />
              <NextButton disabled={submitting || !selectedCampus}>Next</NextButton>
            </div>
          </form>
        )}

        {step === 3 && (
          <form onSubmit={submitStep3} noValidate>
            <div style={{ marginBottom: "var(--space-3)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                <FileText size={24} style={{ color: "var(--color-forest-mid)" }} />
                <h2
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: 28,
                    margin: 0,
                    color: "var(--color-forest)",
                  }}
                >
                  One last thing
                </h2>
              </div>
              <p style={{ fontSize: 14, color: "var(--color-ink-muted)", margin: 0 }}>
                Read and agree to the Vendor Agreement.
              </p>
            </div>

            <div
              style={{
                background: "var(--color-glass-white)",
                border: "1px solid var(--color-ink-subtle)",
                borderRadius: 8,
                padding: "var(--space-3)",
                maxHeight: 300,
                overflowY: "auto",
                marginBottom: "var(--space-3)",
              }}
            >
              <h3
                style={{
                  fontSize: 16,
                  fontWeight: 600,
                  marginTop: 0,
                  marginBottom: 12,
                  color: "var(--color-forest)",
                }}
              >
                Vendor Agreement (v{CURRENT_VENDOR_AGREEMENT_VERSION})
              </h3>
              <pre
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: 13,
                  lineHeight: 1.6,
                  color: "var(--color-ink)",
                  whiteSpace: "pre-wrap",
                  margin: 0,
                }}
              >
                {VENDOR_AGREEMENT_TEXT}
              </pre>
            </div>

            <label
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 12,
                cursor: "pointer",
                marginBottom: "var(--space-3)",
              }}
            >
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                style={{ width: 20, height: 20, flexShrink: 0, marginTop: 2 }}
                data-testid="vendor-agree-checkbox"
              />
              <span style={{ fontSize: 14, color: "var(--color-forest)" }}>
                I agree to the Vendor Agreement
              </span>
            </label>

            {error && <ErrorMessage>{error}</ErrorMessage>}
            <div style={{ display: "flex", gap: 12, marginTop: "var(--space-3)" }}>
              <BackButton onClick={goBack} />
              <button
                type="submit"
                disabled={submitting || !agreed}
                data-testid="vendor-agree-submit"
                style={{
                  flex: 1,
                  padding: "12px 24px",
                  fontSize: 14,
                  fontWeight: 600,
                  background: !agreed ? "var(--color-ink-subtle)" : "var(--color-forest)",
                  color: "var(--color-cream)",
                  border: "none",
                  borderRadius: 8,
                  cursor: !agreed ? "not-allowed" : "pointer",
                  boxShadow: agreed ? "0 2px 8px rgba(15, 42, 29, 0.2)" : "none",
                }}
              >
                {submitting ? "Creating…" : "Complete setup"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

// Helper components

function Field({
  label,
  required,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <label style={{ fontSize: 14, fontWeight: 500, color: "var(--color-forest)" }}>
        {label}
        {required && <span style={{ color: "var(--color-amber-dark)", marginLeft: 4 }}>*</span>}
      </label>
      {hint && <p style={{ fontSize: 12, color: "var(--color-ink-muted)", margin: 0 }}>{hint}</p>}
      {children}
    </div>
  );
}

function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: "12px 24px",
        fontSize: 14,
        fontWeight: 500,
        background: "transparent",
        color: "var(--color-ink-muted)",
        border: "1px solid var(--color-ink-subtle)",
        borderRadius: 8,
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        gap: 6,
      }}
    >
      <ChevronLeft size={16} />
      Back
    </button>
  );
}

function NextButton({ disabled, children }: { disabled: boolean; children: React.ReactNode }) {
  return (
    <button
      type="submit"
      disabled={disabled}
      style={{
        flex: 1,
        padding: "12px 24px",
        fontSize: 14,
        fontWeight: 600,
        background: disabled ? "var(--color-ink-subtle)" : "var(--color-forest)",
        color: "var(--color-cream)",
        border: "none",
        borderRadius: 8,
        cursor: disabled ? "not-allowed" : "pointer",
        boxShadow: !disabled ? "0 2px 8px rgba(15, 42, 29, 0.2)" : "none",
      }}
    >
      {children}
    </button>
  );
}

function ErrorMessage({ children }: { children: React.ReactNode }) {
  return (
    <div
      role="alert"
      style={{
        padding: 12,
        background: "var(--role-error-bg)",
        color: "var(--role-error-text)",
        borderRadius: 8,
        fontSize: 14,
        marginTop: "var(--space-3)",
      }}
    >
      {children}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  padding: "10px 12px",
  fontSize: 14,
  border: "1px solid var(--color-ink-subtle)",
  borderRadius: 8,
  background: "var(--color-glass-white)",
  color: "var(--color-ink)",
  fontFamily: "var(--font-body)",
  width: "100%",
};
