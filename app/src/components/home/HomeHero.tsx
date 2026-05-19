"use client";
import { greeting, todayHeader } from "@/lib/format/dates";
import { useState, useEffect } from "react";

export function HomeHero({ display }: { display: string }) {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => setNow(new Date()), []);
  const g = now ? greeting(now) : "夜安";
  const hd = now ? todayHeader(now) : "";
  return (
    <div style={{ marginBottom: 14 }}>
      <p style={{ fontFamily: "var(--serif)", fontSize: 40, fontWeight: 500, lineHeight: 1, letterSpacing: "-0.02em" }}>
        {g}。
      </p>
      <p style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--text3)", letterSpacing: ".06em", marginTop: 8 }}>
        {display} · {hd}
      </p>
    </div>
  );
}
