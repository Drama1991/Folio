# Folio · Phase 0 · 技术底座 + NeoDB 接通

## Context

原型阶段（`folio_full_prototype.html` + 7 个独立 HTML）已完整覆盖目标产品的视觉与交互流。下一步从静态 HTML/JS SPA 跨入真实技术栈，目标是把原型的全部功能接通 NeoDB 真实 API，本机跑通 OAuth 全流程 + 全部 5 个媒介的读写。这是 Phase 0：建底座 + 走通数据。

关键约束：
- 项目位置：`./app/`（原型 HTML 保留在根目录作视觉参考）
- 目标范围："完整原型功能全部接通"
- 实例策略：login 页让用户填实例 URL（不固定 neodb.social）
- AI：先 mock 回复，不接 LLM
- 起始日期：2026-05-19

---

## 锚事实（已通过 WebFetch 验证）

### Next.js / 工具链（May 2026）
- Next.js **16.2.6** stable，App Router 是 `create-next-app` 默认且推荐
- 包管理器 **pnpm**（官方示例首项）
- TypeScript strict 默认
- OAuth 库：Auth.js v5 是官方推荐，**但** MastodonProvider 要求单一 `AUTH_MASTODON_ISSUER`，不支持 per-user 实例 → 本项目 **hand-rolled OAuth**
- Session：`httpOnly + Secure + SameSite=Lax` cookie，JWT 用 `jose` HS256 签
- 认证 fetch 不走 Cache Components（`cacheComponents: false` 或 dynamic route）

### NeoDB API（neodb.social, v0.14.3.1）
- OAuth Mastodon 兼容：`POST /api/v1/apps` → `GET /oauth/authorize` → `POST /oauth/token`（form-urlencoded）
- Scopes：`read write`
- `MarkInSchema.rating_grade` 是 **integer 1-10**（UI 5 星 ×2 映射）
- `MarkInSchema.visibility`：integer，0=public / 1=followers / 2=mentioned
- `ShelfType` 枚举：`wishlist | progress | complete | dropped`
- `ItemCategory` 枚举（NeoDB 命名）：`book | movie | tv | music | game | podcast | performance | people | collection`
- **UI 命名 ↔ NeoDB 命名**：series ↔ tv，music ↔ music（同），其余直通
- **NeoDB 不暴露 `/api/v1/notifications`** → 通知页用 mock + TODO
- 关键端点：`GET /api/me/shelf/{type}?category=&page=`、`POST /api/me/shelf/item/{uuid}`、`GET /api/{book|movie|tv|album|podcast}/{uuid}`、`GET /api/catalog/search`、`POST /api/me/review/item/{uuid}`、`GET /api/trending/{type}/`

### 强制结论
- `client_secret` 永远不能进浏览器 → **BFF 必备**
- 每个用户的实例需独立 `apps` 注册 → server 端 per-instance app 缓存

---

## 架构

### 项目布局

