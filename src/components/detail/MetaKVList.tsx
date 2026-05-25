export function MetaKVList({ items }: { items: [string, string][] }) {
  if (!items.length) return null;
  return (
    <div className="card" style={{ padding: "12px 16px" }}>
      <p className="section-label" style={{ marginBottom: 8 }}>资料</p>
      {items.map(([k, v]) => (
        <div className="meta-kv" key={k}>
          <span style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--text3)", minWidth: 56 }}>{k}</span>
          <span style={{ fontSize: 12, color: "var(--text)", flex: 1, wordBreak: "break-word" }}>{v}</span>
        </div>
      ))}
    </div>
  );
}
