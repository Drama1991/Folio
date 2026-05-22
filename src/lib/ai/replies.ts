import type { UiMedium } from "@/lib/format/verbs";

export const replies: Record<UiMedium | "home", string[]> = {
  home: [
    "根据你的观影偏好，今晚试试《漫长的季节》——它在你的想看列表里。",
    "你最近偏好慢节奏文艺片。要不要看《好东西》？同样轻盈但不轻浮。",
    "你已经连看两部冷色调，换个节奏：《请回答 1988》第 6 集，刚好 80 分钟。",
  ],
  movie: [
    "这部和你常看的导演谱系接近——偏冷峻。看完可以接《降临》。",
    "它的叙事密度比《奥本海默》低，但人物弧线更完整。",
  ],
  series: [
    "12 集国剧的标准节奏——前两集慢，第 4 集进入正题。",
    "悬疑外壳下其实是一首长诗。注意秦昊和范伟的对手戏。",
  ],
  book: [
    "村上的语言像一首很长的钢琴曲——旋律不复杂，但调性始终笼罩在某种半透明的悲伤里。",
    "如果你喜欢这本，可以再读《海边的卡夫卡》，母题接近但叙事更松散。",
  ],
  music: [
    "民谣 + 山地摇滚的结合在 2019 年是少见的尝试。",
    "和你之前听的草东比，山人的器乐编排更克制。",
  ],
  podcast: [
    "这档播客的节奏适合通勤听——单期约 40-60 分钟。",
    "主播的访谈风格偏长跑型，前 15 分钟在铺垫。",
  ],
  game: [
    "玩法骨架是 metroidvania，但情绪走的是抑郁现实主义。",
  ],
};

export const suggs: Record<UiMedium | "home", string[]> = {
  home: ["今晚推荐一部电影", "从想看里随机选一个", "推荐一本短篇集", "周末适合看哪部剧"],
  movie: ["这部片想表达什么", "导演的其他作品", "类似题材推荐", "为什么这片高分"],
  series: ["这部剧值不值得追", "剧情走向", "类似国剧推荐"],
  book: ["这本书的核心母题", "作者其他作品", "类似题材推荐"],
  music: ["这张专辑的概念", "类似风格推荐"],
  podcast: ["最值得听的几集", "类似类型推荐"],
  game: ["核心玩法", "类似游戏"],
};

export function pickReply(ctx: UiMedium | "home", _q: string): string {
  const arr = replies[ctx] ?? replies.home;
  return arr[Math.floor(Math.random() * arr.length)];
}
