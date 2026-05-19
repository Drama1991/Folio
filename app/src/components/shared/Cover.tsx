import { gradientFor } from "@/lib/format/cover-gradient";

interface CoverProps {
  src?: string | null;
  seed: string;
  width?: number;
  height?: number;
  alt?: string;
  className?: string;
  style?: React.CSSProperties;
}

export function Cover({ src, seed, width = 38, height = 54, alt = "", className, style }: CoverProps) {
  const grad = gradientFor(seed);
  const dim: React.CSSProperties = { width, height, borderRadius: 4, flexShrink: 0, ...style };

  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={alt}
        className={className}
        style={{ ...dim, objectFit: "cover", background: "var(--bg2)" }}
        loading="lazy"
      />
    );
  }
  return <div className={`${grad}${className ? " " + className : ""}`} style={dim} aria-label={alt || undefined} />;
}
