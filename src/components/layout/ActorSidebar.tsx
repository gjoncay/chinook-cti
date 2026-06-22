import { forwardRef, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAttackStore } from "../../store/useAttackStore";
import { SearchInput } from "../shared/SearchInput";
import { AboutDialog } from "../shared/AboutDialog";
import type { AttackGroupSummary } from "../../data/types";

type SortMode = "name" | "nation";

function matches(group: AttackGroupSummary, query: string): boolean {
  if (!query) return true;
  const q = query.toLowerCase();
  if (group.name.toLowerCase().includes(q)) return true;
  if (group.attackId.toLowerCase().includes(q)) return true;
  if (group.sponsor?.toLowerCase().includes(q)) return true;
  return group.aliases.some((a) => a.toLowerCase().includes(q));
}

interface Section {
  label: string | null;
  items: AttackGroupSummary[];
}

const UNATTRIBUTED = "Unattributed";

/** First letter of the name, uppercased; non-alphabetic leads bucket under "#". */
function firstLetter(name: string): string {
  const c = name.trim().charAt(0).toUpperCase();
  return /[A-Z]/.test(c) ? c : "#";
}

function buildSections(groups: AttackGroupSummary[], mode: SortMode): Section[] {
  const sorted = [...groups].sort((a, b) => a.name.localeCompare(b.name));

  if (mode === "name") {
    const byLetter = new Map<string, AttackGroupSummary[]>();
    for (const g of sorted) {
      const key = firstLetter(g.name);
      const list = byLetter.get(key);
      if (list) list.push(g);
      else byLetter.set(key, [g]);
    }
    const labels = [...byLetter.keys()].sort((a, b) => {
      if (a === "#") return 1; // numbers/symbols last
      if (b === "#") return -1;
      return a.localeCompare(b);
    });
    return labels.map((label) => ({ label, items: byLetter.get(label) ?? [] }));
  }

  const bySponsor = new Map<string, AttackGroupSummary[]>();
  for (const g of groups) {
    const key = g.sponsor ?? UNATTRIBUTED;
    const list = bySponsor.get(key);
    if (list) list.push(g);
    else bySponsor.set(key, [g]);
  }
  const labels = [...bySponsor.keys()].sort((a, b) => {
    if (a === UNATTRIBUTED) return 1; // always last
    if (b === UNATTRIBUTED) return -1;
    return a.localeCompare(b);
  });
  return labels.map((label) => ({
    label,
    items: (bySponsor.get(label) ?? []).sort((a, b) => a.name.localeCompare(b.name)),
  }));
}

