"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Camera, Upload, CheckCircle, AlertCircle, X } from "lucide-react";
import { categories } from "@voeq/data";
import type { Vendor } from "@voeq/data";

/**
 * K3b.4 — Comprehensive storefront management with modern tabbed/sectioned layout.
 * Business identity, profile photo, hours, socials, verification.
 */

const DAYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;
const DAY_LABELS: Record<(typeof DAYS)[number], string> = {
  mon: "Monday",
  tue: "Tuesday",
  wed: "Wednesday",
  thu: "Thursday",
  fri: "Friday",
  sat: "Saturday",
  sun: "Sunday",
};

export function StorefrontManagement({ vendor, disabled }: { vendor: Vendor; disabled: boolean }) {
  const router = useRouter();

  return (
    <div style={{ minHeight: "100vh", background: "var(--color-glass-white)", padding: "var(--space-4)" }}>
      <div style={{ maxWidth: 960, margin: "0 auto" }}>
        {/* Header */}
        <header style={{ marginBottom: "var(--space-4)" }}>
          <Link
            href="/vendor/dashboard"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              color: "var(--color-ink-muted)",
              textDecoration: "none",
              fontSize: 14,
              marginBottom: 12,
            }}
          >
            ← Back to dashboard
          </Link>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: 36, margin: 0, color: "var(--color-forest)" }}>
            Storefront settings
          </h1>
          <p style={{ fontSize: 16, color: "var(--color-ink-muted)", margin: 0, marginTop: 8 }}>
            Manage your public storefront appearance and information
          </p>
        </header>

        {disabled && (
          <div
            role="alert"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "var(--space-3)",
              background: "#FEE2E2",
              color: "#991B1B",
              borderRadius: 12,
              marginBottom: "var(--space-4)",
            }}
          >
            <AlertCircle size={24} />
            <div>
              <p style={{ margin: 0, fontWeight: 600 }}>Your storefront is suspended</p>
              <p style={{ margin: 0, fontSize: 14 }}>Editing is disabled. Contact support for details.</p>
            </div>
          </div>
        )}

        {/* Sections */}
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
          <BusinessIdentitySection vendor={vendor} disabled={disabled} />
          <ProfilePhotoSection vendor={vendor} disabled={disabled} />
          <OperatingHoursSection vendor={vendor} disabled={disabled} />
          <SocialLinksSection vendor={vendor} disabled={disabled} />
          <VerificationSection vendor={vendor} />
        </div>
      </div>
    </div>
  );
}

// Business Identity Section
function BusinessIdentitySection({ vendor, disabled }: { vendor: Vendor; disabled: boolean }) {
  const router = useRouter();
  const [name, setName] = useState(vendor.name);
  const [description, setDescription] = useState(vendor.description);
  const [categoryId, setCategoryId] = useState(vendor.categoryIds[0] ?? "");
  const [subArea, setSubArea] = useState(vendor.subArea ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const save = async () => {
    if (disabled) return;
    if (description.trim().length < 50) {
      setError("Description must be at least 50 characters");
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const res = await fetch("/api/vendor/identity", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description, primaryCategoryId: categoryId, subArea }),
      });

      if (res.ok) {
        setSuccess(true);
        router.refresh();
      } else {
        const data = await res.json().catch(() => ({ error: "Failed to save" }));
        setError(data.error);
      }
    } catch {
      setError("Network error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Section title="Business identity" icon={<Camera size={24} />}>
      <Field label="Business name" required>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={disabled}
          placeholder="Your business name"
          style={inputStyle}
          minLength={2}
        />
      </Field>

      <Field label="Description" required hint="Min 50 characters">
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          disabled={disabled}
          placeholder="Tell students what makes your business special..."
          style={{ ...inputStyle, minHeight: 100, resize: "vertical", fontFamily: "var(--font-body)" }}
          minLength={50}
        />
        <span style={{ fontSize: 12, color: description.length >= 50 ? "var(--color-forest-mid)" : "var(--color-ink-muted)" }}>
          {description.length}/50 minimum
        </span>
      </Field>

      <Field label="Primary category" required>
        <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} disabled={disabled} style={inputStyle}>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Sub-area" hint="e.g. North Gate, Engineering Faculty (optional)">
        <input
          type="text"
          value={subArea}
          onChange={(e) => setSubArea(e.target.value)}
          disabled={disabled}
          placeholder="Hostel, faculty, hall..."
          style={inputStyle}
        />
      </Field>

      {error && <ErrorMessage>{error}</ErrorMessage>}
      {success && <SuccessMessage>Saved successfully!</SuccessMessage>}

      <button onClick={save} disabled={disabled || saving} style={primaryButtonStyle(disabled || saving)}>
        {saving ? "Saving..." : "Save changes"}
      </button>
    </Section>
  );
}

