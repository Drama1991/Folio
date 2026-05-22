import type { Metadata } from "next";
import { Noto_Serif_SC, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const notoSerifSC = Noto_Serif_SC({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-noto-serif-sc",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Folio · 你的文化档案",
  description: "记录看过、读过、听过、玩过的每一件事。",
};

// 首屏同步注入主题/字号/密度/动效偏好，避免 FOUC（米白→深色闪烁）。
// 读 localStorage('folio:appearance') 写到 documentElement.dataset 上，CSS 立即匹配。
const APPEARANCE_BOOT = `(function(){try{
  var raw=localStorage.getItem('folio:appearance');
  var p=raw?JSON.parse(raw):{};
  var d=document.documentElement;
  d.dataset.theme=p.theme||'auto';
  d.dataset.fontScale=p.fontScale||'normal';
  d.dataset.density=p.density||'cozy';
  d.dataset.motion=p.motion||'auto';
}catch(e){
  var d=document.documentElement;
  d.dataset.theme='auto';d.dataset.fontScale='normal';d.dataset.density='cozy';d.dataset.motion='auto';
}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN" className={`${notoSerifSC.variable} ${jetbrainsMono.variable}`} suppressHydrationWarning>
      <head>
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/dist/tabler-icons.min.css"
        />
        <script dangerouslySetInnerHTML={{ __html: APPEARANCE_BOOT }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
