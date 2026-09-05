"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { prepareImageForUpload } from "@/lib/image-prep";
import { uploadPhoto as uploadPhotoDirect } from "@/lib/image-upload";
import { X, Upload, GripVertical, AlertCircle, Trash2 } from "lucide-react";
import { categories } from "@voeq/data";
import type { Listing } from "@voeq/data";

/**
 * K3b.3 — Listing edit page with delete functionality.
 * Same form as create, pre-filled with existing data. Delete with confirmation modal.
 */

interface PhotoDraft {
  id: string;
  url: string;
  alt: string;
  uploading: boolean;
  // P-A round 81 (G): see ListingCreatePage — failed uploads must never reach
  // the API as blob: URLs (server Cloudinary gate rejects the whole save).
  failed?: boolean;
}

export function ListingEditPage({ listing }: { listing: Listing }) {
  const router = useRouter();

  // Form fields - initialize with existing listing data
  const [title, setTitle] = useState(listing.title);
  const [shortDesc, setShortDesc] = useState("");
  const [description, setDescription] = useState(listing.description || "");
  const [categoryId, setCategoryId] = useState(listing.categoryId);
  const [minPrice, setMinPrice] = useState(String(listing.priceMinMinor / 100));
  const [maxPrice, setMaxPrice] = useState(listing.priceMaxMinor ? String(listing.priceMaxMinor / 100) : "");
  const [photos, setPhotos] = useState<PhotoDraft[]>(
    (listing.images || []).map((url, i) => ({ id: `photo-${i}`, url, alt: "", uploading: false }))
  );

  // UI state
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

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

    // P-A round 81 (G): counters for the async loop (stale-closure fix,
    // same as ListingCreatePage).
    const photosStart = photos.length;
    let uploaded = 0;
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file.type.startsWith("image/")) continue;

      const id = `photo-${Date.now()}-${i}`;
      // Show a local preview immediately; replaced by the real Cloudinary URL after upload.
      const preview = URL.createObjectURL(file);
      setPhotos((prev) => [...prev, { id, url: preview, alt: "", uploading: true }]);

      try {
        // P-A round 65: DIRECT upload — browser -> Cloudinary (signed token),
        // server never sees the bytes. Client prep still downscales + errors.
        const prep = await prepareImageForUpload(file);
        if ("error" in prep) {
          setErrors((prev) => ({ ...prev, photos: prep.error }));
          setPhotos((prev) => prev.map((p) => (p.id === id ? { ...p, uploading: false, failed: true } : p)));
          continue;
        }
        const uploadFile = prep.blob ? new File([prep.blob], file.name, { type: prep.mimeType || file.type }) : file;
        const result = await uploadPhotoDirect(uploadFile, "listing_photo", { existingCount: photosStart + uploaded });
        if (!result.ok) {
          throw new Error(result.reason || "Upload failed");
        }
        uploaded += 1;
        URL.revokeObjectURL(preview);
        setPhotos((prev) =>
          prev.map((p) => (p.id === id ? { ...p, url: result.url as string, uploading: false } : p)),
        );
      } catch (e) {
        setPhotos((prev) => prev.map((p) => (p.id === id ? { ...p, uploading: false, failed: true } : p)));
        setErrors((prev) => ({ ...prev, photos: e instanceof Error ? e.message : "Image upload failed" }));
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

  const saveChanges = async () => {
    if (!validateAll()) {
      return;
    }

    // P-A round 81 (G): same guard as ListingCreatePage — never PATCH with
    // blob: URLs (failed or still-uploading photos) past the Cloudinary gate.
    if (photos.some((p) => p.uploading)) {
      setErrors({ submit: "Photo still uploading — give it a moment, then tap Save again." });
      return;
    }
    if (photos.some((p) => p.failed || p.url.startsWith("blob:"))) {
      setErrors({ submit: "One or more photos failed to upload. Remove the failed photo(s) or try again, then tap Save." });
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/listings/${listing.id}`, {
        method: "PATCH",
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
        router.push(`/listing/${listing.id}`);
      } else {
        const error = await res.json().catch(() => ({ error: "Failed to update listing" }));
        setErrors({ submit: error.error });
      }
    } catch {
      setErrors({ submit: "Network error" });
    } finally {
      setSubmitting(false);
    }
  };

  const deleteListing = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/listings/${listing.id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        router.push("/vendor/dashboard");
      } else {
        const error = await res.json().catch(() => ({ error: "Failed to delete listing" }));
        setErrors({ submit: error.error });
        setShowDeleteModal(false);
      }
    } catch {
      setErrors({ submit: "Network error" });
      setShowDeleteModal(false);
    } finally {
      setDeleting(false);
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
            Edit listing
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
            saveChanges();
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
            <Field label="Title" required error={errors.title}>
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

            {/* Full description */}
            <Field label="Description" required error={errors.description}>
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
            <Field label="Photos" error={errors.photos}>
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
                      {/* P-A round 81 (G): show which photo failed (see ListingCreatePage). */}
                      {photo.failed && (
                        <span style={{ fontSize: 12, color: "var(--color-danger)", fontWeight: 600 }}>Failed — remove or retry</span>
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
              onClick={() => setShowDeleteModal(true)}
              style={{
                padding: "10px 20px",
                fontSize: 14,
                fontWeight: 600,
                background: "transparent",
                color: "var(--color-danger)",
                border: "1px solid var(--color-danger)",
                borderRadius: 6,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <Trash2 size={16} />
              Delete listing
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
              {submitting ? "Saving..." : "Save changes"}
            </button>
          </div>
        </form>
      </div>

      {/* Delete confirmation modal */}
      {showDeleteModal && (
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
          onClick={() => setShowDeleteModal(false)}
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
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: 24, margin: 0, marginBottom: 12, color: "var(--color-forest)" }}>
              Delete &quot;{title}&quot;?
            </h2>
            <p style={{ margin: 0, marginBottom: "var(--space-4)", color: "var(--color-ink)", lineHeight: 1.5 }}>
              This cannot be undone. Your listing will be removed from search and your storefront.
            </p>
            <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
              <button
                onClick={() => setShowDeleteModal(false)}
                disabled={deleting}
                style={{
                  padding: "10px 20px",
                  fontSize: 14,
                  fontWeight: 500,
                  background: "transparent",
                  color: "var(--color-ink-muted)",
                  border: "1px solid var(--color-ink-subtle)",
                  borderRadius: 6,
                  cursor: deleting ? "not-allowed" : "pointer",
                }}
              >
                Cancel
              </button>
              <button
                onClick={deleteListing}
                disabled={deleting}
                style={{
                  padding: "10px 20px",
                  fontSize: 14,
                  fontWeight: 600,
                  background: deleting ? "var(--color-ink-subtle)" : "var(--color-danger)",
                  color: "var(--color-cream)",
                  border: "none",
                  borderRadius: 6,
                  cursor: deleting ? "not-allowed" : "pointer",
                }}
              >
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({
  label,
  required,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {label && (
        <label style={{ fontSize: 14, fontWeight: 600, color: "var(--color-forest)" }}>
          {label}
          {required && <span style={{ color: "var(--color-amber-dark)", marginLeft: 4 }}>*</span>}
        </label>
      )}
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
