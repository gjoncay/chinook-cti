import type { Reference } from "../../data/types";

interface ReferenceListProps {
  references: Reference[];
}

function hostname(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

/** Compact list of source citations — each links out to the original report. */
export function ReferenceList({ references }: ReferenceListProps) {
  if (references.length === 0) return null;
  return (
    <ol className="space-y-1.5">
      {references.map((ref, i) => (
        <li key={ref.url} className="flex gap-2 text-[12px]">
          <span className="mono shrink-0" style={{ color: "var(--text-muted)", width: 22 }}>
            {String(i + 1).padStart(2, "0")}
          </span>
          <a
            href={ref.url}
            target="_blank"
            rel="noreferrer"
            className="min-w-0 transition-colors hover:text-[var(--accent-primary)]"
            style={{ color: "var(--text-secondary)" }}
          >
            <span>{ref.sourceName}</span>
            <span className="mono ml-1.5 text-[11px]" style={{ color: "var(--text-muted)" }}>
              {hostname(ref.url)} ↗
            </span>
          </a>
        </li>
      ))}
    </ol>
  );
}
