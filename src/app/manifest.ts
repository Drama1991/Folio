import type { MetadataRoute } from "next";

// Next.js metadata API 生成 /manifest.webmanifest。
// 应用图标走同目录静态文件 icon.png / apple-icon.png；PWA 图标见下方 icons。
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "folion · 你的文化档案",
    short_name: "folion",
    description: "记录看过、读过、听过、玩过的每一件事。",
    start_url: "/home",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    // 启动页背景走白：图标也是白底，二者无缝。米白 splash 背景在 Android Chrome 上压不住
    // （background_color 仅"部分环境"生效），故图标 + background_color 统一为白，消掉"白底上一个米黄方块"。
    background_color: "#FFFFFF",
    // theme_color 保持米白 = 运行时状态栏/顶栏与 App 米白界面一致，勿跟着改白（会和顶栏割裂）。
    theme_color: "#F5F2EA",
    lang: "zh-CN",
    categories: ["lifestyle", "books", "entertainment"],
    icons: [
      { src: "/folion-app-icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/folion-app-icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/folion-app-icon-maskable-192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "/folion-app-icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