export function ActorSidebar() {
  const status = useAttackStore((s) => s.status);
  const groups = useAttackStore((s) => s.groups);
  const navigate = useNavigate();
  const { groupId } = useParams<{ groupId: string }>();

  const [query, setQuery] = useState("");
  const [aboutOpen, setAboutOpen] = useState(false);
  const [sortMode, setSortMode] = useState<SortMode>("name");
  const [collapsed, setCollapsed] = useState<Set<string>>(() => new Set());
  const [activeIndex, setActiveIndex] = useState(0);
  const rowRefs = useRef<Array<HTMLAnchorElement | null>>([]);

  const filtered = useMemo(() => groups.filter((g) => matches(g, query)), [groups, query]);
  const sections = useMemo(() => buildSections(filtered, sortMode), [filtered, sortMode]);

  // Only rows that are actually rendered (collapsed sections excluded) take part in keyboard nav.
  const visibleRows = useMemo(
    () => sections.flatMap((s) => (s.label && collapsed.has(s.label) ? [] : s.items)),
    [sections, collapsed],
  );

  const sectionLabels = useMemo(
    () => sections.map((s) => s.label).filter((l): l is string => l !== null),
    [sections],
  );
  const allCollapsed = sectionLabels.length > 0 && sectionLabels.every((l) => collapsed.has(l));

  function toggleCollapse(label: string) {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(label)) next.delete(label);
      else next.add(label);
      return next;
    });
  }

  function toggleAll() {
    setCollapsed(allCollapsed ? new Set() : new Set(sectionLabels));
  }

  // Keep the keyboard cursor on the routed actor when it's visible.
  useEffect(() => {
    const idx = visibleRows.findIndex((g) => g.attackId === groupId);
    if (idx >= 0) setActiveIndex(idx);
    else if (activeIndex >= visibleRows.length) setActiveIndex(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupId, visibleRows.length]);

  function focusRow(idx: number) {
    rowRefs.current[idx]?.scrollIntoView({ block: "nearest" });
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (visibleRows.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => {
        const next = Math.min(i + 1, visibleRows.length - 1);
        focusRow(next);
        return next;
      });
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => {
        const next = Math.max(i - 1, 0);
        focusRow(next);
        return next;
      });
    } else if (e.key === "Enter") {
      const target = visibleRows[activeIndex];
      if (target) navigate(`/actor/${target.attackId}`);
    }
  }

  let rowCursor = -1; // running index across rendered rows only

  return (
    <nav
      className="flex h-full flex-col"
      style={{ borderRight: "1px solid var(--border-default)", backgroundColor: "var(--bg-surface)" }}
      onKeyDown={onKeyDown}
      aria-label="Threat actors"
    >
      {/* Brand */}
      <div className="px-3 pb-3 pt-3.5">
        <span className="text-[13px] font-semibold tracking-[0.14em]" style={{ color: "var(--text-primary)" }}>
          VANTAGE
        </span>
        <div className="mt-0.5 text-[11px]" style={{ color: "var(--text-muted)" }}>
          ATT&CK Intelligence Browser
        </div>
      </div>

      {/* Search */}
      <div className="px-3 pb-2">
        <SearchInput
          value={query}
          placeholder="Search actors or aliases…"
          onChange={(e) => {
            setQuery(e.target.value);
            setActiveIndex(0);
          }}
          aria-label="Search actors or aliases"
        />
      </div>

      {/* Sort toggle + expand/collapse all */}
      <div className="flex items-center gap-1 px-3 pb-2">
        <SortButton active={sortMode === "name"} onClick={() => setSortMode("name")}>
          A–Z
        </SortButton>
        <SortButton active={sortMode === "nation"} onClick={() => setSortMode("nation")}>
          By nation
        </SortButton>
        {status === "ready" && sectionLabels.length > 0 && (
          <button
            type="button"
            onClick={toggleAll}
            className="ml-auto px-1 text-[11px] transition-colors hover:text-[var(--text-primary)]"
            style={{ color: "var(--text-muted)" }}
          >
            {allCollapsed ? "Expand all" : "Collapse all"}
          </button>
        )}
      </div>

      {/* Count line */}
      <div className="flex items-center justify-between px-3 pb-1.5">
        <span className="data-label">Actors</span>
        <span className="text-[11px] tabular-nums" style={{ color: "var(--text-muted)" }}>
          {status === "ready" ? filtered.length : ""}
        </span>
      </div>

      {/* List */}
      <div className="min-h-0 flex-1 overflow-y-auto pb-3">
        {status === "loading" && <SidebarSkeleton />}
        {status === "error" && (
          <p className="px-3 py-2 text-[12px]" style={{ color: "var(--text-muted)" }}>
            Couldn't load the actor list.
          </p>
        )}
        {status === "ready" && filtered.length === 0 && (
          <p className="px-3 py-2 text-[12px]" style={{ color: "var(--text-muted)" }}>
            No actors match “{query}”.
          </p>
        )}
        {status === "ready" &&
          sections.map((section) => {
            const isCollapsed = section.label !== null && collapsed.has(section.label);
            return (
              <div key={section.label ?? "all"}>
                {section.label && (
                  <button
                    type="button"
                    onClick={() => toggleCollapse(section.label as string)}
                    className="sticky top-0 z-10 flex w-full items-center gap-2 px-3 py-1.5 text-left transition-colors"
                    style={{ backgroundColor: "var(--bg-surface)" }}
                    aria-expanded={!isCollapsed}
                  >
                    <svg
                      width="10"
                      height="10"
                      viewBox="0 0 12 12"
                      fill="none"
                      className="shrink-0 transition-transform"
                      style={{ transform: isCollapsed ? "rotate(0deg)" : "rotate(90deg)" }}
                      aria-hidden
                    >
                      <path d="M4 2.5L7.5 6L4 9.5" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <span className="data-label flex-1" style={{ color: "var(--text-secondary)" }}>
                      {section.label}
                    </span>
                    <span className="text-[11px] tabular-nums" style={{ color: "var(--text-muted)" }}>
                      {section.items.length}
                    </span>
                  </button>
                )}
                {!isCollapsed &&
                  section.items.map((g) => {
                    rowCursor += 1;
                    const idx = rowCursor;
                    return (
                      <ActorRow
                        key={g.id}
                        ref={(el) => (rowRefs.current[idx] = el)}
                        group={g}
                        showSponsor={sortMode === "name"}
                        selected={g.attackId === groupId}
                        active={idx === activeIndex}
                      />
                    );
                  })}
              </div>
            );
          })}
      </div>

      {/* Footer: attribution + legal */}
      <div
        className="shrink-0 px-3 py-2.5"
        style={{ borderTop: "1px solid var(--border-default)" }}
      >
        <button
          type="button"
          onClick={() => setAboutOpen(true)}
          className="text-[12px] transition-colors hover:text-[var(--text-primary)]"
          style={{ color: "var(--text-secondary)" }}
        >
          About &amp; legal
        </button>
        <div className="mt-0.5 text-[10px]" style={{ color: "var(--text-muted)" }}>
          Data: MITRE ATT&CK® · D3FEND™
        </div>
      </div>

      <AboutDialog open={aboutOpen} onClose={() => setAboutOpen(false)} />
    </nav>
  );
}

function SortButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="px-2 py-1 text-[11px] font-medium transition-colors"
      style={{
        color: active ? "var(--text-primary)" : "var(--text-muted)",
        backgroundColor: active ? "var(--bg-raised)" : "transparent",
        border: "1px solid",
        borderColor: active ? "var(--border-default)" : "transparent",
        borderRadius: 4,
      }}
    >
      {children}
    </button>
  );
}

interface ActorRowProps {
  group: AttackGroupSummary;
  selected: boolean;
  active: boolean;
  showSponsor: boolean;
}

const ActorRow = forwardRef<HTMLAnchorElement, ActorRowProps>(
  ({ group, selected, active, showSponsor }, ref) => {
    return (
      <Link
        ref={ref}
        to={`/actor/${group.attackId}`}
        className="block px-3 py-1.5 transition-colors"
        style={{
          backgroundColor: selected || active ? "var(--bg-raised)" : "transparent",
          borderLeft: selected ? "2px solid var(--accent-primary)" : "2px solid transparent",
        }}
        onMouseEnter={(e) => {
          if (!selected) e.currentTarget.style.backgroundColor = "var(--bg-raised)";
        }}
        onMouseLeave={(e) => {
          if (!selected && !active) e.currentTarget.style.backgroundColor = "transparent";
        }}
      >
        <div className="flex items-baseline justify-between gap-2">
          <span className="mono text-[11px]" style={{ color: "var(--text-muted)" }}>
            {group.attackId}
          </span>
          <span
            className="text-[11px] tabular-nums"
            style={{ color: "var(--text-muted)" }}
            title={`${group.techniqueCount} techniques`}
          >
            {group.techniqueCount}
          </span>
        </div>
        <div className="truncate text-[13px] font-medium" style={{ color: "var(--text-primary)" }}>
          {group.name}
        </div>
        {showSponsor && group.sponsor && (
          <div className="mt-0.5 text-[10px]" style={{ color: "var(--accent-primary)" }}>
            ◆ {group.sponsor}
          </div>
        )}
      </Link>
    );
  },
);
ActorRow.displayName = "ActorRow";

function SidebarSkeleton() {
  return (
    <div className="px-3">
      <p className="py-2 text-[12px]" style={{ color: "var(--text-muted)" }}>
        Loading ATT&CK dataset…
      </p>
      <div className="space-y-2">
        {Array.from({ length: 12 }).map((_, i) => (
          <div
            key={i}
            className="animate-pulse"
            style={{ height: 30, backgroundColor: "var(--bg-raised)", borderRadius: 4 }}
          />
        ))}
      </div>
    </div>
  );
}
