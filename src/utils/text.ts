/**
 * STIX descriptions are markdown with embedded citations like "(Citation: ...)"
 * and inline links like "[APT29](https://…)". Reduce both to plain readable text.
 */
export function stripCitations(text: string): string {
  return text
    .replace(/\(Citation:[^)]*\)/g, "") // (Citation: ...)
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1") // [label](url) -> label
    .replace(/\s+([.,;:)])/g, "$1") // tidy space left before punctuation
    .replace(/\s{2,}/g, " ")
    .trim();
}

export function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max).trimEnd()}…`;
}

/** Collapse markdown links/code fences enough for a one-line excerpt. */
export function excerpt(text: string, max = 160): string {
  const clean = stripCitations(text).replace(/[`*_]/g, "");
  return truncate(clean, max);
}
