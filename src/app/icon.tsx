import { ImageResponse } from "next/og";

export const size = { width: 512, height: 512 };
export const contentType = "image/png";

// "F" 字占位 —— 米白底 + 暖墨 F。后续替换为方形 logo 时改这里即可。
export default function Icon() {
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
          fontSize: 340,
          fontFamily: "Georgia, serif",
          fontWeight: 500,
          letterSpacing: "-0.04em",
          paddingBottom: 28,
        }}
      >
        F
      </div>
    ),
    { ...size },
  );
}