```
./
├── folio_full_prototype.html   # 原型保留，视觉参考
├── login.html / profile.html / ...
└── app/                        # ← 新 Next.js 16 项目
    ├── package.json
    ├── next.config.ts          # cacheComponents: false; image remotePatterns
    ├── tailwind.config.ts      # folio tokens（颜色、字体、圆角、.c1-.c8 渐变）
    ├── tsconfig.json           # strict + paths {"@/*": ["./src/*"]}
    ├── middleware.ts           # auth gate, 保护 (shell) 路由
    ├── .env.local              # FOLIO_JWT_SECRET / FOLIO_PUBLIC_URL
    └── src/
        ├── app/
        │   ├── layout.tsx                          # 根 layout, 字体
        │   ├── globals.css                         # 渐变 .c1-.c8 + 动画 + .sk
        │   ├── page.tsx                            # → /home
        │   ├── (shell)/                            # 900px sticky-header 容器
        │   │   ├── layout.tsx                      # 挂载 RecordModal / AIPanel / Toast
        │   │   ├── home/page.tsx
        │   │   ├── archive/[medium]/page.tsx       # medium ∈ movie|series|book|music|podcast
        │   │   ├── detail/[medium]/[uuid]/page.tsx
        │   │   ├── timeline/page.tsx
        │   │   ├── notifications/page.tsx          # mock + TODO
        │   │   ├── wishlist/page.tsx
        │   │   ├── discover/page.tsx
        │   │   ├── search/page.tsx
        │   │   ├── profile/[handle]/page.tsx
        │   │   ├── settings/page.tsx
        │   │   └── review/new/[medium]/[uuid]/page.tsx
        │   ├── (auth)/
        │   │   ├── layout.tsx                      # 居中无 header
        │   │   └── login/page.tsx
        │   └── api/
        │       ├── auth/{start,callback,logout}/route.ts
        │       └── proxy/                          # BFF：浏览器 → 服务端 → NeoDB
        │           ├── search/route.ts
        │           ├── shelf/[type]/route.ts
        │           ├── mark/[uuid]/route.ts        # POST/DELETE
        │           └── review/[uuid]/route.ts
        ├── components/
        │   ├── shell/         (Header, AvatarMenu, BellButton)
        │   ├── home/          (Hero, ActionBar, BentoTop, ActivityStrip, CategoryCells)
        │   ├── archive/       (ArchiveHeader, ArchiveTabs, ArchiveRow)
        │   ├── detail/        (DetailHero, MyRecordCard, HeroStars, EditStars,
        │   │                   StatusChips, MetaKVList, EpisodeTracker, ReadingProgress)
        │   ├── timeline/, notifications/, wishlist/, discover/,
        │   │   search/, profile/, settings/, login/, review-editor/
        │   ├── record-modal/  (RecordModal, RecordSearchStep, RecordFormStep, ...)
        │   ├── ai-panel/      (AIPanel, AIHistory, SuggestChips)
        │   └── shared/        (Cover, Stars, MediumBadge, Skeleton, Toast, Crumb)
        ├── lib/
        │   ├── auth/          (session.ts, cookie.ts, apps-cache.ts)
        │   ├── neodb/         (client.ts, oauth.ts, endpoints.ts, types.ts,
        │   │                   ui-types.ts, mediumMap.ts, mappers.ts)
        │   ├── ai/            (replies.ts, suggs.ts, history.ts —— 全 mock)
        │   ├── store/         (record-modal.ts, ai-panel.ts, local-progress.ts —— Zustand)
        │   ├── format/        (verbs.ts, dates.ts, cover-gradient.ts)
        │   └── notifications/ (mock.ts)
        └── types/             (env.d.ts, global.d.ts)
```

### 关键设计决策

| 决策 | 方案 | 理由 |
|---|---|---|
| OAuth 库 | **hand-rolled**（不上 Auth.js） | Auth.js MastodonProvider 不支持 per-user 实例；自己写 ~120 行更直接 |
| Session 存储 | httpOnly cookie + jose-signed JWT | 官方推荐；无需 DB；payload = `{instance, token, handle, sub, exp}` |
| Per-instance apps 缓存 | 内存 `Map` + `.folio-apps.json` 落盘（dev）；prod 可换 Redis/KV | 每实例 `client_secret` 不同，必须 server 持久化 |
| 数据流 | **混合**：初次渲染走 RSC（无额外请求）；变更/实时搜索走 `/api/proxy/*` | token 永不进浏览器；首屏无额外 hop |
| UI ↔ NeoDB 命名映射 | 单一 `lib/neodb/mediumMap.ts` 翻译 | 组件只见 UI 命名（`series`/`music`），不见 NeoDB 命名（`tv`/`album`） |
| 评分映射 | UI 0-5 星 ↔ NeoDB `rating_grade` 0-10，×2 转换 | 半星精度延后 |
| 客户端状态 | Zustand（modal / AI panel / 本地进度） | 跨树访问比 Context 简单；选择器友好；无 SSR hydration 风险（modal 初始关闭） |
| 筛选状态 | URL search params（archive / notifications 等） | 可分享、survives 后退、无 JS 也工作；server 端读 |
| 集数/阅读进度 | **localStorage 本地**（NeoDB 无该字段） | 不污染 NeoDB；设置页提供导出 JSON |
| 通知 | **mock + TODO**（NeoDB 无 `/api/v1/notifications`） | 抽离数据源接口，未来无缝替换；可用 `/api/v1/timelines/link` 做"社区动态"独立子区 |
| 封面 | `<Cover>` 组件：真实 `cover_image_url` 优先，缺失则按 uuid hash 落到 .c1-.c8 渐变 | 视觉一致，无空白 |
| AI | `lib/ai/replies.ts` + `suggs.ts` 直接搬原型对象，typing delay 1.1s | 等 NeoDB 稳了再接 LLM |

