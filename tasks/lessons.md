# Lessons

## 2026-05-22 · 不要相信 compact 摘要里的事实声明

**情境：** Timeline 状态筛选 dropdown hint 里我写了"看过 · 读过 · 听过 · 玩过"。用户问"没有游戏类目，是否要'玩过'？"。compact 摘要里写过 "ALL_UI_MEDIUMS does include game"，差点据此回答"游戏是支持的类目"。

**事实：** `lib/neodb/mediumMap.ts` 里 `ALL_UI_MEDIUMS = ["movie", "series", "book", "music", "podcast"]` —— 没有 game。`UiMedium` 类型有 game 一项，但运行时被排除在外。首页 cell、timeline chip、archive 路由全部以 `ALL_UI_MEDIUMS` 为源。

**规则：** compact 摘要可能有错。任何"我之前写过 X 存在"的回忆，在落地为代码或答用户之前，先 grep 源码确认。CLAUDE.md 第 7 条（Verify Before Claiming Facts）适用于自己的记忆，不只是外部资料。

**how to apply：** 看到摘要里"X has Y"的具体技术断言（变量内容、文件存在、API 形状），先 grep / Read 一遍再用。

## 2026-05-23 · 回应"要不要做 X"前必须读 X 现状

**情境：** P2 全部跑完后我问用户"要不要顺手把 P1-11 CSP 也补上？那是 P2 里实际更值钱的一项。"用户答"好的"。开工 Read 才发现 `next.config.ts` 早就实现了完整 CSP + security headers 套件，注释甚至明写 "P1-11"。我答得太快、太确定。

**事实：** review 文档（2026-05-22）说 "next.config.ts 空，没设 `headers()`"。但 git status 显示 next.config.ts 是 M（modified），有未提交改动——P1-11 已在 review 之后某次本地编辑里做完。

**规则：** 提议「补做某条 review 项」之前，先 Read 相关文件确认当前状态。**review 文档 ≠ 当前状态**——review 是某个时间点的快照，工作可能已经在更新但未提交。尤其当 git status 显示文件 M、且改动未推上 PR 时，review 的描述天然过时。

**how to apply：** 任何形如"P{N}-{M} 还没做，要不要补"的提议——开口前先 `Read` 那个文件 / `grep` 那个函数。同样适用于代码审查里的「这里漏了 X」断言：先看现状。

## 2026-05-24 · 不要把"代码分支存在"等同于"用户体验已具备"

**情境：** 第三批·下半 AIPanel mobile 化，我看到 DraggableWindow 里有 `if (mobile) setBox({x:0, y:0, w: innerWidth, h: innerHeight})` 这个全屏分支，加上 `border: isMobile ? "none" : ...`，就报告"DraggableWindow 已原生支持 mobile 全屏，本批只需补内部按钮触控目标"。用户直接反问"AIPanel 你不是说点击之后从右侧滑出吗？没有做？"

**事实：** 全屏分支是有的，但**进入动画依然是 `scale(0.55) → scale(1)`**（从触发点缩放），不是 sheet 滑入；**也没有顶部 handle**。这跟同期已落地的 RecordModal 在 mobile 的 sheet 形态（slide-up + handle）有明显差距。从用户视角看，AIPanel 跟"右滑入面板"或"底部 sheet"完全不是一回事——只是变大了。

**规则：** 当声称"X 已经支持 Y"时，**Y 必须是用户能看见/感知的形态**，不是代码里某个 if 分支。对于 UI 组件，"已支持 mobile" 至少要包括：①布局填屏 ②进入/退出动画符合该形态（sheet=slide-up，drawer=slide-in） ③该形态的视觉惯例（sheet handle、drawer 蒙层、modal 居中）。少一项就不算"已支持"，只算"代码骨架在"。

**how to apply：** 凡是要写"X 已经/原生支持 Y"的措辞——先在脑子里跑一遍：用户打开 X 时**眼睛会看到什么**？跟同项目里已落地的标准形态（RecordModal sheet / Drawer / Modal）比一下，差哪几样就老实承认差哪几样，要么补上、要么写明留作下轮。绝不用"代码存在分支"打包成"功能已具备"来糊弄过去。


