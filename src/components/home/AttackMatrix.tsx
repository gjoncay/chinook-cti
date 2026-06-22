import { useMemo } from "react";
import { tacticMatrix, type MatrixCell } from "../../data/dashboard";
import { useTheme } from "../../store/useTheme";
import { cssVar, withAlpha } from "../../utils/colors";

/**
 * ATT&CK-Navigator-style grid: one column per tactic (kill-chain order), each
 * holding its top-level techniques as cells shaded by how many tracked actors
 * use them. Clicking a cell opens the technique on MITRE.
 */
export function AttackMatrix() {
  const { theme } = useTheme();
  const { columns, maxCount } = useMemo(() => tacticMatrix(), []);

  // Resolve each tactic's palette color once (re-runs when the theme flips).
  const colorOf = useMemo(() => {
    const m = new Map<string, string>();
    for (const c of columns) m.set(c.tacticId, cssVar(c.color));
    return m;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [columns, theme]);

  function cellStyle(cell: MatrixCell, base: string) {
    if (cell.count === 0) {
      return { backgroundColor: withAlpha(cssVar("--text-muted"), 0.07), color: "var(--text-muted)" };
    }
    const alpha = 0.16 + 0.74 * (cell.count / maxCount);
    return { backgroundColor: withAlpha(base, alpha), color: "var(--text-primary)" };
  }

  return (
    <div className="overflow-auto" style={{ maxHeight: 460 }}>
      <div className="flex gap-2">
        {columns.map((col) => {
          const base = colorOf.get(col.tacticId) ?? "#8a8f86";
          return (
            <div key={col.tacticId} className="w-[132px] shrink-0">
              <div
                className="sticky top-0 z-10 pb-1.5"
                style={{ backgroundColor: "var(--bg-surface)" }}
              >
                <div className="flex items-center gap-1.5">
                  <span
                    className="inline-block h-2 w-2 shrink-0 rounded-sm"
                    style={{ backgroundColor: base }}
                  />
                  <span
                    className="truncate text-[11px] font-medium"
                    style={{ color: "var(--text-secondary)" }}
                    title={col.tacticName}
                  >
                    {col.tacticName}
                  </span>
                </div>
                <div className="mt-0.5 text-[10px]" style={{ color: "var(--text-muted)" }}>
                  {col.cells.length}
                </div>
              </div>
              <div className="space-y-1">
                {col.cells.map((cell) => (
                  <a
                    key={cell.id}
                    href={cell.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block rounded px-1.5 py-1 transition-opacity hover:opacity-80"
                    style={cellStyle(cell, base)}
                    title={`${cell.name} — ${cell.count} ${cell.count === 1 ? "actor" : "actors"}`}
                  >
                    <span className="mono block truncate text-[10px] leading-tight">{cell.id}</span>
                    <span className="block truncate text-[10px] leading-tight">{cell.name}</span>
                  </a>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
