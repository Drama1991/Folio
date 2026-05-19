import Link from "next/link";
import { Cover } from "@/components/shared/Cover";
import { Stars } from "@/components/shared/Stars";
import { relativeTime } from "@/lib/format/dates";
import { statusVerb } from "@/lib/format/verbs";
import type { UiArchiveRow } from "@/lib/neodb/ui-types";

const STATUS_PILL: Record<string, { bg: string; fg: string }> = {
  complete: { bg: "var(--bg2)", fg: "var(--text3)" },
  progress: { bg: "#EEF6E8", fg: "#0F6E56" },
  wishlist: { bg: "#FAEEDA", fg: "#854F0B" },
  dropped: { bg: "#F4E8E8", fg: "#8C3B52" },
};

export function ArchiveRow({ row }: { row: UiArchiveRow }) {
  const pill = STATUS_PILL[row.status] ?? STATUS_PILL.complete;
  return (
    <Link href={`/detail/${row.medium}/${row.uuid}`} className="row" style={{ textDecoration: "none", color: "inherit" }}>
      <Cover src={row.cover ?? undefined} seed={row.uuid} width={38} height={54} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontFamily: "var(--serif)", fontSize: 14, fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {row.title}
        </p>
        <p style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--text3)", marginTop: 3 }}>
          {[row.year, row.creator].filter(Boolean).join(" · ")}
        </p>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
        {row.rating ? <Stars value={row.rating} size={12} /> : null}
        <span className="badge" style={{ background: pill.bg, color: pill.fg }}>{statusVerb(row.medium, row.status)}</span>
        <span style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--text3)" }}>{relativeTime(row.updatedAt)}</span>
      </div>
    </Link>
  );
}
