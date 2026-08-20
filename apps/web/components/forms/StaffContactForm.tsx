"use client";

import { useState, type FormEvent, type ChangeEvent } from "react";

export interface StaffField {
  name: string;
  label: string;
  type: "text" | "email" | "textarea" | "select";
  required?: boolean;
  options?: string[];
}

export interface StaffContactFormProps {
  kind: "press" | "careers";
  fields: StaffField[];
  onSubmit?: (data: Record<string, string>) => void;
}

type Errors = Record<string, string>;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * StaffContactForm — shared UI-only contact form for Press (PG-PUB-011) and
 * Careers (PG-PUB-012). Validates client-side (required + email format), shows
 * inline errors (no raw API errors), and on valid submit shows an inline success
 * state. No backend call — that lands in Phase 9. Logs the payload to console.
 *
 * The submit button is intentionally NOT natively `disabled`: an empty submit must
 * still fire validation and surface inline errors (required by the e2e acceptance
 * tests), so we keep it clickable and validate on submit instead.
 */
export function StaffContactForm({ kind, fields, onSubmit }: StaffContactFormProps) {
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(fields.map((f) => [f.name, ""])),
  );
  const [errors, setErrors] = useState<Errors>({});
  const [submitted, setSubmitted] = useState(false);

  function validate(): Errors {
    const next: Errors = {};
    for (const f of fields) {
      const v = (values[f.name] ?? "").trim();
      if (f.required && !v) {
        next[f.name] = `${f.label} is required.`;
        continue;
      }
      if (f.type === "email" && v && !EMAIL_RE.test(v)) {
        next[f.name] = "Enter a valid email address.";
      }
    }
    return next;
  }

  function handleChange(name: string, value: string) {
    setValues((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) {
      const firstBad = fields.find((f) => errs[f.name]);
      if (firstBad) {
        document.getElementById(`staff-field-${firstBad.name}`)?.focus();
      }
      return;
    }
    // UI-only mock submit — no backend until Phase 9.
    console.log("[StaffContactForm] mock submit", kind, values);
    setSubmitted(true);
    onSubmit?.(values);
  }

  if (submitted) {
    return (
      <div
        className="staff-contact-form staff-contact-form--done"
        data-testid="staff-contact-success"
        role="status"
      >
        <p>Message sent — we&rsquo;ll be in touch.</p>
      </div>
    );
  }

  return (
    <form
      className="staff-contact-form"
      data-testid="staff-contact-form"
      onSubmit={handleSubmit}
      noValidate
    >
      {fields.map((f) => {
        const id = `staff-field-${f.name}`;
        const errId = `${id}-error`;
        const invalid = Boolean(errors[f.name]);
        const common = {
          id,
          "aria-invalid": invalid,
          "aria-describedby": invalid ? errId : undefined,
          required: f.required || undefined,
          value: values[f.name] ?? "",
          onChange: (
            e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
          ) => handleChange(f.name, e.target.value),
        };
        return (
          <div className="staff-contact-field" key={f.name}>
            <label htmlFor={id}>
              {f.label}
              {f.required ? " *" : ""}
            </label>
            {f.type === "textarea" ? (
              <textarea {...common} rows={4} />
            ) : f.type === "select" ? (
              <select {...common}>
                <option value="">Select…</option>
                {f.options?.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
            ) : (
              <input type={f.type} {...common} />
            )}
            {invalid ? (
              <span className="staff-contact-error" id={errId} role="alert">
                {errors[f.name]}
              </span>
            ) : null}
          </div>
        );
      })}
      <button type="submit" className="staff-contact-submit" data-testid="staff-contact-submit">
        Send
      </button>
    </form>
  );
}