// Profile Photo Section
function ProfilePhotoSection({ vendor, disabled }: { vendor: Vendor; disabled: boolean }) {
  const router = useRouter();
  const [uploading, setUploading] = useState(false);
  const [showRemoveModal, setShowRemoveModal] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUpload = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("Please select an image file");
      return;
    }

    setUploading(true);
    setError(null);

    try {
      // Read the real file as a base64 data URL and upload to the server
      // (Cloudinary + Sightengine moderation). No mock in production.
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error("read_failed"));
        reader.readAsDataURL(file);
      });

      const res = await fetch("/api/vendor/photo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileName: file.name, dataUrl }),
      });

      if (res.ok) {
        router.refresh();
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Upload failed");
      }
    } catch {
      setError("Network error");
    } finally {
      setUploading(false);
    }
  };

  const removePhoto = async () => {
    setRemoving(true);
    try {
      const res = await fetch("/api/vendor/photo", {
        method: "DELETE",
      });

      if (res.ok) {
        setShowRemoveModal(false);
        router.refresh();
      } else {
        setError("Failed to remove photo");
      }
    } catch {
      setError("Network error");
    } finally {
      setRemoving(false);
    }
  };

  return (
    <Section title="Profile photo" icon={<Camera size={24} />} hint="Your photo appears on your storefront and in search results">
      {vendor.profilePhotoUrl ? (
        <div style={{ display: "flex", gap: "var(--space-3)", alignItems: "flex-start" }}>
          <img
            src={vendor.profilePhotoUrl}
            alt={vendor.name}
            style={{ width: 120, height: 120, objectFit: "cover", borderRadius: 12, border: "1px solid var(--color-ink-subtle)" }}
          />
          <div style={{ flex: 1 }}>
            <p style={{ margin: 0, marginBottom: 12, color: "var(--color-ink-muted)", fontSize: 14 }}>
              Current profile photo
            </p>
            <div style={{ display: "flex", gap: 12 }}>
              <label style={{ ...secondaryButtonStyle, cursor: disabled ? "not-allowed" : "pointer", display: "inline-flex" }}>
                Upload new
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])}
                  disabled={disabled || uploading}
                  style={{ display: "none" }}
                />
              </label>
              <button
                onClick={() => setShowRemoveModal(true)}
                disabled={disabled}
                style={{ ...secondaryButtonStyle, color: "var(--color-danger)", borderColor: "var(--color-danger)" }}
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div>
          <label
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 12,
              padding: "var(--space-4)",
              border: "2px dashed var(--color-ink-subtle)",
              borderRadius: 12,
              cursor: disabled ? "not-allowed" : "pointer",
              background: "var(--color-glass-white)",
            }}
          >
            <Upload size={32} style={{ color: "var(--color-ink-muted)" }} />
            <span style={{ color: "var(--color-ink-muted)", fontSize: 14 }}>
              {uploading ? "Uploading..." : "Click to upload photo"}
            </span>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])}
              disabled={disabled || uploading}
              style={{ display: "none" }}
            />
          </label>
        </div>
      )}

      {error && <ErrorMessage>{error}</ErrorMessage>}

      {/* Remove confirmation modal */}
      {showRemoveModal && (
        <Modal onClose={() => setShowRemoveModal(false)}>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: 24, margin: 0, marginBottom: 12, color: "var(--color-forest)" }}>
            Remove profile photo?
          </h2>
          <p style={{ margin: 0, marginBottom: "var(--space-4)", color: "var(--color-ink)" }}>
            Your storefront will appear without a profile photo.
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
            <button onClick={() => setShowRemoveModal(false)} disabled={removing} style={secondaryButtonStyle}>
              Cancel
            </button>
            <button
              onClick={removePhoto}
              disabled={removing}
              style={{ ...primaryButtonStyle(removing), background: "var(--color-danger)" }}
            >
              {removing ? "Removing..." : "Remove"}
            </button>
          </div>
        </Modal>
      )}
    </Section>
  );
}