---

## 实施阶段（约 10 天）

每阶段以"可端到端验证的事"收尾。

### Phase 0.1 — Skeleton 启动（半天）
- `pnpm create next-app@latest app --typescript --tailwind --app --use-pnpm`
- 加 `next.config.ts` (`cacheComponents:false`)、`tailwind.config.ts`（folio tokens + .c1-.c8 渐变）、`globals.css`（动画 + `.sk` shimmer）
- `next/font/google` 引入 Noto Serif SC + JetBrains Mono
- `(shell)/layout.tsx` 占位 900px 边框
- `(shell)/home/page.tsx` 只显示"夜安。"
- **验证**：`pnpm dev` 启动，`localhost:3000` 显示米白底 + serif "夜安。" + 900px 圆角壳

### Phase 0.2 — 设计系统组件（半天）
- `components/shared/{Cover,Stars,MediumBadge,Skeleton,Toast,Crumb}.tsx`
- `lib/format/{verbs,dates,cover-gradient}.ts`
- **验证**：scratch page 渲一组：3/5 星、8 个渐变方块、5 种 medium badge

### Phase 1 — Auth pipeline（1 天）
- `lib/auth/{session,cookie,apps-cache}.ts`
- `lib/neodb/oauth.ts`（`registerApp`、`exchangeCode`）
- `app/api/auth/{start,callback,logout}/route.ts`
- `(auth)/login/page.tsx` + `components/login/{LoginCard,InstanceInput,StepIndicator}.tsx`
- `middleware.ts` 保护 `(shell)`
- **验证**：
  1. `localhost:3000` → 重定向到 `/login`
  2. 输 `neodb.social` → 跳 NeoDB 同意页 → 回到 `/home` 显示真实 handle
  3. 刷新 `/home` 不掉登录
  4. 头像菜单登出 → cookie 清掉 → 回 `/login`

### Phase 2 — NeoDB client + Home + Archive（1.5 天）
- `lib/neodb/{client,endpoints,types,ui-types,mediumMap,mappers}.ts`
- `(shell)/home/page.tsx`（4 个 shelf counts + 最近 5 条 mark）
- `components/home/*`
- `(shell)/archive/[medium]/page.tsx` + `components/archive/*`
- **验证**：
  1. `/home` 真实 handle + shelf counts + 真实最近活动
  2. `/archive/movie` 列出所有电影 mark，封面真实有/兜底
  3. 切媒介 chip → URL → `/archive/book`，列表跟着切

### Phase 3 — Detail page（1 天）
- `(shell)/detail/[medium]/[uuid]/page.tsx`
- `components/detail/{DetailBreadcrumb,DetailHero,HeroStars,MyRecordCard,StatusChips,EditStars,MetaKVList}.tsx`
- Episode/Reading widgets 留 Phase 5
- **验证**：archive 行点击 → detail 页真实渲染（hero rating / status / metaKV）

### Phase 4 — Record modal（1 天）
- `lib/store/record-modal.ts`（Zustand）
- `components/record-modal/*`
- `app/api/proxy/search/route.ts`、`app/api/proxy/mark/[uuid]/route.ts`
- **验证（round-trip）**：
  1. 首页"记录新内容" → 搜"肖申克" → 真实结果 → 选中 → 设看过 + 4 星 + 备注 → 保存
  2. **开 NeoDB 用户页面验证 mark 已写入（rating_grade=8）**
  3. detail 页"编辑记录" → 预填正确 → 改 5 星 → 更新 → detail 刷新

### Phase 5 — Episode tracker + Reading progress（半天，localStorage）
- `lib/store/local-progress.ts`
- `components/detail/{EpisodeTracker,ReadingProgress}.tsx`
- **验证**：
  1. 剧集 detail 标第 N 集已看 → 网格填充 → 刷新依旧
  2. 书籍 detail 更新进度 → 圆环刷新 → 刷新依旧
  3. 设置 → 数据 卡片注明"集数/页数仅本机"

