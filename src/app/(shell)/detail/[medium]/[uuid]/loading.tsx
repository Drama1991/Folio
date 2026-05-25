import { Skeleton } from "@/components/shared/Skeleton";

/**
 * Detail page 专用骨架屏。结构匹配真实 page：面包屑 → DetailHero（左封面右标题+meta）→
 * 双列 main（左主信息卡 + 右 metaKV）。NeoDB SSR fetch 4 个 endpoint 并行 ~600-1200ms，
 * 这段时间显示这屏占位，让用户立刻看到"页面切过来了"。
 */
export default function DetailLoading() {
  return (
    <div style={{ padding: "20px 24px 24px" }}>
      {/* 面包屑 */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
        <Skeleton width={36} height={11} radius={3} />
        <Skeleton width={6} height={11} radius={3} />
        <Skeleton width={64} height={11} radius={3} />
        <Skeleton width={6} height={11} radius={3} />
        <Skeleton width={140} height={11} radius={3} />
      </div>

      {/* DetailHero：封面 + 右侧信息 */}
      <div style={{ display: "flex", gap: 18, marginBottom: 18 }}>
        <Skeleton width={120} height={170} radius={6} />
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 10 }}>
          <Skeleton width="80%" height={28} radius={4} />
          <Skeleton width="50%" height={14} radius={3} />
          <Skeleton width={120} height={18} radius={4} />
          <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
            <Skeleton width={60} height={22} radius={999} />
            <Skeleton width={70} height={22} radius={999} />
          </div>
        </div>
      </div>

      {/* 双列 main */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 2fr) minmax(0, 1fr)",
          gap: 18,
        }}
      >
        {/* 左：MyRecord + 简介 + Community */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <Skeleton width="100%" height={110} radius={6} />
          <Skeleton width="100%" height={90} radius={6} />
          <Skeleton width="100%" height={180} radius={6} />
        </div>
        {/* 右：MetaKV */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between" }}>
              <Skeleton width={48} height={12} radius={3} />
              <Skeleton width={90} height={12} radius={3} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
