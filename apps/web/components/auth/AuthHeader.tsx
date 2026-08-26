import Link from "next/link";
import { BrandLogo } from "@/components/landing/BrandLogo";

/**
 * D3: consistent brand header for all auth cards. Keeps the product feel
 * (logo + one-line context) instead of a bare form on a blank page.
 */
export function AuthHeader({ lede }: { lede?: string }) {
  return (
    <div className="auth-header">
      <Link href="/" aria-label="Voeq home" className="auth-header-logo">
        <BrandLogo />
      </Link>
      {lede && <p className="auth-header-lede">{lede}</p>}
    </div>
  );
}