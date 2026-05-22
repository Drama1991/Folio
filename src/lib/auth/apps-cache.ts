import { promises as fs } from "fs";
import path from "path";

export interface AppRecord {
  client_id: string;
  client_secret: string;
  id?: string;
}

const CACHE_FILE = path.join(process.cwd(), ".folio-apps.json");
const memCache = new Map<string, AppRecord>();
let loaded = false;

async function load(): Promise<void> {
  if (loaded) return;
  loaded = true;
  try {
    const raw = await fs.readFile(CACHE_FILE, "utf-8");
    const obj = JSON.parse(raw) as Record<string, AppRecord>;
    for (const [k, v] of Object.entries(obj)) memCache.set(k, v);
  } catch {
    // file missing is fine
  }
}

async function persist(): Promise<void> {
  const obj: Record<string, AppRecord> = {};
  for (const [k, v] of memCache.entries()) obj[k] = v;
  try {
    await fs.writeFile(CACHE_FILE, JSON.stringify(obj, null, 2), "utf-8");
  } catch (err) {
    console.warn("[apps-cache] failed to persist:", err);
  }
}

export async function getApp(instance: string): Promise<AppRecord | undefined> {
  await load();
  return memCache.get(instance);
}

export async function setApp(instance: string, app: AppRecord): Promise<void> {
  await load();
  memCache.set(instance, app);
  await persist();
}