// Operating Hours Section
function OperatingHoursSection({ vendor, disabled }: { vendor: Vendor; disabled: boolean }) {
  const router = useRouter();
  const h = vendor.hours;
  const [open, setOpen] = useState(h?.open ?? "09:00");
  const [close, setClose] = useState(h?.close ?? "18:00");
  const [days, setDays] = useState<string[]>([...(h?.days ?? [])]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const toggleDay = (day: string) => {
    setDays((prev) => (prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]));
  };

  const copyToWeekdays = () => {
    const weekdays = ["mon", "tue", "wed", "thu", "fri"];
    setDays(weekdays);
  };

  const save = async () => {
    if (disabled) return;

    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const res = await fetch("/api/vendor/hours", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ open, close, days }),
      });

      if (res.ok) {
        setSuccess(true);
        router.refresh();
      } else {
        const data = await res.json().catch(() => ({ error: "Failed to save" }));
        setError(data.error);
      }
    } catch {
      setError("Network error");
    } finally {
      setSaving(false);
    }
  };

  // Calculate current status
  const isOpenNow = () => {
    if (days.length === 0) return null;
    const now = new Date();
    const dayNames = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
    const today = dayNames[now.getDay()];
    if (!days.includes(today)) return false;

    const [oh, om] = open.split(":").map(Number);
    const [ch, cm] = close.split(":").map(Number);
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const openMinutes = oh * 60 + om;
    const closeMinutes = ch * 60 + cm;

    return currentMinutes >= openMinutes && currentMinutes < closeMinutes;
  };

  const openStatus = isOpenNow();

  return (
    <Section title="Operating hours" icon={<Camera size={24} />}>
      {openStatus !== null && (
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "8px 12px",
            background: openStatus ? "var(--color-forest)" : "var(--color-ink-subtle)",
            color: "var(--color-cream)",
            borderRadius: 6,
            fontSize: 14,
            fontWeight: 600,
            marginBottom: "var(--space-3)",
          }}
        >
          Currently: {openStatus ? "Open" : "Closed"}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: "var(--space-3)" }}>
        <Field label="Open time">
          <input type="time" value={open} onChange={(e) => setOpen(e.target.value)} disabled={disabled} style={inputStyle} />
        </Field>
        <Field label="Close time">
          <input type="time" value={close} onChange={(e) => setClose(e.target.value)} disabled={disabled} style={inputStyle} />
        </Field>
      </div>

      <Field label="Operating days">
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {DAYS.map((day) => (
            <label key={day} style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={days.includes(day)}
                onChange={() => toggleDay(day)}
                disabled={disabled}
                style={{ width: 18, height: 18 }}
              />
              <span style={{ fontSize: 14, color: "var(--color-ink)" }}>{DAY_LABELS[day]}</span>
            </label>
          ))}
        </div>
      </Field>

      <button onClick={copyToWeekdays} disabled={disabled} style={{ ...secondaryButtonStyle, marginBottom: "var(--space-2)" }}>
        Copy Monday to all weekdays
      </button>

      {error && <ErrorMessage>{error}</ErrorMessage>}
      {success && <SuccessMessage>Saved successfully!</SuccessMessage>}

      <button onClick={save} disabled={disabled || saving} style={primaryButtonStyle(disabled || saving)}>
        {saving ? "Saving..." : "Save hours"}
      </button>
    </Section>
  );
}

