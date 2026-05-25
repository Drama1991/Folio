"use client";

import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";

export type EmptyStateTone = "empty" | "error";

export interface EmptyStateAction {
  label: string;
  onClick?: () => void;
  href?: string;
  primary?: boolean;
}

interface Props {
  tone?: EmptyStateTone;
  icon?: string;        // tabler 类名，如 "ti-bell-off"
  title: string;
  description?: ReactNode;
  actions?: EmptyStateAction[];
  style?: CSSProperties; // 容器覆盖（如 marginTop）
}

export function EmptyState({ tone = "empty", icon, title, description, actions, style }: Props) {
  const iconColor = tone === "error" ? "var(--gold)" : "var(--text3)";

  return (
    <div
      style={{
        border: "0.5px solid var(--border)",
        borderRadius: "var(--r)",
        padding: "36px 22px",
        textAlign: "center",
        background: "var(--bg)",
        ...style,
      }}
    >
      {icon && (
        <i
          className={`ti ${icon}`}
          aria-hidden
          style={{ fontSize: 26, color: iconColor, display: "inline-block", marginBottom: 14 }}
        />
      )}
      <p
        style={{
          fontFamily: "var(--serif)",
          fontSize: 17,
          fontWeight: 500,
          color: "var(--text)",
          letterSpacing: "-0.01em",
          lineHeight: 1.4,
        }}
      >
        {title}
      </p>
      {description && (
        <p
          style={{
            fontSize: 13,
            color: "var(--text2)",
            lineHeight: 1.7,
            marginTop: 8,
            maxWidth: 380,
            marginInline: "auto",
          }}
        >
          {description}
        </p>
      )}
      {actions && actions.length > 0 && (
        <div
          style={{
            display: "flex",
            gap: 10,
            justifyContent: "center",
            marginTop: 18,
            flexWrap: "wrap",
          }}
        >
          {actions.map((a, i) => {
            const cls = `btn${a.primary ? " primary" : ""}`;
            if (a.href) {
              return (
                <Link key={i} href={a.href} className={cls}>
                  {a.label}
                </Link>
              );
            }
            return (
              <button key={i} type="button" onClick={a.onClick} className={cls}>
                {a.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
