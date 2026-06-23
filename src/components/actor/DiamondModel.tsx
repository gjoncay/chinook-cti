import { useEffect, useMemo, useRef, useState } from "react";
import type { AttackGroupDetail, TechniqueUse } from "../../data/types";

interface DiamondModelProps {
  detail: AttackGroupDetail;
  /** Jump targets wired by the page (select a tactic tab, scroll a section). */
  onFocusCapability: () => void;
  onFocusInfrastructure: () => void;
  onFocusSources: () => void;
}

function year(value?: string): number | null {
  if (!value) return null;
  const y = Number(value.slice(0, 4));
  return Number.isFinite(y) && y > 1990 ? y : null;
}

function activityWindow(detail: AttackGroupDetail): string {
  const years = detail.campaigns
    .flatMap((c) => [year(c.firstSeen), year(c.lastSeen)])
    .filter((y): y is number => y !== null);
  if (years.length === 0) return "Not recorded";
  const min = Math.min(...years);
  const max = Math.max(...years);
  return min === max ? `${min}` : `${min} – ${max}`;
}

/* Fixed coordinate system for the diamond (matches the SVG viewBox). */
const W = 720;
const H = 360;
const BOX_W = 210;

const EDGE_POS = {
  north: { left: 360, top: 44 },
  east: { left: 590, top: 180 },
  south: { left: 360, top: 316 },
  west: { left: 130, top: 180 },
} as const;

type Edge = keyof typeof EDGE_POS;

interface VertexProps {
  label: string;
  edge: Edge;
  primary: string;
  secondary: string;
  onClick?: () => void;
  /** When defined, the vertex toggles inline detail and shows a rotating caret. */
  expanded?: boolean;
}

function Vertex({ label, edge, primary, secondary, onClick, expanded }: VertexProps) {
  const pos = EDGE_POS[edge];
  const interactive = Boolean(onClick);
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!interactive}
      className="absolute px-3 py-2.5 text-left transition-colors"
      style={{
        width: BOX_W,
        top: pos.top,
        left: pos.left,
        transform: "translate(-50%, -50%)",
        backgroundColor: "var(--bg-raised)",
        border: `1px solid ${expanded ? "var(--accent-primary)" : "var(--border-default)"}`,
        borderRadius: 4,
        cursor: interactive ? "pointer" : "default",
      }}
      onMouseEnter={(e) => {
        if (interactive) e.currentTarget.style.borderColor = "var(--accent-primary)";
      }}
      onMouseLeave={(e) => {
        if (interactive && !expanded) e.currentTarget.style.borderColor = "var(--border-default)";
      }}
    >
      <div className="data-label flex items-center justify-between">
        <span>{label}</span>
        {expanded !== undefined && (
          <svg
            width="11"
            height="11"
            viewBox="0 0 12 12"
            fill="none"
            className="transition-transform"
            style={{ transform: expanded ? "rotate(90deg)" : "rotate(0deg)" }}
            aria-hidden
          >
            <path d="M4 2.5L7.5 6L4 9.5" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </div>
      <div className="mt-1 text-[15px] font-semibold leading-tight" style={{ color: "var(--text-primary)" }}>
        {primary}
      </div>
      <div className="mt-0.5 text-[12px] leading-snug" style={{ color: "var(--text-secondary)" }}>
        {secondary}
      </div>
    </button>
  );
}

function MetaItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="data-label">{label}</div>
      <div className="mt-0.5 text-[13px] tabular-nums" style={{ color: "var(--text-primary)" }}>
        {value}
      </div>
    </div>
  );
}

/**
 * A targeted-platform chip that reveals, on hover/focus, the exact techniques
 * this actor uses that target the platform. The popup lives inside the hover
 * container so moving into it (to scroll or click a technique) keeps it open.
 */
