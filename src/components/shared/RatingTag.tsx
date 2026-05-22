/**
 * 评分标签：优先显示用户自己评分（金色），缺省 fallback NeoDB 社区评分（灰色），两者都无显示 "—"。
 * 用 nullish 判断：依赖上游 ratingToUi 在无评分时返回 undefined。
 */
export function RatingTag({
  own,
  external,
  size = 11,
}: {
  own?: number;
  external?: number;
  size?: number;
}) {
  const value = own ?? external;
  if (value == null) {
    return (
      <span style={{ fontFamily: "var(--mono)", fontSize: size, color: "var(--text3)" }}>—</span>
    );
  }
  const isMine = own != null;
  return (
    <span
      title={isMine ? "我的评分" : "NeoDB 评分"}
      style={{
        fontFamily: "var(--mono)",
        fontSize: size,
        color: isMine ? "var(--gold)" : "var(--text3)",
      }}
    >
      ★ {value.toFixed(1)}
    </span>
  );
}
