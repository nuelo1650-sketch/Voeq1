import Image from 'next/image';

/**
 * BrandLogo — the Voeq wordmark (public/Logo.png), recolored to forest green
 * via CSS mask (text only, transparent — NO green background). The PNG's alpha
 * channel is used as a mask filled with --color-forest, so the word "voeq" reads
 * in brand green on any surface (cream, white, dark) without a colored box.
 *
 * LCP batch (2026-09-05): source downscaled 1200x796 (122KB) -> 240x159
 * (6KB, 95% smaller) — it renders at 94px max everywhere, was 13x oversized,
 * and as a CSS mask it's fetched at full size on EVERY page (global nav).
 * width controls render size; height derived from the 240x159 source aspect
 * (maskSize 'contain' scales to fit regardless).
 */
export function BrandLogo({
  width = 94,
  color = 'var(--color-forest)',
  className,
  style,
}: {
  width?: number;
  color?: string;
  className?: string;
  style?: React.CSSProperties;
}) {
  const height = Math.round((width * 796) / 1200);
  return (
    <span
      className={className}
      aria-label="Voeq"
      role="img"
      style={{
        display: 'inline-block',
        width,
        height,
        // Recolor transparent PNG to the requested color using its own alpha as a mask.
        backgroundColor: color,
        WebkitMaskImage: "url('/Logo.png')",
        maskImage: "url('/Logo.png')",
        WebkitMaskRepeat: 'no-repeat',
        maskRepeat: 'no-repeat',
        WebkitMaskSize: 'contain',
        maskSize: 'contain',
        WebkitMaskPosition: 'center',
        maskPosition: 'center',
        ...style,
      }}
    />
  );
}
