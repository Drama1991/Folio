# 品牌改名 Folio → folion

## 策略（已与你确认）
只改**用户可见的品牌触点**（全小写 `folion`），保留所有**内部契约**——零破坏、零迁移：现有用户不掉登录、不丢本地数据，Vercel 配置不用动。

---

## 阶段 A · 不依赖 logo ✅ 已完成

### 文案 / metadata / PWA
- [x] `layout.tsx:20,22,26` — title / applicationName / appleWebApp.title
- [x] `manifest.ts:7,8` — name / short_name
- [x] `detail/[medium]/[uuid]/page.tsx:26,32,33,42` — metadata
- [x] `review/[uuid]/page.tsx:46,77` — metadata + 会话失效文案
- [x] `profile/[handle]/page.tsx:37,38` — metadata
- [x] `LoginCard.tsx:40,121,122` — alt + 授权步骤文案
- [x] `Header.tsx:33,36` — aria-label + alt
- [x] `SettingsContent.tsx:267,866,877,900,1001,1073,1096` — 文案 + 导出文件名
- [x] `global-error.tsx:40` — 崩溃文案
- [x] `oauth-errors.ts:21` — register_failed 文案
- [x] `prompts.ts:7` — `FOLIO_INTRO` 字符串内两处（常量名保留）
- [x] `notifications/mock.ts:39` — 系统账号 handle/display

### OAuth（NeoDB 授权页用户可见）
- [x] `oauth.ts:5` — `CLIENT_NAME` → "folion"
- [x] `oauth.ts:6` — `WEBSITE` → https://github.com/Drama1991/Folio

### 导出格式（已确认无 import 端消费）
- [x] `export/route.ts:103,106` — `$schema` 域名 + `exportedBy`

### 文档 / 注释
- [x] `README.md:1,5`
- [x] `CLAUDE.md:18,21`
- [x] `mastodon-types.ts:6` / `local-cache.ts:3,55` / `sw.ts:4` / `globals.css:374`（品牌词，key 前缀保留）

### 顺手清理
- [x] `.gitignore` — **保留** `.folio-apps.json` 忽略规则（曾误删，已恢复+加注释）；该文件实存于磁盘且含 `client_secret`，但**从未提交**过 git，无需轮换

---

## 阶段 B · 新 logo 集成 ✅ 已完成
- [x] wordmark：`public/folion-logo.png`（透明 1024w）替换旧图，`LoginCard.tsx:39` / `Header.tsx:35` 指向新文件；旧 `public/folio-logo.png` 已删
- [x] 删除 `icon.tsx` / `apple-icon.tsx` 字母占位 —— 同时解决 `icon.png` ↔ `icon.tsx` 同目录 `/icon` 路由二选一冲突
- [x] `icon.png`(512) / `apple-icon.png`(180) — app-icon 合成**米白 #F5F2EA 底**（透明图在 iOS 主屏会渲成黑底）
- [x] `public/folion-app-icon-{192,512}.png` — PWA 图标（米白底合成），`manifest.ts` icons 指向之
- [x] `favicon.ico` — 换用 `logo/favicon/favicon.ico`（保持透明，浏览器标签页 OK）
- [x] 暗色 wordmark：**保持现有 CSS 滤镜**（已看实际效果确认 —— navy「N」暗色下偏天蓝，可接受）

---

## 本次明确不改（内部契约 · 保留 folio）
- **cookie**：`folio_session` / `folio_ai` / `folio_pkce` / `folio_state` / `folio_pending_*`
- **storage 前缀**：`folio:` 与 `folio.` 全部
- **env**：`FOLIO_JWT_SECRET` / `FOLIO_PUBLIC_URL`
- **内部标识符**：`FolioSession` / `FOLIO_INTRO` / `clearFolioLocal` / `__folioOpenRecord` / `package.json` name

---

## Review（阶段 A）

**改动范围**：21 个文件，约 45 处可见品牌串 `Folio`/`folio` → `folion`（全小写）。

**验证**：
- ✅ `npm run type-check` — 零错误
- ✅ `npm run build` — 全部路由编译通过（含 manifest / 各页 metadata / export route）
- ✅ `grep -i folio` 复查 — 残留命中**逐条核对全部落在"保留白名单"内**，无遗漏、无误伤内部契约

**未做**：未 commit（等阶段 B logo 一起，或按你指示）。建议 commit message：
`refactor(brand): Folio → folion 全小写品牌文案 + OAuth client name + 导出格式（内部契约保留）`

---

## Review（阶段 B · logo 集成）

**改动**：wordmark 换新图 + app/apple/PWA 图标合成米白底 + favicon 换用户图 + 删除字母占位 `.tsx`。

**关键决策**：
- 图标米白 `#F5F2EA` 底（透明 → iOS 主屏黑底）
- 暗色 wordmark 沿用现有 `invert(0.92) hue-rotate(180deg)` 滤镜（你已看渲染图确认，navy「N」偏天蓝可接受）

**验证**：
- ✅ `npm run build` — `/icon.png`·`/apple-icon.png`·`/manifest.webmanifest` 均静态路由；删 `.tsx` 后无路由冲突、无残留引用
- ✅ 视觉确认 icon.png/apple-icon.png 合成正确（米白底 + 黑 serif「f」+ 金丝带，居中未裁切）

**安全订正**：阶段 A 误删的 `.folio-apps.json` 忽略规则已恢复 —— 该文件含 `client_secret`、实存磁盘、但从未进 git 历史，secret 安全。

**未做**：未 commit（等你指示）。`logo/` 源文件夹目前未跟踪，commit 时你决定是否纳入版本。
建议 message：`refactor(brand): Folio → folion 全小写品牌 + 新 logo 集成（内部契约保留）`

---

## 阶段 C · Android PWA splash「白底米黄方块」修复

**现象**：安卓 11 装 PWA，启动页 = 白底 + 一个米黄方块。

**两步定位（第一步打偏，记录留痕）**：
1. ❌ commit `4f4e0b5`：先猜是非 maskable 图标被垫白底，补了 `maskable` 变体。但这修的是**桌面 launcher 图标的裁切**，**没碰启动页背景** —— 用户实测无变化。
2. ✅ 实测定位（dump 线上 + 逐像素采样）：
   - 线上 manifest / 6 个图标全部正确，图标四角是精确 `#F5F2EA` 不透明 —— **方块就是图标本体，颜色没错**。
   - 白色是**启动页背景**，由 Chrome 绘制。`background_color` 只在"部分环境"用于 splash（[MDN](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Manifest/Reference/background_color)），安卓 11 Chrome 不在其中 —— manifest 写米白也压不住白底。

**真正修法（白底统一）**：splash 背景动不了，就动图标底色去贴合它。`f` 字标是深色须配浅底，故全部图标米白底 → **纯白底**（从 `3007f3d` 取回透明源重新合成，字标几何不变），`manifest.ts` `background_color` → `#FFFFFF`（`theme_color` 保持米白，跟运行时顶栏一致）。白图标落到白 splash 上 → 方块消失，只剩「深色 f + 金丝带 + folion」。

**验证**：`type-check` 零错；`build` 通过；构建产物确认 `background_color:"#FFFFFF"` + `2×any + 2×maskable`；逐像素确认 6 个图标四角已是 `#FFFFFF`；512 视觉确认字标融入白底无米白残晕。

**⚠️ 用户侧必办**：WebAPK 安装时把图标/manifest 烤进系统——必须**完全卸载再重装** PWA 才能刷新，光重启/重开无效。
