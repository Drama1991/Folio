/**
 * App OAuth 凭据缓存。
 *
 * Vercel / 多节点部署：lambda 文件系统只读 + 节点不共享，所以**不能持久化**。
 * 当前实现是纯进程内 Map（InMemoryAppCache）—— warm lambda 复用注册结果；
 * cold start / 不同实例之间会重新 register 一次新 app（NeoDB 不限量）。
 *
 * client_id 和 client_secret 在 OAuth `start` 阶段写入 httpOnly transient cookie，
 * callback 阶段从 cookie 读出来——这一对实际上不依赖此 cache，cache 只做同进程的
 * register 去重 + warm-up 优化。如果未来上 KV，按 IAppCache 接口换 defaultCache 即可。
 *
 * 同一进程内 registerApp 的并发去重在 lib/neodb/oauth.ts 中（inflightRegister Map）。
 */

export interface AppRecord {
  client_id: string;
  client_secret: string;
  id?: string;
}

export interface IAppCache {
  get(instance: string): Promise<AppRecord | undefined>;
  set(instance: string, app: AppRecord): Promise<void>;
}

// ───── 实现：进程内 Map（Vercel-safe，但 cold start 后丢失） ─────────────

class InMemoryAppCache implements IAppCache {
  private readonly mem = new Map<string, AppRecord>();

  async get(instance: string): Promise<AppRecord | undefined> {
    return this.mem.get(instance);
  }

  async set(instance: string, app: AppRecord): Promise<void> {
    this.mem.set(instance, app);
  }
}

// ───── 当前默认实现 ──────────────────────────────────────────────────────
// 多实例部署想要持久化：把这一行换成你的 KV 实现，例如：
//   const defaultCache: IAppCache = new VercelKvAppCache(process.env.KV_URL!);

const defaultCache: IAppCache = new InMemoryAppCache();

// ───── 公共 API（业务层只用这两个函数） ─────────────────────────────────

export async function getApp(instance: string): Promise<AppRecord | undefined> {
  return defaultCache.get(instance);
}

export async function setApp(instance: string, app: AppRecord): Promise<void> {
  return defaultCache.set(instance, app);
}