// Social Links Section
function SocialLinksSection({ vendor, disabled }: { vendor: Vendor; disabled: boolean }) {
  const router = useRouter();
  const s = vendor.socials ?? {};
  const [instagram, setInstagram] = useState(s.instagram ?? "");
  const [twitter, setTwitter] = useState(s.twitter ?? "");
  const [tiktok, setTiktok] = useState(s.tiktok ?? "");
  const [phone, setPhone] = useState(s.phone ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const save = async () => {
    if (disabled) return;

    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const res = await fetch("/api/vendor/socials", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ instagram, twitter, tiktok, phone }),
      });

      if (res.ok) {
        setSuccess(true);
        router.refresh();
      } else {
        const data = await res.json().catch(() => ({ error: "Failed to save" }));
        setError(data.error);
      }
    } catch {
      setError("Network error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Section title="Social links" icon={<Camera size={24} />} hint="Connect with students on social media">
      <Field label="Instagram" hint="Handle or URL">
        <input
          type="text"
          value={instagram}
          onChange={(e) => setInstagram(e.target.value)}
          disabled={disabled}
          placeholder="@yourbusiness"
          style={inputStyle}
        />
      </Field>

      <Field label="X / Twitter" hint="Handle">
        <input
          type="text"
          value={twitter}
          onChange={(e) => setTwitter(e.target.value)}
          disabled={disabled}
          placeholder="@yourbusiness"
          style={inputStyle}
        />
      </Field>

      <Field label="TikTok" hint="Handle">
        <input
          type="text"
          value={tiktok}
          onChange={(e) => setTiktok(e.target.value)}
          disabled={disabled}
          placeholder="@yourbusiness"
          style={inputStyle}
        />
      </Field>

      <Field label="Phone" hint="For calls only">
        <input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          disabled={disabled}
          placeholder="+234..."
          style={inputStyle}
        />
      </Field>

      {error && <ErrorMessage>{error}</ErrorMessage>}
      {success && <SuccessMessage>Saved successfully!</SuccessMessage>}

      <button onClick={save} disabled={disabled || saving} style={primaryButtonStyle(disabled || saving)}>
        {saving ? "Saving..." : "Save social links"}
      </button>
    </Section>
  );
}

// Verification Section
function VerificationSection({ vendor }: { vendor: Vendor }) {
  const [requesting, setRequesting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const requestVerification = async () => {
    setRequesting(true);
    setError(null);
    setSuccess(false);

    try {
      // Create a staff case for verification request
      const res = await fetch("/api/staff/cases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "verification_request",
          vendorId: vendor.id,
          description: "Vendor requesting verification badge",
        }),
      });

      if (res.ok) {
        setSuccess(true);
      } else {
        setError("Failed to submit request");
      }
    } catch {
      setError("Network error");
    } finally {
      setRequesting(false);
    }
  };

  return (
    <Section title="Verification status" icon={vendor.verified ? <CheckCircle size={24} /> : <AlertCircle size={24} />}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "var(--space-3)",
          background: vendor.verified ? "var(--color-forest)" : "var(--color-glass-white)",
          color: vendor.verified ? "var(--color-cream)" : "var(--color-ink)",
          borderRadius: 12,
          border: vendor.verified ? "none" : "1px solid var(--color-ink-subtle)",
        }}
      >
        {vendor.verified ? <CheckCircle size={24} /> : <AlertCircle size={24} />}
        <div style={{ flex: 1 }}>
          <p style={{ margin: 0, fontWeight: 600 }}>
            {vendor.verified ? "Verified" : "Not verified"}
          </p>
          <p style={{ margin: 0, fontSize: 14, opacity: 0.9 }}>
            {vendor.verified
              ? "Your storefront has a verification badge"
              : "Verified vendors get a badge on their storefront"}
          </p>
        </div>
      </div>

      {!vendor.verified && (
        <>
          {error && <ErrorMessage>{error}</ErrorMessage>}
          {success && <SuccessMessage>Verification request submitted! We'll review it soon.</SuccessMessage>}

          <button
            onClick={requestVerification}
            disabled={requesting || success}
            style={primaryButtonStyle(requesting || success)}
          >
            {requesting ? "Submitting..." : success ? "Request submitted" : "Request verification"}
          </button>
        </>
      )}
    </Section>
  );
}

