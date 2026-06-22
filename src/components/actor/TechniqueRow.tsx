import { useState } from "react";
import { getTechnique } from "../../data/attackClient";
import { getCountermeasuresForTechnique } from "../../data/d3fendClient";
import { getD3fendTactic } from "../../data/d3fendMeta";
import { useAttackStore } from "../../store/useAttackStore";
import type { TechniqueUse } from "../../data/types";
import { stripCitations, truncate } from "../../utils/text";

interface TechniqueRowProps {
  use: TechniqueUse;
}

const CM_LIMIT = 8;

function Countermeasures({ techniqueId }: { techniqueId: string }) {
  const d3fendStatus = useAttackStore((s) => s.d3fendStatus);

  if (d3fendStatus === "loading" || d3fendStatus === "idle") {
    return (
      <p className="mt-2 text-[12px]" style={{ color: "var(--text-muted)", paddingLeft: 112 }}>
        Loading D3FEND countermeasures…
      </p>
    );
  }
  if (d3fendStatus === "error") return null;

  const cms = getCountermeasuresForTechnique(techniqueId);
  if (cms.length === 0) {
    return (
      <p className="mt-2 text-[12px]" style={{ color: "var(--text-muted)", paddingLeft: 112 }}>
        No mapped D3FEND countermeasures.
      </p>
    );
  }

  const shown = cms.slice(0, CM_LIMIT);
  const hidden = cms.length - shown.length;

  return (
    <div className="mt-2.5" style={{ paddingLeft: 112 }}>
      <div className="data-label mb-1.5">Countermeasures · D3FEND</div>
      <div className="flex flex-wrap gap-1.5">
        {shown.map((cm) => (
          <a
            key={cm.id}
            href={cm.url}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 px-2 py-0.5 text-[12px] transition-colors hover:border-[var(--border-strong)]"
            style={{
              border: "1px solid var(--border-default)",
              borderRadius: 4,
              color: "var(--text-secondary)",
            }}
            title={`${cm.tactic} · ${cm.d3fendId ?? ""} ${cm.name}`}
          >
            <span
              className="inline-block h-2 w-2 shrink-0"
              style={{ backgroundColor: getD3fendTactic(cm.tactic)?.color ?? "var(--text-muted)", borderRadius: 2 }}
            />
            {cm.name}
            {cm.d3fendId && (
              <span className="mono text-[11px]" style={{ color: "var(--text-muted)" }}>
                {cm.d3fendId}
              </span>
            )}
          </a>
        ))}
        {hidden > 0 && (
          <span className="px-1 py-0.5 text-[12px]" style={{ color: "var(--text-muted)" }}>
            +{hidden} more
          </span>
        )}
      </div>
    </div>
  );
}

/** Resolve what to show when expanded: group-specific use first, else the technique description. */
function expandedText(use: TechniqueUse): { text: string; generic: boolean } {
  const groupSpecific = stripCitations(use.description);
  if (groupSpecific) return { text: groupSpecific, generic: false };
  try {
    const tech = getTechnique(use.techniqueId);
    return { text: truncate(stripCitations(tech.description), 200), generic: true };
  } catch {
    return { text: "No description available.", generic: true };
  }
}

export function TechniqueRow({ use }: TechniqueRowProps) {
  const [open, setOpen] = useState(false);
  const [hover, setHover] = useState(false);
  const detail = open ? expandedText(use) : null;
  const background = open || hover ? "var(--bg-raised)" : "transparent";

  return (
    <div
      style={{ borderBottom: "1px solid var(--border-subtle)" }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <div className="flex items-center gap-3 px-2 py-2" style={{ backgroundColor: background }}>
        {/* The ID + name link straight to the technique on ATT&CK. */}
        <a
          href={use.url}
          target="_blank"
          rel="noreferrer"
          className="flex min-w-0 flex-1 items-center gap-3"
          title="Open on MITRE ATT&CK"
        >
          <span
            className="mono shrink-0 text-[12px]"
            style={{ width: 100, color: "var(--text-muted)" }}
          >
            {use.techniqueId}
          </span>
          <span
            className="min-w-0 flex-1 truncate text-[13px] transition-colors group-hover:text-[var(--accent-primary)]"
            style={{
              color: "var(--text-primary)",
              paddingLeft: use.isSubtechnique ? 20 : 0,
            }}
          >
            {use.isSubtechnique && (
              <span className="mono mr-1.5" style={{ color: "var(--text-muted)" }}>
                └
              </span>
            )}
            {use.techniqueName}
            <span className="ml-1.5 text-[11px]" style={{ color: "var(--text-muted)" }}>
              ↗
            </span>
          </span>
        </a>

        {/* Chevron toggles the group-specific use description inline. */}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-label={open ? "Collapse usage detail" : "Expand usage detail"}
          className="shrink-0 px-1.5 py-1"
        >
          <svg
            className="transition-transform"
            width="12"
            height="12"
            viewBox="0 0 12 12"
            fill="none"
            style={{ transform: open ? "rotate(90deg)" : "rotate(0deg)" }}
            aria-hidden
          >
            <path
              d="M4 2.5L7.5 6L4 9.5"
              stroke="var(--text-muted)"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>

      {open && detail && (
        <div className="px-2 pb-3 pt-0" style={{ backgroundColor: "var(--bg-raised)" }}>
          <p
            className="text-[13px] italic"
            style={{ color: "var(--text-secondary)", paddingLeft: 100 + 12 }}
          >
            {detail.text}
            {detail.generic && <span className="ml-1.5 not-italic data-label">generic</span>}
          </p>
          <Countermeasures techniqueId={use.techniqueId} />
        </div>
      )}
    </div>
  );
}
