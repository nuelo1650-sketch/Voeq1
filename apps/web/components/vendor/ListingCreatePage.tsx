"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { X, Upload, GripVertical, AlertCircle } from "lucide-react";
import { categories } from "@voeq/data";

/**
 * K3b.2 — Full listing create form with photo upload, validation, draft persistence.
 * Modern card layout, all fields validated, drafts saved to localStorage.
 */

const DRAFT_KEY = "voeq:listing-create-draft";

interface PhotoDraft {
  id: string;
  url: string;
  alt: string;
  uploading: boolean;
}

export function ListingCreatePage() {
  const router = useRouter();

  // Form fields
  const [title, setTitle] = useState("");
  const [shortDesc, setShortDesc] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [photos, setPhotos] = useState<PhotoDraft[]>([]);

  // UI state
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  // Load draft on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (!raw) return;
      const draft = JSON.parse(raw);
      if (draft.title) setTitle(draft.title);
      if (draft.shortDesc) setShortDesc(draft.shortDesc);
      if (draft.description) setDescription(draft.description);
      if (draft.categoryId) setCategoryId(draft.categoryId);
      if (draft.minPrice) setMinPrice(draft.minPrice);
      if (draft.maxPrice) setMaxPrice(draft.maxPrice);
      if (draft.photos) setPhotos(draft.photos);
    } catch {
      // Ignore corrupt draft
    }
  }, []);

  // Save draft on changes
  useEffect(() => {
    try {
      localStorage.setItem(
        DRAFT_KEY,
        JSON.stringify({ title, shortDesc, description, categoryId, minPrice, maxPrice, photos })
      );
    } catch {
      // Storage may be unavailable
    }
  }, [title, shortDesc, description, categoryId, minPrice, maxPrice, photos]);

  const validateField = (field: string, value: string): string | null => {
    switch (field) {
      case "title":
        if (value.length < 5) return "Title must be at least 5 characters";
        if (value.length > 100) return "Title must be under 100 characters";
        return null;
      case "shortDesc":
        if (value.length > 150) return "Short description must be under 150 characters";
        return null;
      case "description":
        if (value.length < 20) return "Full description must be at least 20 characters";
        if (value.length > 2000) return "Full description must be under 2000 characters";
        return null;
      case "categoryId":
        if (!value) return "Please select a category";
        return null;
      case "minPrice":
        const min = Number(value);
        if (isNaN(min) || min <= 0) return "Minimum price must be greater than 0";
        return null;
      case "maxPrice":
        if (value && minPrice) {
          const max = Number(value);
          const min = Number(minPrice);
          if (isNaN(max)) return "Invalid price";
          if (max < min) return "Maximum must be greater than minimum";
        }
        return null;
      default:
        return null;
    }
  };

  const validateAll = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    const titleError = validateField("title", title);
    if (titleError) newErrors.title = titleError;

    const shortDescError = validateField("shortDesc", shortDesc);
    if (shortDescError) newErrors.shortDesc = shortDescError;

    const descError = validateField("description", description);
    if (descError) newErrors.description = descError;

    const catError = validateField("categoryId", categoryId);
    if (catError) newErrors.categoryId = catError;

    const minPriceError = validateField("minPrice", minPrice);
    if (minPriceError) newErrors.minPrice = minPriceError;

    const maxPriceError = validateField("maxPrice", maxPrice);
    if (maxPriceError) newErrors.maxPrice = maxPriceError;

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFileSelect = async (files: FileList | null) => {
    if (!files) return;
    const room = 5 - photos.length;
    if (files.length > room) {
      setErrors({ ...errors, photos: `Maximum 5 photos allowed (${room} more)` });
      return;
    }

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file.type.startsWith("image/")) continue;

      const id = `photo-${Date.now()}-${i}`;
      // Show a local preview immediately; replaced by the real Cloudinary URL after upload.
      const preview = URL.createObjectURL(file);
      setPhotos((prev) => [...prev, { id, url: preview, alt: "", uploading: true }]);

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
            context: "listing_photo",
            mimeType: file.type,
            bytes: file.size,
            dataUrl,
            existingCount: photos.length,
          }),
        });
        const result = await res.json();
        if (!res.ok || !result.url) {
          throw new Error(result.error ?? "Upload failed");
        }
        URL.revokeObjectURL(preview);
        setPhotos((prev) =>
          prev.map((p) => (p.id === id ? { ...p, url: result.url as string, uploading: false } : p)),
        );
      } catch (e) {
        // Keep the local preview but mark failed so the user can retry/remove.
        setPhotos((prev) => prev.map((p) => (p.id === id ? { ...p, uploading: false } : p)));
        setErrors({ ...errors, photos: e instanceof Error ? e.message : "Image upload failed" });
      }
    }
  };

  const removePhoto = (id: string) => {
    setPhotos((prev) => prev.filter((p) => p.id !== id));
  };

  const movePhoto = (id: string, direction: "up" | "down") => {
    setPhotos((prev) => {
      const index = prev.findIndex((p) => p.id === id);
      if (index === -1) return prev;
      if (direction === "up" && index === 0) return prev;
      if (direction === "down" && index === prev.length - 1) return prev;

      const newPhotos = [...prev];
      const targetIndex = direction === "up" ? index - 1 : index + 1;
      [newPhotos[index], newPhotos[targetIndex]] = [newPhotos[targetIndex], newPhotos[index]];
      return newPhotos;
    });
  };

  const updatePhotoAlt = (id: string, alt: string) => {
    setPhotos((prev) => prev.map((p) => (p.id === id ? { ...p, alt } : p)));
  };

  const saveDraft = async () => {
    // Already auto-saved to localStorage
    alert("Draft saved!");
  };

  const publish = async () => {
    if (!validateAll()) {
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/listings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          shortDescription: shortDesc || null,
          description,
          categoryId,
          priceMinMinor: Math.round(Number(minPrice) * 100),
          priceMaxMinor: maxPrice ? Math.round(Number(maxPrice) * 100) : null,
          images: photos.map((p) => p.url),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        localStorage.removeItem(DRAFT_KEY);
        // Toast notification would go here
        router.push(`/listing/${data.id}`);
      } else {
        const error = await res.json().catch(() => ({ error: "Failed to create listing" }));
        setErrors({ submit: error.error });
      }
    } catch {
      setErrors({ submit: "Network error" });
    } finally {
      setSubmitting(false);
    }
  };

  const pricePreview = minPrice && maxPrice 
    ? `₦${minPrice} – ₦${maxPrice}`
    : minPrice
    ? `₦${minPrice}`
    : "";

  return (
    <div style={{ minHeight: "100vh", background: "var(--color-glass-white)", padding: "var(--space-4)" }}>
      <div style={{ maxWidth: 720, margin: "0 auto" }}>
        {/* Header */}
        <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "var(--space-4)" }}>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: 32, margin: 0, color: "var(--color-forest)" }}>
            Create a new listing
          </h1>
          <Link
            href="/vendor/dashboard"
            style={{
              padding: "8px 16px",
              background: "transparent",
              color: "var(--color-ink-muted)",
              border: "1px solid var(--color-ink-subtle)",
              borderRadius: 6,
              fontSize: 14,
              fontWeight: 500,
              textDecoration: "none",
            }}
          >
            Cancel
          </Link>
        </header>

        {/* Form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            publish();
          }}
          style={{
            background: "var(--color-cream)",
            border: "1px solid var(--color-ink-subtle)",
            borderRadius: 12,
            padding: "var(--space-4)",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
            {/* Title */}
            <Field label="Title" required error={errors.title} hint="e.g. 'Jollof & Plantain Bowl' or 'Phone Screen Repair'">
              <input
                type="text"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  const error = validateField("title", e.target.value);
                  setErrors((prev) => ({ ...prev, title: error || "" }));
                }}
                placeholder="What are you offering?"
                style={inputStyle}
                minLength={5}
                maxLength={100}
                required
              />
              <span style={{ fontSize: 12, color: "var(--color-ink-muted)" }}>{title.length}/100</span>
            </Field>

            {/* Short description */}
            <Field label="Short description" error={errors.shortDesc} hint="One line students see in the card preview">
              <input
                type="text"
                value={shortDesc}
                onChange={(e) => {
                  setShortDesc(e.target.value);
                  const error = validateField("shortDesc", e.target.value);
                  setErrors((prev) => ({ ...prev, shortDesc: error || "" }));
                }}
                placeholder="Optional one-liner"
                style={inputStyle}
                maxLength={150}
              />
              <span style={{ fontSize: 12, color: "var(--color-ink-muted)" }}>{shortDesc.length}/150</span>
            </Field>

            {/* Full description */}
            <Field label="Full description" required error={errors.description} hint="What's included, what to expect, your story">
              <textarea
                value={description}
                onChange={(e) => {
                  setDescription(e.target.value);
                  const error = validateField("description", e.target.value);
                  setErrors((prev) => ({ ...prev, description: error || "" }));
                }}
                placeholder="Tell students about this listing..."
                style={{ ...inputStyle, minHeight: 120, resize: "vertical", fontFamily: "var(--font-body)" }}
                minLength={20}
                maxLength={2000}
                required
              />
              <span
                style={{
                  fontSize: 12,
                  color: description.length >= 20 ? "var(--color-forest-mid)" : "var(--color-ink-muted)",
                }}
              >
                {description.length}/2000 {description.length < 20 && `(${20 - description.length} more needed)`}
              </span>
            </Field>

            {/* Category */}
            <Field label="Category" required error={errors.categoryId}>
              <select
                value={categoryId}
                onChange={(e) => {
                  setCategoryId(e.target.value);
                  const error = validateField("categoryId", e.target.value);
                  setErrors((prev) => ({ ...prev, categoryId: error || "" }));
                }}
                style={inputStyle}
                required
              >
                <option value="">Select a category...</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </Field>

            {/* Price range */}
            <fieldset style={{ border: "none", padding: 0, margin: 0 }}>
              <legend style={{ fontSize: 14, fontWeight: 600, color: "var(--color-forest)", marginBottom: 6 }}>
                Price range <span style={{ color: "var(--color-amber-dark)" }}>*</span>
              </legend>
              <p style={{ fontSize: 12, color: "var(--color-ink-muted)", margin: 0, marginBottom: 12 }}>
                Leave max empty for single-price items
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <Field label="Min price (₦)" error={errors.minPrice}>
                  <input
                    type="number"
                    value={minPrice}
                    onChange={(e) => {
                      setMinPrice(e.target.value);
                      const error = validateField("minPrice", e.target.value);
                      setErrors((prev) => ({ ...prev, minPrice: error || "" }));
                    }}
                    placeholder="1000"
                    style={inputStyle}
                    min="1"
                    required
                  />
                </Field>
                <Field label="Max price (₦)" error={errors.maxPrice}>
                  <input
                    type="number"
                    value={maxPrice}
                    onChange={(e) => {
                      setMaxPrice(e.target.value);
                      const error = validateField("maxPrice", e.target.value);
                      setErrors((prev) => ({ ...prev, maxPrice: error || "" }));
                    }}
                    placeholder="Optional"
                    style={inputStyle}
                    min={minPrice || "1"}
                  />
                </Field>
              </div>
              {pricePreview && (
                <p style={{ fontSize: 14, color: "var(--color-forest-mid)", margin: 0, marginTop: 8 }}>
                  Preview: {pricePreview}
                </p>
              )}
            </fieldset>

            {/* Photos */}
            <Field label="Photos" error={errors.photos} hint="Max 5 photos. First photo is the cover. Drag to reorder.">
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOver(false);
                  handleFileSelect(e.dataTransfer.files);
                }}
                onClick={() => document.getElementById("photo-input")?.click()}
                style={{
                  border: `2px dashed ${dragOver ? "var(--color-forest)" : "var(--color-ink-subtle)"}`,
                  borderRadius: 8,
                  padding: "var(--space-4)",
                  textAlign: "center",
                  cursor: "pointer",
                  background: dragOver ? "var(--color-glass-white)" : "transparent",
                }}
              >
                <Upload size={32} style={{ color: "var(--color-ink-muted)", marginBottom: 8 }} />
                <p style={{ margin: 0, color: "var(--color-ink-muted)", fontSize: 14 }}>
                  Drag and drop photos here, or click to browse
                </p>
                <input
                  id="photo-input"
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => handleFileSelect(e.target.files)}
                  style={{ display: "none" }}
                />
              </div>

              {photos.length > 0 && (
                <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 12 }}>
                  {photos.map((photo, index) => (
                    <div
                      key={photo.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        padding: 12,
                        background: "var(--color-glass-white)",
                        border: "1px solid var(--color-ink-subtle)",
                        borderRadius: 8,
                      }}
                    >
                      <GripVertical size={20} style={{ color: "var(--color-ink-muted)", cursor: "move" }} />
                      <img
                        src={photo.url}
                        alt={photo.alt || `Photo ${index + 1}`}
                        style={{ width: 60, height: 60, objectFit: "cover", borderRadius: 4 }}
                      />
                      <div style={{ flex: 1 }}>
                        <input
                          type="text"
                          value={photo.alt}
                          onChange={(e) => updatePhotoAlt(photo.id, e.target.value)}
                          placeholder="Alt text for accessibility"
                          style={{ ...inputStyle, width: "100%" }}
                        />
                      </div>
                      {index > 0 && (
                        <button
                          type="button"
                          onClick={() => movePhoto(photo.id, "up")}
                          style={{ padding: 4, background: "transparent", border: "none", cursor: "pointer" }}
                          title="Move up"
                        >
                          ↑
                        </button>
                      )}
                      {index < photos.length - 1 && (
                        <button
                          type="button"
                          onClick={() => movePhoto(photo.id, "down")}
                          style={{ padding: 4, background: "transparent", border: "none", cursor: "pointer" }}
                          title="Move down"
                        >
                          ↓
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => removePhoto(photo.id)}
                        style={{ padding: 4, background: "transparent", border: "none", cursor: "pointer", color: "var(--color-danger)" }}
                        title="Remove"
                      >
                        <X size={20} />
                      </button>
                      {photo.uploading && (
                        <span style={{ fontSize: 12, color: "var(--color-ink-muted)" }}>Uploading...</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </Field>

            {/* Submit error */}
            {errors.submit && (
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
                <AlertCircle size={20} />
                {errors.submit}
              </div>
            )}
          </div>

          {/* Footer */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 12,
              marginTop: "var(--space-4)",
              paddingTop: "var(--space-3)",
              borderTop: "1px solid var(--color-ink-subtle)",
            }}
          >
            <button
              type="button"
              onClick={saveDraft}
              style={{
                padding: "10px 20px",
                fontSize: 14,
                fontWeight: 500,
                background: "transparent",
                color: "var(--color-ink-muted)",
                border: "none",
                borderRadius: 6,
                cursor: "pointer",
              }}
            >
              Save as draft
            </button>
            <button
              type="submit"
              disabled={submitting}
              style={{
                padding: "12px 24px",
                fontSize: 14,
                fontWeight: 600,
                background: submitting ? "var(--color-ink-subtle)" : "var(--color-forest)",
                color: "var(--color-cream)",
                border: "none",
                borderRadius: 8,
                cursor: submitting ? "not-allowed" : "pointer",
                boxShadow: !submitting ? "0 2px 8px rgba(15, 42, 29, 0.2)" : "none",
              }}
            >
              {submitting ? "Publishing..." : "Publish"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({
  label,
  required,
  error,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
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
      {error && (
        <span style={{ fontSize: 12, color: "var(--color-danger)", display: "flex", alignItems: "center", gap: 4 }}>
          <AlertCircle size={14} />
          {error}
        </span>
      )}
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
