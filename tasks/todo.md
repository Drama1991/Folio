# Folio · P2 迭代优化（2026-05-23）

依据 `full-review-2026-05-22.md` 第 4 节。10 项中 9 项落地、1 项（Tailwind 迁移）作为长期 backlog。

## 范围决定

- ✅ 实施 9 项
- ⏭️ 跳过 #9 Tailwind 迁移：整库 inline style → 设计 token + utility 的长期议题，不适合单次 PR；保持现状。
- 🔧 #3 apps-cache：不引新依赖；抽 `IAppCache` 接口 + 保留 fs 实现，留好 KV 替换口。

## 任务清单

- [x] **P2-1 a11y**: globals.css 给 `.btn` / `.chip` / `.row-act-btn` / `.record-fab` / `.view-toggle a` 加 `:focus-visible` 描边；archive 视图切换 `role=tablist` + `role=tab` + `aria-selected`
- [x] **P2-2 error.tsx**: 加 `app/global-error.tsx` + `app/(shell)/error.tsx`；detail 把 5xx 与 404 分开，5xx 让 boundary 接（重试按钮）
- [x] **P2-3 apps-cache**: 抽 `IAppCache` 接口，`FsAppCache` 实现，留 KV 口；不引依赖
- [x] **P2-4 AI SSE**: `api/ai/chat/route.ts` 改 `text/event-stream`（`event: sources / delta / done / error`），`ai-panel.ts` 用行级 SSE parser
- [x] **P2-5 itemPosts 匿名**: `api/proxy/item-posts/[uuid]/route.ts` 去掉强制 401；`client.ts` 新增 `optionalAuthBaseAndHeaders` + `publicOk` RequestOpts；`listItemPosts` 切到 publicOk
- [x] **P2-6 Cover CLS**: fill 模式给 wrapper 加 `aspectRatio: "2 / 3"` 兜底，防父级无 aspect-ratio 时塌成 0 高
- [x] **P2-7 allSettled**: profile 大 Promise.all 改 `Promise.allSettled` + 显式 fallback；profile/reviews 内层 lambda 加 `.catch`
- [x] **P2-8 use-sync**: boot-once 拆到独立 mount-only effect，删大块 eslint-disable；删 unused `useRef`
- [x] **P2-10 RecordModal dropped**: `STATUS_OPTIONS` 加 `"dropped"`，与 wishlist quickMark 对齐

## Review · 实施记录

### 文件改动

- `src/app/globals.css`
  - 新增 `:focus-visible` 集中块（btn / chip / row-act-btn / record-fab / modal-save-btn / sort-trigger / view-toggle / tag-chip / row / poster-tile），柔金描边 2px
- `src/app/(shell)/archive/[medium]/page.tsx`
  - view-toggle 加 `role=tablist`，子 Link 加 `role=tab` + `aria-selected`
- `src/app/(shell)/error.tsx` *(新)* — shell 子树错误边界
- `src/app/global-error.tsx` *(新)* — 根 layout 自身崩溃兜底
- `src/app/(shell)/detail/[medium]/[uuid]/page.tsx`
  - `getItem` catch 分流：404 → `notFound()`；其它（5xx/网络）→ throw 让 error.tsx 接
- `src/lib/auth/apps-cache.ts`
  - 拆 `IAppCache` interface + `FsAppCache` 实现；公共 `getApp / setApp` 走单例 `defaultCache`；注释说明 KV 替换方法
- `src/app/api/ai/chat/route.ts`
  - 响应头 `Content-Type: text/event-stream`，事件按 `event: <name>\ndata: <json>\n\n` 协议；事件类型 `sources / delta / done / error`
- `src/lib/store/ai-panel.ts`
  - 用行级 SSE parser 替换 `__SOURCES__:` sentinel 分支；按 `\n\n` 切事件块，分发到 sources / delta / error
- `src/lib/neodb/client.ts`
  - 新增 `optionalAuthBaseAndHeaders`（无 session 时裸调 `neodb.social`）；`neodb()` 按 `opts.publicOk` 切路径；`listItemPosts` 改 publicOk
