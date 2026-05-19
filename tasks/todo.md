# Folio · 一级页面补完

## 范围
将上一轮产品分析中识别出的"显著缺失的一级页面"逐个落地为独立 HTML 原型，
保持与 `folio_full_prototype.html` 一致的设计语言（色板、字体、信息密度、动效）。

每个页面独立成 1 个 HTML 文件，可单独打开查看；后续 Phase 0 技术底座
迁移到 Next.js 时再拆分为组件复用。

## 设计约束（来自现有原型）

| 维度 | 值 |
|---|---|
| 容器 | `max-width:900px` 居中, 14px 圆角, 0.5px 边线 |
| 主色 | 米白 `#F7F5F0` / 文本 `#1C1C1A` / 金 `#EF9F27` |
| 字体 | Noto Serif SC (标题/正文文学化) + JetBrains Mono (元数据) + system sans (UI) |
| 圆角 | 卡片 10px (`--r`) / 控件 6px (`--r2`) |
| 边线 | 全部 0.5px,色 `#D8D6D0` |
| 动效 | `fadeUp 0.18s` 进入, `slideIn 0.18s` 抽屉 |
| 标点 | 标题用句号结尾（"夜安。"），传达文学化签名 |

## 任务清单

- [x] `search.html` — 搜索结果页
  - 大号搜索输入框（serif 字体，focused 状态）
  - 类型 tab + 计数（全部/电影/剧集/书籍/音乐/播客）
  - 结果按类型分组（section label + 列表）
  - 每条结果显示用户当前状态（看过/在看/想看/未记录）
  - NeoDB 评分作为参考分对照
  - AI 模糊查找入口（自然语言查询）

- [x] `profile.html` — 个人主页
  - Profile hero：大头像 + 名称 + 联邦 handle + 简介 + 加入日期
  - 5 格 stats（看过/读过/听过/在看/想看）
  - 年度回顾 featured card（深色卡片）
  - 公开合集网格（4 个，带封面堆叠预览）
  - 常用标签云
  - 最近长评 preview

- [x] `settings.html` — 设置
  - 左侧 sidebar nav（账户/NeoDB/AI/外观/数据/关于）
  - NeoDB 连接卡片（实例、令牌、上次同步、立即同步按钮）
  - AI 服务商三选一卡片 + API key 掩码 + 用量
  - 主题三选一（米白/深色/跟随系统）+ 字号 + 语言 + 密度
  - 数据：导出 CSV/JSON、从豆瓣导入、危险区
  - 关于：版本、GitHub、许可证

- [x] `login.html` — 登录/授权（联邦 OAuth）
  - 无 header 的居中布局
  - Logo + 文学化 hero ("夜安。")
  - NeoDB 实例输入 + 常用实例 chips
  - 三步说明（选实例 → 授权 → 完成）
  - 没账号引导
  - 隐私/条款/GitHub footer

## 后续未做的事

二级页面（编辑记录 modal / 长评编辑器 / 集数追踪 / 阅读进度 /
其他媒介 archive / 其他媒介 detail / 时间线 / AI 历史 / 通知中心）
留到下一轮，跟 Phase 0 技术底座一起评估。

## 备注

- 4 个新页面均加入 Tabler Icons CDN（原型遗漏了，导致 `<i class="ti">` 不渲染）
- 跨文件链接已建立：login → home / avatar → profile / profile 编辑资料 → settings
- nav 在非首页文件中保留视觉一致，但不高亮（语义上这些都不属于三大主分区）

## Review

四个页面已完成，整体保持了原型的"安静书房"质感：

1. **search**：把顶栏 ⌘K 暗示的能力放大成真页面，结果分组 + 状态对照让搜索同时是"发现"和"查档案"。
2. **profile**：年度回顾卡用深色（呼应首页的"在看"hero），是页面唯一的情感锚点。
3. **settings**：左侧 sidebar nav 是新模式，但视觉权重控制得很轻；NeoDB 连接卡用渐变背景突出，"危险区"用暖红边框做警示，没破坏整体米白调。
4. **login**：完全脱离 shell 容器，居中布局更克制，三步说明清楚联邦登录心智模型。

可改进点：
- 搜索结果的"NeoDB ★ 8.7"参考分应该和用户自己评分有视觉区分（现在都是金色 star，可能混淆）
- profile 的合集封面堆叠 margin-right:-8px 在 Safari 上需要验证
- settings 的 toggle switch 只在 NeoDB 一处用了，要么多用要么改为单选按钮
