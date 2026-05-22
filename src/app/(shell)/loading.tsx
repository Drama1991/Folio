import { Skeleton } from "@/components/shared/Skeleton";

/**
 * Shell 通用加载占位。Next.js 会自动嵌套到所有子路由（home/wishlist/discover/...），
 * 子目录可加自己的 loading.tsx 来覆盖。
 */
export default function ShellLoading() {
  return (
    <div style={{ padding: "20px 24px 24px" }}>
      <div style={{ marginBottom: 18 }}>
        <Skeleton width={200} height={28} radius={4} style={{ marginBottom: 8 }} />
        <Skeleton width={120} height={11} radius={3} />
      </div>
      <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} width={64} height={26} radius={999} />
        ))}
      </div>
      <div style={{ border: "0.5px solid var(--border)", borderRadius: "var(--r)", overflow: "hidden" }}>
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              padding: "12px 20px",
              borderBottom: i < 5 ? "0.5px solid var(--border)" : undefined,
            }}
          >
            <Skeleton width={38} height={54} radius={4} />
            <div style={{ flex: 1 }}>
              <Skeleton width="60%" height={14} style={{ marginBottom: 6 }} />
              <Skeleton width="40%" height={11} radius={3} />
            </div>
            <Skeleton width={50} height={11} radius={3} />
          </div>
        ))}
      </div>
    </div>
  );
}