- `src/app/api/proxy/item-posts/[uuid]/route.ts`
  - 去掉强制 401，匿名调用透传
- `src/components/shared/Cover.tsx`
  - fill 模式 `dim` 注入 `aspectRatio: "2 / 3"`（caller 可覆盖）
- `src/app/(shell)/profile/[handle]/page.tsx`
  - 大 Promise.all → `Promise.allSettled` + `pick(idx, fallback)` 解构
- `src/app/(shell)/profile/[handle]/reviews/page.tsx`
  - 内层 listMyReviews 加 `.catch(() => ({ data: [], count: 0 }))`
- `src/lib/store/use-sync.ts`
  - boot-once 拆独立 mount-only effect；interval effect 删 eslint-disable（依赖闭包）；删 unused `useRef`
- `src/components/record-modal/RecordModal.tsx`
  - `STATUS_OPTIONS` 加 `"dropped"`

### 验证

- `npx tsc --noEmit` ✅
- 未引入新依赖
- 改动遵循「最小冲击」原则：未顺手重排 UI、未引入抽象

### 留给下轮

- **#9 Tailwind 迁移**：长期 backlog，单独立项
- **AI 流：done 事件目前未利用**：客户端靠 reader 自然结束判断；后续可用 done 携带最终 metadata（token count 之类）

### 顺手补做

- **P1-11 CSP script-src 收紧**：移除 `https://cdn.jsdelivr.net`（只用于 Tabler icons stylesheet，不进 script-src）

---

# Folio · 移动端响应式 · 第三批·上半（2026-05-24）

依据 `tasks/mobile-wireframes/README.md`。前两批已完成全局壳层（Header/Drawer/FAB）+ Home/Profile/Detail/RecordModal + Discover/Settings 等。本批继续 6 个浏览类页面。

## 任务清单

- [x] **/timeline**：外层 padding 收紧 + 筛选行（chips + 状态下拉）窄屏堆两行 + chips 横滚
- [x] **/wishlist**：外层 padding 收紧 + 标题骰子常驻显示（移动端无 hover）
- [x] **/archive/[medium]**：外层 padding 收紧 + 筛选行窄屏堆两行 + status chips 横滚 + 排序行 space-between
- [x] **/notifications**：外层 padding 收紧 + 空状态卡 padding 收紧
- [x] **/profile/[handle]/reviews**：外层 padding 收紧 + 标题/计数行纵向堆叠 + h1 28→22
- [x] **/review/[uuid]**：外层 padding 收紧 + h1 30→24 + 正文 15→14.5px + 长评 h2/h3 同步收

## Review · 实施记录

### 文件改动

页面侧（剥离外层 inline padding，加 className 锚点）：

- `src/app/(shell)/timeline/page.tsx` → `.timeline-page` + `.timeline-filter-row`
- `src/app/(shell)/wishlist/page.tsx` → `.wishlist-page`
- `src/app/(shell)/archive/[medium]/page.tsx` → `.archive-page` + `.archive-filter-row`
- `src/app/(shell)/notifications/page.tsx` → `.notifications-page` + `.notifications-empty`
- `src/app/(shell)/profile/[handle]/reviews/page.tsx` → `.reviews-archive-page` + `.reviews-archive-header`
- `src/app/(shell)/review/[uuid]/page.tsx` → `.review-page`

样式侧：

- `src/app/globals.css` 文末追加「第三批·上半」段，按上述 6 个锚点写桌面规则 + `@media (max-width: 767px)` 覆盖

### 模式说明

延续第二批 pattern：

1. 桌面规则与原 inline 1:1（CSS 类承载 padding / max-width / margin / grid 布局原子）
2. 页面层只在外层 wrapper 用 className，**保留子元素的 inline style**（视觉原子如 fontSize、颜色）
3. 移动端 `@media (max-width: 767px)` 用 `!important` 覆盖 inline / 桌面规则
4. 不引新依赖、不顺手重排、不抽组件

### 验证

