import type { Metadata, Viewport } from "next";
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
  title: "folion · 你的文化档案",
  description: "记录看过、读过、听过、玩过的每一件事。",
  applicationName: "folion",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "folion",
  },
  // 关掉 iOS Safari 的电话号自动识别（会把日期/编号渲染成蓝色链接）
  formatDetection: {
    telephone: false,
    date: false,
    address: false,
    email: false,
  },
};

// viewport-fit=cover 让 body 延伸到 iOS 刘海/底栏区域；CSS 内用 env(safe-area-inset-*) 单独避让。
// themeColor 控制 PWA / Safari 上下系统栏配色，跟随主题。
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F5F2EA" },
    { media: "(prefers-color-scheme: dark)", color: "#1A1816" },
  ],
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
  d.dataset.grain=p.grain||'off';
}catch(e){
  var d=document.documentElement;
  d.dataset.theme='auto';d.dataset.fontScale='normal';d.dataset.density='cozy';d.dataset.motion='auto';d.dataset.grain='off';
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
