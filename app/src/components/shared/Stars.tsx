interface StarsProps {
  /** 0-5 在 UI 上展示。允许小数；本组件会四舍五入到最近的整星。 */
  value: number;
  /** Tabler icon size (px) */
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}

export function Stars({ value, size = 13, style, className }: StarsProps) {
  const clamped = Math.max(0, Math.min(5, value));
  const filled = Math.round(clamped);
  return (
    <span style={{ display: "inline-flex", gap: 0, ...style }} className={className} aria-label={`${clamped}/5 stars`}>
      {Array.from({ length: 5 }, (_, i) => (
        <i
          key={i}
          className={`ti ti-star${i < filled ? "-filled" : ""}`}
          style={{ fontSize: size, color: i < filled ? "var(--gold)" : "var(--border)" }}
        />
      ))}
    </span>
  );
}

/**
 * UI 0–5 ↔ NeoDB rating_grade 0–10
 * 无评分（null/undefined/0）返回 undefined，让 nullish-coalescing 能正确 fallback。
 */
export function ratingToUi(grade: number | null | undefined): number | undefined {
  if (!grade) return undefined;
  return Math.round((grade / 2) * 10) / 10;
}

export function ratingToNeoDB(ui: number): number {
  return Math.max(0, Math.min(10, Math.round(ui * 2)));
}
