import Link from "next/link";

export interface CrumbItem {
  label: string;
  href?: string;
}

interface CrumbProps {
  items: CrumbItem[];
  style?: React.CSSProperties;
}

export function Crumb({ items, style }: CrumbProps) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, ...style }}>
      {items.map((it, i) => {
        const isLast = i === items.length - 1;
        const node = (
          <span className={`crumb${isLast ? " cur" : ""}`}>{it.label}</span>
        );
        return (
          <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
            {!isLast && it.href ? <Link href={it.href}>{node}</Link> : node}
            {!isLast && <span style={{ color: "var(--text3)", fontFamily: "var(--mono)", fontSize: 11 }}>/</span>}
          </span>
        );
      })}
    </div>
  );
}
