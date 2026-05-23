# Folio 移动端 Wireframe v0

低保真线框稿，用于在动代码前对齐导航形态和关键交互。视觉细节（描边粗细、阴影、字号）不在 v0 范围。

## 全局决策

| 维度 | 决定 | 备注 |
|---|---|---|
| 启用断点 | `< 768px` | `768–1024px` 走桌面布局收缩，不在 v0 范围 |
| 主导航 | 顶部 ☰ 汉堡 + 右下 FAB | 与桌面端结构一致，改动量最小 |
| 视觉语言 | 完全沿用桌面端 | 米白、纸感、暖色、柔影、衬线标题 |
| Header 高 | 56px（含 1px 分隔） | iOS 标准；去掉桌面端的 SyncTicker |
| FAB | 52px ⌀，距右 16px，距底 88px | 避开 iOS home indicator + 落入拇指右下圈 |
| 触控目标下限 | 44×44px | 现有 28×28 全部要补 padding |
| 安全区 | `env(safe-area-inset-bottom)` | iPhone 刘海/底栏适配 |

## 关键 tradeoff 与应对

> **B 方案的两个劣势如何缓解**

1. **☰ 抽屉是次级入口**
   - 缓解：Home 是默认落地，覆盖 80% 浏览场景；时间线、最近活动、Now Reading 都集中在 Home，减少进抽屉的频率
   - 抽屉做成左侧 80vw 滑出，蒙层 60% 黑，单手拇指能直接拨开

2. **FAB 右下不在拇指最易达区**
   - 缓解 1：FAB 升高到距底 88px（不是常见的 24px），右下偏中，左手党也够得着
   - 缓解 2：RecordModal 改为底部 sheet，触发后所有操作集中在屏幕下半区，单手完成
   - 缓解 3：Detail 页面里 [Mark] 是独立 CTA（不依赖 FAB），从详情进入 Mark 也很顺

## 4 屏导览

1. [01-home.md](01-home.md) — 落地页（Now Reading + 时间线 + 抽屉）
2. [02-profile.md](02-profile.md) — 个人主页（stats 2×2 + heatmap 横滑 + 最近条目）
3. [03-detail.md](03-detail.md) — 条目详情（封面居中 + Mark CTA + 长评 + 其他用户）
4. [04-record-modal-sheet.md](04-record-modal-sheet.md) — Mark 表单（底部 sheet + segment + 钉底保存）

## 未在 v0 范围

下面这些等导航形态定下来后批量推进，结构与 4 屏类似：

- Search 全屏覆盖（点 🔎 触发）
- Notifications 列表
- Settings（折叠分组即可）
- Reviews 列表 / 长评编辑（编辑页保持桌面优先，移动端可读不可改 → 待定）
- Wishlist / Archive（结构 = Home 时间线变体）
- Login（已有，几乎天然适配）

## 下一步

1. 你 review 这 4 屏，提出修正
2. 定稿后我转成 HTML mockup（可点）或直接进入代码改造
3. 代码改造按 README 的"全局决策"分两批：
   - 第一批：Header / 容器宽度 / FAB / 触控目标（影响全站，0.5 天）
   - 第二批：Home/Profile/Detail/RecordModal 4 个页面各自改造（1-2 天）
