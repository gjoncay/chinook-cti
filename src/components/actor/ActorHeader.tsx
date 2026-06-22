import { useState } from "react";
import type { AttackGroupDetail } from "../../data/types";
import { stripCitations } from "../../utils/text";

interface ActorHeaderProps {
  detail: AttackGroupDetail;
}

function MetaChip({ label, value }: { label: string; value: string | number }) {
  return (
    <div
      className="flex items-baseline gap-1.5 px-2.5 py-1"
      style={{ border: "1px solid var(--border-default)", borderRadius: 4 }}
    >
      <span className="text-[13px] tabular-nums font-medium" style={{ color: "var(--text-primary)" }}>
        {value}
      </span>
      <span className="data-label">{label}</span>
    </div>
  );
}

export function ActorHeader({ detail }: ActorHeaderProps) {
  const [expanded, setExpanded] = useState(false);
  const hasLongDescription = detail.description.length > 240;

  return (
    <header
      className="px-4 pb-6 pt-7 md:px-8"
      style={{ borderBottom: "1px solid var(--border-default)" }}
    >
      <div className="flex flex-col items-start gap-3 sm:flex-row sm:justify-between sm:gap-6">
        <div className="min-w-0">
          <div className="flex items-center gap-2.5">
            <span className="mono text-[12px]" style={{ color: "var(--text-muted)" }}>
              {detail.attackId}
            </span>
            <span
              className="data-label"
              style={{ color: detail.sponsor ? "var(--accent-primary)" : "var(--text-muted)" }}
            >
              {detail.sponsor ? `◆ ${detail.sponsor}` : "◆ Nation unknown"}
            </span>
          </div>
          <h1
            className="mt-1 text-[28px] font-semibold leading-tight"
            style={{ color: "var(--text-primary)" }}
          >
            {detail.name}
          </h1>

          {detail.aliases.length > 0 && (
            <div className="mt-2 text-[13px]">
              <span style={{ color: "var(--text-muted)" }}>Also known as: </span>
              <span style={{ color: "var(--text-secondary)" }}>
                {detail.aliases.join(" · ")}
              </span>
            </div>
          )}
        </div>

        <a
          href={detail.url}
          target="_blank"
          rel="noreferrer"
          className="shrink-0 whitespace-nowrap text-[13px] transition-opacity hover:opacity-80"
          style={{ color: "var(--accent-primary)" }}
        >
          View on MITRE ATT&CK ↗
        </a>
      </div>

      {detail.description && (
        <div className="mt-4 max-w-[80ch]">
          <p
            className="text-[14px]"
            style={{
              color: "var(--text-secondary)",
              lineHeight: 1.6,
              display: expanded ? "block" : "-webkit-box",
              WebkitLineClamp: expanded ? "unset" : 2,
              WebkitBoxOrient: "vertical",
              overflow: expanded ? "visible" : "hidden",
            }}
          >
            {stripCitations(detail.description)}
          </p>
          {hasLongDescription && (
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              className="mt-1 text-[12px] transition-colors hover:text-[var(--text-primary)]"
              style={{ color: "var(--accent-primary)" }}
            >
              {expanded ? "Show less" : "Show more"}
            </button>
          )}
        </div>
      )}

      <div className="mt-5 flex flex-wrap items-center gap-2">
        <MetaChip label="Techniques" value={detail.techniqueUses.length} />
        <MetaChip label="Tools & Malware" value={detail.software.length} />
        <MetaChip label="Campaigns" value={detail.campaigns.length} />
        <MetaChip label="Sources" value={detail.references.length} />
      </div>
    </header>
  );
}