function PlatformChip({ name, count, techniques }: { name: string; count: number; techniques: TechniqueUse[] }) {
  const [open, setOpen] = useState(false);

  return (
    <span
      className="relative inline-flex"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
    >
      <span
        tabIndex={0}
        className="flex cursor-default items-center gap-1.5 rounded px-2 py-0.5 text-[12px] outline-none"
        style={{ border: "1px solid var(--border-default)", borderRadius: 4, color: "var(--text-secondary)" }}
        aria-label={`${name}: ${count} ${count === 1 ? "technique" : "techniques"}`}
      >
        {name}
        <span className="mono text-[11px] tabular-nums" style={{ color: "var(--text-muted)" }}>
          {count}
        </span>
      </span>

      {open && techniques.length > 0 && (
        // Transparent padding (pb-1.5) bridges the visual gap to the chip so the
        // mouse stays within the hover container while crossing to the popup.
        <span className="absolute bottom-full left-0 z-30 flex flex-col pb-1.5">
          <span
            role="tooltip"
            className="flex max-h-[260px] w-[300px] flex-col overflow-y-auto p-2.5 text-left"
            style={{
              backgroundColor: "var(--bg-overlay)",
              border: "1px solid var(--border-default)",
              borderRadius: 6,
              boxShadow: "var(--shadow-card)",
            }}
          >
            <span className="data-label mb-2 block">
              {count} {count === 1 ? "technique targets" : "techniques target"} {name}
            </span>
            <span className="flex flex-col gap-1.5">
              {techniques.map((t) => (
                <a
                  key={t.techniqueId}
                  href={t.url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-baseline gap-1.5 transition-colors hover:text-[var(--accent-primary)]"
                  style={{ color: "var(--text-secondary)" }}
                  title={`${t.techniqueId} ${t.techniqueName}`}
                >
                  <span className="mono shrink-0 text-[11px]" style={{ color: "var(--text-muted)", width: 64 }}>
                    {t.techniqueId}
                  </span>
                  <span className="min-w-0 flex-1 text-[12px]">{t.techniqueName}</span>
                </a>
              ))}
            </span>
          </span>
        </span>
      )}
    </span>
  );
}

export function DiamondModel({
  detail,
  onFocusCapability,
  onFocusInfrastructure,
  onFocusSources,
}: DiamondModelProps) {
  const [showPlatforms, setShowPlatforms] = useState(false);

  // Map each platform to the actor's techniques that target it. The length of
  // each list equals the platform's count (both derive from techniqueUses).
  const techniquesByPlatform = useMemo(() => {
    const map = new Map<string, TechniqueUse[]>();
    for (const use of detail.techniqueUses) {
      for (const platform of use.platforms) {
        const list = map.get(platform);
        if (list) list.push(use);
        else map.set(platform, [use]);
      }
    }
    for (const list of map.values()) {
      list.sort((a, b) => a.techniqueId.localeCompare(b.techniqueId));
    }
    return map;
  }, [detail.techniqueUses]);

  // Scale the fixed-size diamond stage down to fit narrow viewports. Desktop
  // (>= W px available) renders at native scale 1, identical to before.
  const stageWrapRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  useEffect(() => {
    const el = stageWrapRef.current;
    if (!el) return;
    const update = () => {
      const available = el.clientWidth;
      setScale(available >= W ? 1 : Math.max(available / W, 0.1));
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const techCount = detail.techniqueUses.length;
  const swCount = detail.software.length;
  const toolCount = detail.software.filter((s) => s.softwareType === "tool").length;

  const topTactic = [...detail.tacticProfile].sort((a, b) => b.count - a.count)[0];
  const c2 = detail.tacticProfile.find((t) => t.tacticId === "command-and-control");
  const activePhases = detail.tacticProfile.filter((t) => t.count > 0).length;

  const platformNames = detail.platforms.map((p) => p.name);
  const platformLabel =
    platformNames.length === 0
      ? "No platforms recorded"
      : platformNames.slice(0, 3).join(", ") +
        (platformNames.length > 3 ? ` +${platformNames.length - 3}` : "");

  // Diamond edges stop short of the boxes so lines never clip into them.
  const cx = W / 2;
  const cy = H / 2;
  const top = { x: cx, y: 92 };
  const right = { x: 476, y: cy };
  const bottom = { x: cx, y: 268 };
  const left = { x: 244, y: cy };
  const diamond = `${top.x},${top.y} ${right.x},${right.y} ${bottom.x},${bottom.y} ${left.x},${left.y}`;

  return (
    <section className="px-4 py-6 md:px-8" style={{ borderBottom: "1px solid var(--border-default)" }}>
      <h2 className="data-label mb-1">Diamond Model</h2>
      <p className="mb-4 text-[12px]" style={{ color: "var(--text-muted)" }}>
        Intrusion analysis across the four core features. Select a vertex to drill in.
      </p>

      {/* Measuring wrapper (full width) holds a centered box sized to the SCALED
          stage, so the diamond never overflows its container on narrow screens. */}
      <div ref={stageWrapRef}>
      <div className="mx-auto" style={{ width: W * scale, height: H * scale }}>
      <div
        className="relative"
        style={{ width: W, height: H, transform: `scale(${scale})`, transformOrigin: "top left" }}
      >
        <svg
          className="absolute inset-0 h-full w-full"
          viewBox={`0 0 ${W} ${H}`}
          preserveAspectRatio="xMidYMid meet"
          aria-hidden
        >
          {/* Subdued fill + stronger outline */}
          <polygon
            points={diamond}
            fill="var(--accent-primary)"
            fillOpacity={0.05}
            stroke="var(--accent-primary)"
            strokeOpacity={0.55}
            strokeWidth={1.5}
            strokeLinejoin="round"
          />
          {/* Cross diagonals */}
          <line x1={top.x} y1={top.y} x2={bottom.x} y2={bottom.y} stroke="var(--accent-primary)" strokeOpacity={0.22} strokeWidth={1} />
          <line x1={left.x} y1={left.y} x2={right.x} y2={right.y} stroke="var(--accent-primary)" strokeOpacity={0.22} strokeWidth={1} />
          {/* Center hub so the ID label sits clear of the lines */}
          <circle cx={cx} cy={cy} r={19} fill="var(--bg-surface)" stroke="var(--border-default)" strokeWidth={1} />
        </svg>

        <div
          className="absolute mono text-[10px]"
          style={{ left: cx, top: cy, transform: "translate(-50%, -50%)", color: "var(--text-muted)", letterSpacing: "0.08em" }}
        >
          {detail.attackId}
        </div>

        <Vertex
          edge="north"
          label="Adversary"
          primary={detail.sponsor ?? "Attribution unknown"}
          secondary={`${detail.aliases.length} known aliases · ${detail.references.length} sources`}
          onClick={onFocusSources}
        />
        <Vertex
          edge="east"
          label="Capability"
          primary={`${techCount} ${techCount === 1 ? "technique" : "techniques"}`}
          secondary={`${swCount} tools & malware${topTactic && topTactic.count > 0 ? ` · peak: ${topTactic.tacticName}` : ""}`}
          onClick={onFocusCapability}
        />
        <Vertex
          edge="south"
          label="Victim"
          primary={
            platformNames.length === 0
              ? "Unknown"
              : `${platformNames.length} targeted ${platformNames.length === 1 ? "platform" : "platforms"}`
          }
          secondary={platformLabel}
          onClick={platformNames.length > 0 ? () => setShowPlatforms((v) => !v) : undefined}
          expanded={platformNames.length > 0 ? showPlatforms : undefined}
        />
        <Vertex
          edge="west"
          label="Infrastructure"
          primary={c2 && c2.count > 0 ? `${c2.count} C2 ${c2.count === 1 ? "technique" : "techniques"}` : "Not characterized"}
          secondary={`${toolCount} ${toolCount === 1 ? "tool" : "tools"} in arsenal`}
          onClick={onFocusInfrastructure}
        />
      </div>
      </div>
      </div>

      {showPlatforms && platformNames.length > 0 && (
        <div className="mt-4" style={{ borderTop: "1px solid var(--border-subtle)", paddingTop: 16 }}>
          <div className="data-label mb-0.5">Targeted platforms · victim systems</div>
          <p className="mb-2 text-[11px]" style={{ color: "var(--text-muted)" }}>
            Number = techniques targeting each platform · hover a platform to list them
          </p>
          <div className="flex flex-wrap gap-1.5">
            {detail.platforms.map((p) => (
              <PlatformChip
                key={p.name}
                name={p.name}
                count={p.count}
                techniques={techniquesByPlatform.get(p.name) ?? []}
              />
            ))}
          </div>
        </div>
      )}

      <div className="mt-5 flex flex-wrap gap-x-10 gap-y-3" style={{ borderTop: "1px solid var(--border-subtle)", paddingTop: 16 }}>
        <MetaItem label="Activity window" value={activityWindow(detail)} />
        <MetaItem label="Active phases" value={`${activePhases} / ${detail.tacticProfile.length}`} />
        <MetaItem label="Campaigns" value={String(detail.campaigns.length)} />
        <MetaItem label="Last updated" value={detail.modified ? detail.modified.slice(0, 10) : "—"} />
      </div>
    </section>
  );
}
