import { useMemo, useState } from "react";
import { getActorCoverage } from "../../data/d3fendClient";
import { getD3fendTactic } from "../../data/d3fendMeta";
import { useAttackStore } from "../../store/useAttackStore";
import type { CoverageItem, CoverageTechniqueRef } from "../../data/d3fendClient";

interface DefensiveCoverageProps {
  techniques: CoverageTechniqueRef[];
}

const PER_TACTIC_LIMIT = 8;

function CoverageRow({
  item,
  color,
  scale,
  total,
}: {
  item: CoverageItem;
  color: string;
  scale: number; // max coverage, for bar width
  total: number;
}) {
  const [open, setOpen] = useState(false);
  const pct = scale > 0 ? Math.round((item.coverage / scale) * 100) : 0;

  return (
    <div style={{ borderBottom: open ? "1px solid var(--border-subtle)" : "none" }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="-mx-2 flex w-[calc(100%+1rem)] items-center gap-3 rounded px-2 py-1 text-left transition-colors hover:bg-[var(--bg-surface)]"
        title="Click to show the ATT&CK techniques this addresses"
      >
        <div className="flex w-[44%] min-w-0 items-baseline gap-2">
          {item.countermeasure.d3fendId && (
            <span className="mono shrink-0 text-[11px]" style={{ color: "var(--text-muted)", width: 60 }}>
              {item.countermeasure.d3fendId}
            </span>
          )}
          <span
            className="min-w-0 flex-1 truncate text-[13px]"
            style={{ color: "var(--text-primary)" }}
            title={`${item.countermeasure.d3fendId ?? ""} ${item.countermeasure.name}`.trim()}
          >
            {item.countermeasure.name}
          </span>
        </div>
        <div className="relative h-[10px] flex-1" style={{ backgroundColor: "var(--bg-raised)", borderRadius: 2 }}>
          <div
            className="absolute inset-y-0 left-0"
            style={{ width: `${pct}%`, backgroundColor: color, borderRadius: 2 }}
          />
        </div>
        <span className="mono w-[58px] shrink-0 text-right text-[11px] tabular-nums" style={{ color: "var(--text-secondary)" }}>
          {item.coverage} / {total}
        </span>
        <svg
          className="shrink-0 transition-transform"
          width="11"
          height="11"
          viewBox="0 0 12 12"
          fill="none"
          style={{ transform: open ? "rotate(90deg)" : "rotate(0deg)" }}
          aria-hidden
        >
          <path d="M4 2.5L7.5 6L4 9.5" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div className="flex flex-wrap gap-1.5 pb-2.5 pt-1">
          <span className="data-label mr-1 self-center">Addresses</span>
          {item.techniques.map((t) => (
            <a
              key={t.id}
              href={t.url}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 px-2 py-0.5 text-[12px] transition-colors hover:border-[var(--border-strong)]"
              style={{ border: "1px solid var(--border-default)", borderRadius: 4, color: "var(--text-secondary)" }}
              title={`${t.id} ${t.name}`}
            >
              <span className="mono text-[11px]" style={{ color: "var(--text-muted)" }}>
                {t.id}
              </span>
              <span className="max-w-[200px] truncate">{t.name}</span>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

export function DefensiveCoverage({ techniques }: DefensiveCoverageProps) {
  const d3fendStatus = useAttackStore((s) => s.d3fendStatus);

  const coverage = useMemo(() => {
    if (d3fendStatus !== "ready") return null;
    return getActorCoverage(techniques);
  }, [d3fendStatus, techniques]);

  const maxCoverage = useMemo(() => {
    if (!coverage) return 0;
    return coverage.groups.reduce(
      (max, g) => Math.max(max, ...g.items.map((i) => i.coverage)),
      0,
    );
  }, [coverage]);

  return (
    <section className="px-4 py-6 md:px-8" style={{ borderBottom: "1px solid var(--border-default)" }}>
      <div className="mb-1 flex items-baseline justify-between gap-3">
        <h2 className="data-label">Defensive Coverage · D3FEND</h2>
        {coverage && (
          <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>
            {coverage.totalCountermeasures} countermeasures · addresses {coverage.coveredTechniques} of{" "}
            {coverage.totalTechniques} techniques
          </span>
        )}
      </div>
      <p className="mb-4 text-[12px]" style={{ color: "var(--text-muted)" }}>
        MITRE D3FEND countermeasures mapped to this actor's techniques, ranked by how many they address.
        Click any countermeasure to list the ATT&amp;CK techniques it covers.
      </p>

      {d3fendStatus === "loading" && (
        <p className="text-[13px]" style={{ color: "var(--text-muted)" }}>
          Loading D3FEND mappings…
        </p>
      )}
      {d3fendStatus === "error" && (
        <p className="text-[13px]" style={{ color: "var(--text-muted)" }}>
          Couldn't load D3FEND mappings. Reload to retry.
        </p>
      )}
      {coverage && coverage.totalCountermeasures === 0 && (
        <p className="text-[13px]" style={{ color: "var(--text-muted)" }}>
          No D3FEND countermeasures are mapped to this actor's techniques.
        </p>
      )}

      {coverage && coverage.groups.length > 0 && (
        <div className="space-y-5">
          {coverage.groups.map((group) => {
            const tactic = getD3fendTactic(group.tactic);
            const color = tactic?.color ?? "var(--text-muted)";
            const shown = group.items.slice(0, PER_TACTIC_LIMIT);
            const hidden = group.items.length - shown.length;
            return (
              <div key={group.tactic}>
                <div className="mb-1.5 flex items-center gap-2">
                  <span
                    className="inline-block h-2 w-2 shrink-0"
                    style={{ backgroundColor: color, borderRadius: 2 }}
                  />
                  <span className="data-label" style={{ color: "var(--text-secondary)" }}>
                    {group.tactic}
                  </span>
                  <span className="text-[11px] tabular-nums" style={{ color: "var(--text-muted)" }}>
                    {group.items.length}
                  </span>
                </div>
                {shown.map((item) => (
                  <CoverageRow
                    key={item.countermeasure.id}
                    item={item}
                    color={color}
                    scale={maxCoverage}
                    total={coverage.totalTechniques}
                  />
                ))}
                {hidden > 0 && (
                  <p className="mt-1 text-[11px]" style={{ color: "var(--text-muted)" }}>
                    +{hidden} more in {group.tactic}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
