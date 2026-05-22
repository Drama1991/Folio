import { Skeleton } from "@/components/shared/Skeleton";

export default function HomeLoading() {
  return (
    <div style={{ padding: "28px 24px 24px" }}>
      {/* HomeHero 问候语 + 右侧 AI logo */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, marginBottom: 22 }}>
        <div style={{ flex: 1 }}>
          <Skeleton width={260} height={36} radius={4} style={{ marginBottom: 8 }} />
          <Skeleton width={180} height={11} radius={3} />
        </div>
        <Skeleton width={44} height={44} radius={22} />
      </div>

      {/* BentoTop: featured + 4 stat boxes */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0,3fr) minmax(0,2fr)",
          gap: 10,
          marginBottom: 10,
        }}
      >
        <Skeleton width="100%" height={196} radius={10} />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} width="100%" height={88} radius={6} />
          ))}
        </div>
      </div>

      {/* ActivityStrip */}
      <div
        style={{
          border: "0.5px solid var(--border)",
          borderRadius: "var(--r)",
          overflow: "hidden",
          marginBottom: 10,
        }}
      >
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              padding: "12px 20px",
              borderBottom: i < 4 ? "0.5px solid var(--border)" : undefined,
            }}
          >
            <Skeleton width={3} height={34} radius={2} />
            <div style={{ flex: 1 }}>
              <Skeleton width="55%" height={14} style={{ marginBottom: 6 }} />
              <Skeleton width="35%" height={11} radius={3} />
            </div>
            <Skeleton width={70} height={11} radius={3} />
          </div>
        ))}
      </div>

      {/* CategoryCells */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 8 }}>
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} width="100%" height={138} radius={6} />
        ))}
      </div>
    </div>
  );
}
