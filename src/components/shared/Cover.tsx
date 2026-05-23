import Image from "next/image";
import { gradientFor } from "@/lib/format/cover-gradient";

interface CoverProps {
  src?: string | null;
  seed: string;
  width?: number | string;
  height?: number | string;
  alt?: string;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * 封面渲染：有 src → next/image（unoptimized，不走 Next image loader，无 SSRF 面），
 * 无 src → 基于 seed 的渐变占位。
 *
 * 尺寸两种模式：
 * 1) width/height 是 number → 用 next/image 的 intrinsic 模式
 * 2) width/height 是 string（"100%" 等）→ fill 模式，要求父级 position: relative（.poster-tile 等都已就位）
 */
export function Cover({ src, seed, width = 38, height = 54, alt = "", className, style }: CoverProps) {
  const grad = gradientFor(seed);
  const useFill = typeof width === "string" || typeof height === "string";
  // P2-6：fill 模式且父级未给 aspect-ratio 时兜底 2/3（poster），防止占位塌成 0 高 → CLS。
  // intrinsic 模式天然有 width/height 数值，不需要。
  const aspectFallback = useFill ? { aspectRatio: "2 / 3" } : undefined;
  const dim: React.CSSProperties = { width, height, borderRadius: 4, flexShrink: 0, ...aspectFallback, ...style };

  if (src) {
    if (useFill) {
      // 父级必须 position: relative；Cover 自身用 wrapper div 维持尺寸 + 提供定位上下文兜底
      return (
        <div className={className} style={{ ...dim, position: "relative", overflow: "hidden", background: "var(--bg2)" }}>
          <Image
            src={src}
            alt={alt}
            fill
            sizes="(max-width: 500px) 50vw, (max-width: 700px) 33vw, 25vw"
            style={{ objectFit: "cover" }}
            unoptimized
          />
        </div>
      );
    }
    return (
      <Image
        src={src}
        alt={alt}
        width={width as number}
        height={height as number}
        className={className}
        style={{ ...dim, objectFit: "cover", background: "var(--bg2)" }}
        unoptimized
      />
    );
  }
  return <div className={`${grad}${className ? " " + className : ""}`} style={dim} aria-label={alt || undefined} />;
}