### Phase 6 — Timeline + Wishlist + Discover（1 天）
- `(shell)/{timeline,wishlist,discover}/page.tsx`
- `components/{timeline,wishlist,discover}/*`
- **验证**：
  1. `/timeline` 按月分组，`?filter=电影` URL 切换
  2. `/wishlist` 真实想看；随机抽签按钮工作
  3. `/discover` editorial + `/api/v1/timelines/link` 社区动态 + `/api/trending/*`

### Phase 7 — AI panel（半天，mock）
- `lib/ai/{replies,suggs,history}.ts`（直接搬原型对象）
- `lib/store/ai-panel.ts`
- `components/ai-panel/*`
- **验证**：home / detail/book 各开一次，suggestion chips 按 medium 切换，typing 动画 + mock 回复，历史抽屉切换正常

### Phase 8 — Search + Profile + Settings（1 天）
- `(shell)/{search,profile/[handle],settings}/page.tsx` + 对应 `components/*`
- **验证**：
  1. `/search?q=村上春树` 按类别分组结果，每条标我当前状态
  2. `/profile/me` 真实 stats + 最近 review preview
  3. `/settings` 实例信息 + 立即同步（`router.refresh`）+ 登出

### Phase 9 — Notifications + Review editor + 打磨（1 天）
- `(shell)/notifications/page.tsx`（mock + TODO 横幅）
- `(shell)/review/new/[medium]/[uuid]/page.tsx` + `components/review-editor/*`
- `app/api/proxy/review/[uuid]/route.ts`
- **验证**：
  1. detail → 写长评 → 编辑器预填 → 发布
  2. **NeoDB profile 页确认长评出现**
  3. 5 个媒介 archive → detail → 编辑 → save 全部跑通

---

## 关键文件创建顺序

按依赖关系，前 29 个关键文件按以下顺序创建（后续 ~30 个 component 是机械搬运）：

1. `app/package.json`
2. `app/next.config.ts`
3. `app/tailwind.config.ts`
4. `app/src/app/globals.css`
5. `app/src/app/layout.tsx`
6. `app/middleware.ts`
7. `app/src/lib/auth/session.ts`
8. `app/src/lib/auth/apps-cache.ts`
9. `app/src/lib/neodb/oauth.ts`
10. `app/src/app/api/auth/start/route.ts`
11. `app/src/app/api/auth/callback/route.ts`
12. `app/src/app/api/auth/logout/route.ts`
13. `app/src/app/(auth)/login/page.tsx` + `components/login/LoginCard.tsx`
14. `app/src/lib/neodb/types.ts`
15. `app/src/lib/neodb/ui-types.ts`
16. `app/src/lib/neodb/mediumMap.ts`
17. `app/src/lib/neodb/mappers.ts`
18. `app/src/lib/neodb/client.ts`
19. `app/src/app/(shell)/layout.tsx`
20. `app/src/components/shell/Header.tsx`
21. `app/src/components/shared/Cover.tsx`
22. `app/src/app/(shell)/home/page.tsx`
23. `app/src/components/home/*`
24. `app/src/app/(shell)/archive/[medium]/page.tsx`
25. `app/src/app/(shell)/detail/[medium]/[uuid]/page.tsx`
26. `app/src/lib/store/record-modal.ts`
27. `app/src/components/record-modal/RecordModal.tsx`
28. `app/src/app/api/proxy/search/route.ts`
29. `app/src/app/api/proxy/mark/[uuid]/route.ts`

---

## 原型 → 新代码映射（便于翻译时对照）

