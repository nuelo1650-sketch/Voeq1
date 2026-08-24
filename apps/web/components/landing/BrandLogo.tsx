import Image from 'next/image';

/**
 * BrandLogo — the Voeq wordmark (public/Logo.png), recolored to forest green
 * via CSS mask (text only, transparent — NO green background). The PNG's alpha
 * channel is used as a mask filled with --color-forest, so the word "voeq" reads
 * in brand green on any surface (cream, white, dark) without a colored box.
 *
 * width controls render size; height is derived from the 1200x796 source aspect.
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
