/** Resolve a CSS custom property (`--x` or `var(--x)`) to a concrete color string. */
export function cssVar(expr: string): string {
  const name = expr.replace("var(", "").replace(")", "").trim();
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return value || "#8a8f86";
}

/** `#rrggbb` → `rgba(r,g,b,a)`; passes other formats through unchanged. */
export function withAlpha(color: string, alpha: number): string {
  const m = /^#?([0-9a-f]{6})$/i.exec(color.trim());
  if (!m) return color;
  const n = parseInt(m[1], 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
}

// Earthy categorical palette (reads well on both light and dark surfaces).
export const CATEGORICAL = [
  "#e0882f", "#58855f", "#4f8ef7", "#a855f7", "#ec4899", "#14b8a6", "#f59e0b",
  "#ef4444", "#6366f1", "#84cc16", "#06b6d4", "#8b5cf6", "#eab308", "#f97316",
];