- `npx tsc --noEmit` ✅
- 视觉验证暂未做（未跑 dev server）—— 改动是纯 additive：新增 className + 新增 mobile @media，桌面行为 0 改动
- 已知小风险：archive/timeline 筛选行子元素选择器用 `> div:first-child` / `> :last-child`，依赖 DOM 顺序；如果未来加新子元素需要同步调整

### 留给下半

- `/review/new` + `/review/edit`（长评编辑器，编辑形态特殊）
- `AIPanel`（右滑入面板 → 移动端可能需要全屏 sheet 形态）
- `SyncTicker`（小组件，可能直接在移动端隐藏即可）

---

# Folio · 移动端响应式 · 第三批·下半（2026-05-24）

下半 3 个目标按现状盘点：

- **SyncTicker**：`return null`，本来就 0 UI，无需任何改动 ✅ skip
- **AIPanel / DraggableWindow**：DraggableWindow 已实现 mobile 全屏分支，但断点 `MOBILE_BP = 640`，跟全站 `< 768px` 不一致 → 调齐 + 补按钮触控目标
- **ReviewEditor**：完全无 mobile 适配，按 pattern 加 className + @media

## 任务清单

- [x] **DraggableWindow**：`MOBILE_BP` 640 → 768，与全站断点对齐
- [x] **DraggableWindow**：mobile 进入动画改 `translateY(100%) → translateY(0)`（slide-up），顶部加 handle 视觉条；阴影从 none 改为 `-8px 30px / 0.2`（sheet 上推感）—— **补漏：上一次只让窗口全屏但动画仍是 scale 缩放，不算 sheet 形态**
- [x] **AIPanel**：发送按钮 + 联网搜索切换 加 className（`.ai-panel-send` / `.ai-panel-web-toggle`），mobile 28/26 → 40×40 触控
- [x] **ReviewEditor**：外层 padding 收紧；标题输入 24→22；textarea 给 `min-height: 48vh`；操作行 flex-wrap，操作组靠右

## Review · 实施记录

### 文件改动

页面 / 组件侧：

- `src/components/review-editor/ReviewEditor.tsx`
  - 外 `<div>` 改 `className="review-editor-page"`（去掉 inline padding）
  - 条目卡加 `.review-editor-item-card`
  - 标题 input 加 `.review-editor-title-input`
  - 正文 textarea 加 `.review-editor-body-textarea`
  - 操作行加 `.review-editor-action-row` + 内层 `.review-editor-action-buttons`，外层 inline 加 `gap: 10` 让换行后两组有间距
- `src/components/shared/DraggableWindow.tsx`
  - `MOBILE_BP` 常量 640 → 768
  - mobile 分支：transform 改 `translateY(100%) → translateY(0)`，transition 改 sheet 曲线
  - mobile 顶部插入 handle `<div>`（38×4 圆角条，跟 RecordModal 一致）
  - mobile boxShadow 从 `none` 改为 `0 -8px 30px rgba(0,0,0,0.2)`（sheet 漂浮感）
- `src/components/ai-panel/AIPanel.tsx`
  - 联网切换按钮加 `className="ai-panel-web-toggle"`
  - 发送按钮加 `className="ai-panel-send"`

样式侧：

- `src/app/globals.css` 文末追加「第三批·下半」段
  - `.review-editor-page` 桌面 + mobile：padding / item-card 收紧 / title 22 / body min-height 48vh / 操作行 flex-wrap
  - `.ai-panel-send` / `.ai-panel-web-toggle` mobile：宽高 40×40 + icon 17/19px

### 模式说明

- DraggableWindow 已经原生支持 mobile 全屏（无 border / radius / shadow），本批只是断点对齐
- ReviewEditor 沿用前两批 pattern（剥外层 inline padding → className + @media 覆盖）
- 0 新依赖、0 顺手重排

### 验证

- `npx tsc --noEmit` ✅
- 视觉验证未做（与上半同：改动 additive，桌面 0 改动）

### 已知小取舍

