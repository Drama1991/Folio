interface SkeletonProps {
  width?: number | string;
  height?: number | string;
  radius?: number | string;
  style?: React.CSSProperties;
  className?: string;
}

export function Skeleton({ width = "100%", height = 14, radius = 4, style, className }: SkeletonProps) {
  return (
    <div
      className={`sk${className ? " " + className : ""}`}
      style={{ width, height, borderRadius: radius, ...style }}
    />
  );
}
