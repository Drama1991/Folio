import type { UiMedium } from "./verbs";

/**
 * medium → Tabler webfont 类名（outline 系列，webfont 不含 -filled）。
 * 给 Cover placeholder、CategoryCells、其他需要"无封面时显示什么图形"的地方复用。
 */
export const MEDIUM_ICON: Record<UiMedium, string> = {
  movie: "ti-movie",
  series: "ti-device-tv",
  book: "ti-book",
  music: "ti-vinyl",
  podcast: "ti-microphone",
  game: "ti-device-gamepad-2",
};
