import type { MetadataRoute } from "next";

// Next.js metadata API 生成 /manifest.webmanifest。
// icon.tsx / apple-icon.tsx 自动暴露在 /icon、/apple-icon。
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Folio · 你的文化档案",
    short_name: "Folio",
    description: "记录看过、读过、听过、玩过的每一件事。",
    start_url: "/home",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#F5F2EA",
    theme_color: "#F5F2EA",
    lang: "zh-CN",
    categories: ["lifestyle", "books", "entertainment"],
    icons: [
      { src: "/icon", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/apple-icon", sizes: "180x180", type: "image/png" },
    ],
  };
}
