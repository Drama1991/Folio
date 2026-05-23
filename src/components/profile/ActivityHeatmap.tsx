import type { NeoDBMark } from "@/lib/neodb/types";
import { YearPicker } from "./YearPicker";

interface Props {
  /** 渲染年份 */
  year: number;
  /** 当前年（用于年份切换 tab） */
  currentYear: number;
  /** 已经过滤到 [year-01-01, year+1-01-01) 的 marks */
  marks: NeoDBMark[];
  /** profile handle，用于年份切换链接 */
  handle: string;
}

/* 5 档：与 .chip.on 同系金 */
const COLORS = ["#F1EFE8", "#FCEFD2", "#F8D896", "#F2B85A", "#EF9F27"] as const;
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const CELL = 11;
const GAP = 3;
const STEP = CELL + GAP;
const DAY_LABEL_W = 28;

function dayKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function bucketize(marks: NeoDBMark[]): Map<string, number> {
  const m = new Map<string, number>();
  for (const mk of marks) {
    const d = new Date(mk.created_time);
    if (Number.isNaN(+d)) continue;
    m.set(dayKey(d), (m.get(dayKey(d)) ?? 0) + 1);
  }
  return m;
}

function bucketLevel(count: number): 0 | 1 | 2 | 3 | 4 {
  if (count <= 0) return 0;
  if (count === 1) return 1;
  if (count === 2) return 2;
  if (count <= 4) return 3;
  return 4;
}

export function ActivityHeatmap({ year, currentYear, marks, handle }: Props) {
  const counts = bucketize(marks);

  // 构建栅格：从 Jan 1 所在周的 Sunday 起，到 Dec 31 之后的 Saturday
  const yearStart = new Date(year, 0, 1);
  const yearEndExcl = new Date(year + 1, 0, 1);
  const startDow = yearStart.getDay(); // 0 = Sun
  const gridStart = new Date(year, 0, 1 - startDow);

  // 计算列数（周数）
  const daysSpan = Math.ceil((+yearEndExcl - +gridStart) / 86400000);
  const cols = Math.ceil(daysSpan / 7);

  type Cell = { date: string; count: number; level: 0 | 1 | 2 | 3 | 4; m: number; d: number } | null;
  const weeks: Cell[][] = [];
  for (let w = 0; w < cols; w++) {
    const week: Cell[] = [];
    for (let r = 0; r < 7; r++) {
      const date = new Date(gridStart);
      date.setDate(gridStart.getDate() + w * 7 + r);
      if (date.getFullYear() !== year) {
        week.push(null);
      } else {
        const k = dayKey(date);
        const c = counts.get(k) ?? 0;
        week.push({ date: k, count: c, level: bucketLevel(c), m: date.getMonth(), d: date.getDate() });
      }
    }
    weeks.push(week);
  }

  // 月份标签：找每列中第一个有效日的月份，若是该月第一周 → 标
  const monthMarks: { col: number; label: string }[] = [];
  let lastM = -1;
  for (let w = 0; w < weeks.length; w++) {
    const first = weeks[w].find((c) => c !== null);
    if (!first) continue;
    if (first.m !== lastM && first.d <= 7) {
      monthMarks.push({ col: w, label: MONTHS[first.m] });
      lastM = first.m;
    }
  }

  const total = marks.length;
  const gridW = cols * STEP - GAP;
  const gridH = 7 * STEP - GAP;

  return (
    <div className="heatmap-container" style={{
      border: "0.5px solid var(--border)",
      borderRadius: "var(--r)",
      padding: "18px 22px 16px",
      background: "var(--bg)",
      marginBottom: 24,
      overflowX: "auto",
    }}>
      {/* 头部：计数 + 年份切换 */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14, minWidth: gridW + DAY_LABEL_W }}>
        <div>
          <p style={{ fontFamily: "var(--mono)", fontSize: 11, letterSpacing: "0.12em", color: "var(--text3)", textTransform: "uppercase" }}>
            活动热力图
          </p>
          <p style={{ fontFamily: "var(--serif)", fontSize: 17, fontWeight: 500, marginTop: 4, letterSpacing: "-0.01em" }}>
            {year} 年完成 <span style={{ color: "var(--gold)" }}>{total}</span> 件作品
          </p>
        </div>
        <YearPicker handle={handle} currentYear={currentYear} selected={year} range={20} />
      </div>

      {/* 栅格区 */}
      <div style={{ position: "relative", minWidth: gridW + DAY_LABEL_W }}>
        {/* 月份标签条 */}
        <div style={{ position: "relative", height: 14, marginLeft: DAY_LABEL_W }}>
          {monthMarks.map(({ col, label }) => (
            <span
              key={col}
              style={{
                position: "absolute",
                left: col * STEP,
                top: 0,
                fontFamily: "var(--mono)",
                fontSize: 11,
                color: "var(--text3)",
                letterSpacing: "0.04em",
              }}
            >
              {label}
            </span>
          ))}
        </div>

        {/* 主体：day labels + week 列 */}
        <div style={{ display: "flex", gap: 6 }}>
          {/* 周标签 */}
          <div style={{ display: "flex", flexDirection: "column", gap: GAP, width: DAY_LABEL_W - 6, paddingTop: 0 }}>
            {[0, 1, 2, 3, 4, 5, 6].map((r) => (
              <span
                key={r}
                style={{
                  height: CELL,
                  lineHeight: `${CELL}px`,
                  fontFamily: "var(--mono)",
                  fontSize: 11,
                  color: "var(--text3)",
                  visibility: r === 1 || r === 3 || r === 5 ? "visible" : "hidden",
                  textAlign: "right",
                }}
              >
                {r === 1 ? "Mon" : r === 3 ? "Wed" : r === 5 ? "Fri" : ""}
              </span>
            ))}
          </div>
          {/* 周列 */}
          <div style={{ display: "flex", gap: GAP }}>
            {weeks.map((week, wi) => (
              <div key={wi} style={{ display: "flex", flexDirection: "column", gap: GAP }}>
                {week.map((c, ri) =>
                  c === null ? (
                    <div key={ri} style={{ width: CELL, height: CELL }} />
                  ) : (
                    <div
                      key={ri}
                      title={`${c.date} · ${c.count} 件`}
                      style={{
                        width: CELL,
                        height: CELL,
                        background: COLORS[c.level],
                        borderRadius: 2,
                        outline: c.level === 0 ? "0.5px solid rgba(0,0,0,0.04)" : "none",
                        outlineOffset: -0.5,
                      }}
                    />
                  ),
                )}
              </div>
            ))}
          </div>
        </div>

        {/* 图例 */}
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          marginTop: 10,
          fontFamily: "var(--mono)",
          fontSize: 11,
          color: "var(--text3)",
          justifyContent: "flex-end",
        }}>
          <span>少</span>
          {COLORS.map((c, i) => (
            <span key={i} style={{
              width: CELL,
              height: CELL,
              background: c,
              borderRadius: 2,
              outline: i === 0 ? "0.5px solid rgba(0,0,0,0.04)" : "none",
              outlineOffset: -0.5,
              display: "inline-block",
            }} />
          ))}
          <span>多</span>
        </div>

        {/* 极简空态提示（窗口内无 marks） */}
        {total === 0 && (
          <div style={{
            position: "absolute",
            inset: 14,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: "var(--serif)",
            fontSize: 12,
            color: "var(--text3)",
            pointerEvents: "none",
          }}>
            {year} 年还没有完成的记录
          </div>
        )}
      </div>
    </div>
  );
}