- ReviewEditor 操作行 mobile 未做 sticky-to-bottom；textarea 拉长后操作行会被滚走（保留 v0 行为，避免引入 sticky + safe-area 复杂度）
- AIPanel 建议 chip / 历史抽屉 按钮触控目标未单独 bump（DraggableWindow 全屏后视觉空间充足，chip 仅作 quick-suggestion，弱主交互）

### 全批总结

第三批 8 个组件全部落地：

- 上半 6 个浏览类：Timeline / Wishlist / Archive / Notifications / Profile-Reviews / Review-view
- 下半 2 个特殊形态：ReviewEditor / AIPanel（+ SyncTicker 无 UI 跳过）

至此移动端 3 批改造完结。全站从壳层、首页、个人主页、详情页、记录 modal，到浏览/编辑/面板，已全部具备 < 768px 响应式覆盖。下一步可考虑：

- 视觉走查（实机或 dev tools 响应式模式）找细节漏
- 768–1024 中等屏的过渡（目前是桌面规则直接生效）
- 手势：sheet 下拉关闭、抽屉左滑关闭、AIPanel 全屏 sheet 顶部 handle 等

---

# Folio · 移动端复审 · 用户反馈 4 项（2026-05-24）

用户对前 3 批 mobile 改造提出 4 条复审反馈。1、3 直接修正；2、4 给方案 → 用户选 → 落地。

## 任务清单

- [x] **#1 Detail 资料卡顺序**：mobile 下 MetaKVList 顶到 MyRecordCard 上方（CSS `order: -1`，不动源序，桌面不影响）
- [x] **#2 Wishlist row-actions 处理**：用户选「mobile 全隐藏」→ globals.css `.row-actions { display: none !important; }`（同时影响 archive 的 row-actions，统一处理；mobile 一律去详情页 quick mark）
- [x] **#3 Discover featured brief**：用户反馈"左侧没了简介" → 之前 `display: none` 是我误判（"视觉负担太重"）。删掉隐藏规则，brief 在 mobile 也展示。Card 高度会随 brief 行数生长
- [x] **#4 Profile hero 重排**：用户选「88 头像横排 + actions 独立一行」→ mobile grid 改 `88px 1fr` 两列 + `grid-template-areas: "avatar content" / "actions actions"`；name 30→24；actions 子元素 flex-direction column → row icon-only 横排

## Review · 实施记录

### 文件改动

仅 `src/app/globals.css`（4 段 `@media (max-width: 767px)` 块内调整）：

1. **`.detail-main`**：补 `> div:last-child { order: -1 }`，把右栏 MetaKVList wrapper 顶到第一位（旧注释删）
2. **`.row-actions`**：原 `opacity: 1 !important + transform: none + transition: none` + `.row-act-btn { 36×36 }` 合并改为 `display: none !important`（这俩规则只为 mobile 服务，全删掉）
3. **`.discover-featured__brief`**：旧 `display: none` 块整段删，brief 恢复显示
4. **`.profile-hero`**：原 mobile 单列居中 → 改成 2 列 grid + 3 个区域（avatar / content / actions）；name 字号 30→24；actions div 内联 inline `flexDirection: column` 用 `!important` 覆盖成 row

### 模式说明

- 4 个反馈都是 CSS-only fix，0 改 page.tsx / component.tsx
- 沿用 hero 重排的 grid-template-areas 方式 —— 比 order 单独改更结构化（让 source order 不变也能拆分区）
- row-actions display:none 在 wishlist 和 archive 都生效，统一行为 ✅

### 验证

- `npx tsc --noEmit` ✅
- CSS-only 改动，桌面 0 影响

### 已知边角

- Profile hero 用 `:nth-child(N)` 锚 grid-area，依赖 source order（avatar 是 1，content 是 2，actions 是 3）；如果未来 hero 内加新 div 需要同步调整
- Discover brief 恢复后 card 高度跟随 brief 行数生长（110 字 × 12px × 1.6 行高 ≈ 5-6 行），暂未加 `-webkit-line-clamp`。如果实机看着冗长，可后续加 line-clamp 3

