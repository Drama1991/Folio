# Lessons

## 2026-05-22 · 不要相信 compact 摘要里的事实声明

**情境：** Timeline 状态筛选 dropdown hint 里我写了"看过 · 读过 · 听过 · 玩过"。用户问"没有游戏类目，是否要'玩过'？"。compact 摘要里写过 "ALL_UI_MEDIUMS does include game"，差点据此回答"游戏是支持的类目"。

**事实：** `lib/neodb/mediumMap.ts` 里 `ALL_UI_MEDIUMS = ["movie", "series", "book", "music", "podcast"]` —— 没有 game。`UiMedium` 类型有 game 一项，但运行时被排除在外。首页 cell、timeline chip、archive 路由全部以 `ALL_UI_MEDIUMS` 为源。

**规则：** compact 摘要可能有错。任何"我之前写过 X 存在"的回忆，在落地为代码或答用户之前，先 grep 源码确认。CLAUDE.md 第 7 条（Verify Before Claiming Facts）适用于自己的记忆，不只是外部资料。

**how to apply：** 看到摘要里"X has Y"的具体技术断言（变量内容、文件存在、API 形状），先 grep / Read 一遍再用。
