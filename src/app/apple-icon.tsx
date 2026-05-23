import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

// apple-touch-icon —— iOS 加到主屏时使用。无圆角（iOS 自动裁圆）。
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#F5F2EA",
          color: "#1C1C1A",
          fontSize: 118,
          fontFamily: "Georgia, serif",
          fontWeight: 500,
          letterSpacing: "-0.04em",
          paddingBottom: 10,
        }}
      >
        F
      </div>
    ),
    { ...size },
  );
}