// Reusable components
function Section({
  title,
  icon,
  hint,
  children,
}: {
  title: string;
  icon?: React.ReactNode;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      style={{
        background: "var(--color-cream)",
        border: "1px solid var(--color-ink-subtle)",
        borderRadius: 12,
        padding: "var(--space-4)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: "var(--space-3)" }}>
        {icon && <div style={{ color: "var(--color-forest-mid)" }}>{icon}</div>}
        <div style={{ flex: 1 }}>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: 24, margin: 0, color: "var(--color-forest)" }}>
            {title}
          </h2>
          {hint && <p style={{ margin: 0, marginTop: 4, fontSize: 14, color: "var(--color-ink-muted)" }}>{hint}</p>}
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>{children}</div>
    </section>
  );
}

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
      <label style={{ fontSize: 14, fontWeight: 600, color: "var(--color-forest)" }}>
        {label}
        {required && <span style={{ color: "var(--color-amber-dark)", marginLeft: 4 }}>*</span>}
      </label>
      {hint && <p style={{ fontSize: 12, color: "var(--color-ink-muted)", margin: 0 }}>{hint}</p>}
      {children}
    </div>
  );
}

function ErrorMessage({ children }: { children: React.ReactNode }) {
  return (
    <div
      role="alert"
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: 12,
        background: "#FEE2E2",
        color: "#991B1B",
        borderRadius: 8,
        fontSize: 14,
      }}
    >
      <AlertCircle size={16} />
      {children}
    </div>
  );
}

function SuccessMessage({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: 12,
        background: "var(--color-forest)",
        color: "var(--color-cream)",
        borderRadius: 8,
        fontSize: 14,
      }}
    >
      <CheckCircle size={16} />
      {children}
    </div>
  );
}

function Modal({ onClose, children }: { onClose: () => void; children: React.ReactNode }) {
  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(0, 0, 0, 0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "var(--color-cream)",
          border: "1px solid var(--color-ink-subtle)",
          borderRadius: 12,
          padding: "var(--space-4)",
          maxWidth: 480,
          width: "90%",
        }}
      >
        {children}
      </div>
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

const primaryButtonStyle = (disabled: boolean): React.CSSProperties => ({
  padding: "12px 24px",
  fontSize: 14,
  fontWeight: 600,
  background: disabled ? "var(--color-ink-subtle)" : "var(--color-forest)",
  color: "var(--color-cream)",
  border: "none",
  borderRadius: 8,
  cursor: disabled ? "not-allowed" : "pointer",
  boxShadow: !disabled ? "0 2px 8px rgba(15, 42, 29, 0.2)" : "none",
});

const secondaryButtonStyle: React.CSSProperties = {
  padding: "10px 20px",
  fontSize: 14,
  fontWeight: 500,
  background: "transparent",
  color: "var(--color-ink-muted)",
  border: "1px solid var(--color-ink-subtle)",
  borderRadius: 6,
  cursor: "pointer",
};
