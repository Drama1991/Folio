"use client";

/** 扫描 localStorage 里 Folio 写入的所有 key，按用途分组返回。
 *  写入约定：`folio:ep:<uuid>` 集数、`folio:read:<uuid>` 阅读进度、`folio:appearance` 外观。
 *  其它 key（zustand persist 等）只统计大小，不解析。 */
export interface LocalCacheInventory {
  episodes: Record<string, unknown>;
  reading: Record<string, unknown>;
  appearance: unknown;
  other: { key: string; bytes: number }[];
  totalBytes: number;
}

function byteSize(s: string): number {
  // 字符串近似 UTF-16 占用，再 ×2 估算 UTF-8（中文 3 字节，英文 1 字节，折中取 2）
  return s.length * 2;
}

export function scanLocalCache(): LocalCacheInventory {
  const inv: LocalCacheInventory = {
    episodes: {},
    reading: {},
    appearance: null,
    other: [],
    totalBytes: 0,
  };
  if (typeof window === "undefined") return inv;

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key) continue;
    const raw = localStorage.getItem(key) ?? "";
    inv.totalBytes += byteSize(raw) + byteSize(key);

    if (key.startsWith("folio:ep:")) {
      const uuid = key.slice("folio:ep:".length);
      try { inv.episodes[uuid] = JSON.parse(raw); } catch { /* skip malformed */ }
      continue;
    }
    if (key.startsWith("folio:read:")) {
      const uuid = key.slice("folio:read:".length);
      try { inv.reading[uuid] = JSON.parse(raw); } catch { /* skip */ }
      continue;
    }
    if (key === "folio:appearance") {
      try { inv.appearance = JSON.parse(raw); } catch { /* skip */ }
      continue;
    }
    // 其它（含 folio.ai.sessions.v1 等）只记账，不进 archive
    inv.other.push({ key, bytes: byteSize(raw) + byteSize(key) });
  }
  return inv;
}

/** 清掉 Folio 写入的所有 localStorage（folio: 前缀 + folio. 前缀）。 */
export function clearFolioLocal(): number {
  if (typeof window === "undefined") return 0;
  const toDelete: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key) continue;
    if (key.startsWith("folio:") || key.startsWith("folio.")) toDelete.push(key);
  }
  toDelete.forEach((k) => localStorage.removeItem(k));
  return toDelete.length;
}

export function formatBytes(b: number): string {
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / 1024 / 1024).toFixed(2)} MB`;
}

/** 触发浏览器下载 JSON。 */
export function downloadJson(filename: string, payload: unknown): void {
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: "application/json;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
