export const COVER_GRADIENT_CLASSES = ["c1", "c2", "c3", "c4", "c5", "c6", "c7", "c8"] as const;
export type CoverGradient = (typeof COVER_GRADIENT_CLASSES)[number];

function hash(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h << 5) - h + str.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

export function gradientFor(seed: string | undefined | null): CoverGradient {
  if (!seed) return "c1";
  return COVER_GRADIENT_CLASSES[hash(seed) % COVER_GRADIENT_CLASSES.length];
}
