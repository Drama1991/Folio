import type { UiMedium } from "@/lib/format/verbs";

export interface MockNotification {
  id: string;
  type: "follow" | "mention" | "reply" | "favorite" | "system";
  actor: { handle: string; display: string; avatar?: string };
  text: string;
  itemRef?: { uuid: string; medium: UiMedium; title: string };
  createdAt: string;
  read: boolean;
}

export const mockNotifications: MockNotification[] = [
  {
    id: "n1", type: "favorite",
    actor: { handle: "nebula_w", display: "nebula" },
    text: "喜欢了你对《肖申克的救赎》的评分",
    itemRef: { uuid: "x", medium: "movie", title: "肖申克的救赎" },
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    read: false,
  },
  {
    id: "n2", type: "reply",
    actor: { handle: "drift_lm", display: "drift" },
    text: "回复了你的《挪威的森林》短评：「同感，林少华的译本……」",
    itemRef: { uuid: "y", medium: "book", title: "挪威的森林" },
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 9).toISOString(),
    read: false,
  },
  {
    id: "n3", type: "follow",
    actor: { handle: "blue_owl", display: "蓝枭" },
    text: "关注了你",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 28).toISOString(),
    read: true,
  },
  {
    id: "n4", type: "system",
    actor: { handle: "folio", display: "Folio" },
    text: "你的本月观影 +8。继续保持。",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 64).toISOString(),
    read: true,
  },
];