| 原型符号 | 新代码位置 |
|---|---|
| `detailData` | `lib/neodb/mappers.ts::itemToDetailVM`（实时） |
| `archiveData` | `lib/neodb/mappers.ts::markToArchiveRow` + `shelfCountsFromShelves`（实时） |
| `timelineData` | `lib/neodb/mappers.ts::markToTimelineEntry`（实时） |
| `notificationsData` | `lib/notifications/mock.ts`（mock） |
| `aiReplies` / `suggs` / `aiHistory` | `lib/ai/{replies,suggs,history}.ts`（mock） |
| `rMockResults` | 实时 `/api/proxy/search` |
| `rTypeColors` / `rStarLabels` | `components/shared/MediumBadge.tsx` 常量 |
| `buildDetailHTML` / `buildDetailLeft` | `<DetailHero>` + `<MyRecordCard>` + `<MetaKVList>` |
| `buildHeroStars` / `buildEditStars` | `<HeroStars>` / `<EditStars>` |
| `buildStatusChips` | `<StatusChips>` |
| `buildEpisodeTracker` / `buildReadingProgress` | `<EpisodeTracker>` / `<ReadingProgress>`（localStorage） |
| `buildArchiveHTML` / `buildArchiveRow` | `<ArchiveHeader>` + `<ArchiveRow>` |
| `buildTimelineHTML` / `buildTimelineRow` / `formatMonthLabel` | `<TimelineGroup>` + `<TimelineRow>` |
| `buildNotificationsHTML` / `buildNotifRow` | `<NotificationRow>` |
| `openRecord` / `openEditRecord` / `rSaveRecord` 等 | `lib/store/record-modal.ts` actions |
| `openAI` / `closeAI` / `sendMsg` / `pickReply` 等 | `lib/store/ai-panel.ts` actions |
| `archiveVerb` | `lib/format/verbs.ts::statusVerb(medium, status)` |
| `bootFromHash` | App Router 文件路由 |

---

## 端到端验证（合并测试，在干净浏览器 profile 跑一遍）

| # | 动作 | 预期 | NeoDB 反向核对 |
|---|---|---|---|
| 1 | `pnpm dev` → `localhost:3000` | 重定向 `/login`，"夜安。" + 实例输入框 | — |
| 2 | 输 `neodb.social` → 授权 | 跳 NeoDB 同意页 | — |
| 3 | 同意 | 回 `/home`，问候语含真实 handle | — |
| 4 | `/home` 首屏 | 4 个 stat 真实计数 + 最近活动条按媒介动词正确 + 5 格分类真实计数 | NeoDB profile 计数一致 |
| 5 | 点电影格 → `/archive/movie` | 列出所有电影 mark，封面真实/兜底 | 数量一致 |
| 6 | 点剧集 chip | URL → `/archive/series`，列表切 TV | — |
| 7 | 点一行 → `/detail/movie/{uuid}` | hero + my-record + metaKV 全真实 | — |
| 8 | "编辑记录" → modal | 预填正确 | — |
| 9 | 改 4→5 星 → 保存 | toast + detail 刷新到 5 星 | NeoDB rating_grade=10 |
| 10 | 首页 action bar 打开 modal → 搜"村上春树" | 真实结果，选《挪威的森林》→ 表单 | — |
| 11 | 设在读 → 保存 | toast + 首页活动条新增 | NeoDB shelf_type=progress |
| 12 | 书籍 detail → 写长评 → 100 字 → 发布 | toast + 跳回 detail | **NeoDB profile 出现长评** |

**5 媒介覆盖**：每个媒介各跑一次 archive→detail→edit→save，验证动词映射（看过/读过/听过；在看/在追/在读/在听；想看/想读/想听）与 NeoDB 写入。

**最终冒烟**：登出 → cookie `folio_session` 已清 → 直访 `/home` → 重定向 `/login`。

---

## 范围外（Phase 1+ 再做）

- AI LLM 真实接入
- 多实例同时登录
- SWR / React Query 客户端缓存层
- 半星精度
- 移动端原生壳
- 服务端通知（等 NeoDB 暴露 `/api/v1/notifications` 后再做）

---

## 关键依赖文件（实施时必读）

- `./folio_full_prototype.html` — 原型源代码（视觉 + 数据形状）
- `./app/src/lib/neodb/client.ts` — 所有 NeoDB 调用唯一入口
- `./app/src/lib/neodb/mappers.ts` — 命名/形状翻译中心
- `./app/src/app/api/auth/callback/route.ts` — OAuth 核心
- `./app/src/lib/store/record-modal.ts` — 写入流程中心
- `./app/src/app/(shell)/detail/[medium]/[uuid]/page.tsx` — 最复杂的页面

引用源：
- [NeoDB OpenAPI](https://neodb.social/api/openapi.json)
- [NeoDB 开发文档](https://neodb.net/api/)
- [Next.js 16 auth guide](https://nextjs.org/docs/app/guides/authentication)
- [Auth.js Mastodon provider](https://authjs.dev/getting-started/providers/mastodon)（确认单实例约束，论证 hand-rolled）
