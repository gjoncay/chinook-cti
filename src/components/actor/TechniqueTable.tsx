import { getTactic, TACTICS } from "../../data/tacticMeta";
import type { TechniqueUse } from "../../data/types";
import { TechniqueRow } from "./TechniqueRow";

interface TechniqueTableProps {
  uses: TechniqueUse[];
  /** Controlled active tactic (mirrors the phase-bar selection). */
  activeTactic: string | null;
  onTacticChange: (tacticId: string) => void;
}

interface TacticGroup {
  tacticId: string;
  uses: TechniqueUse[];
}

/** Bucket technique uses under every tactic phase they belong to, in kill-chain order. */
function groupByTactic(uses: TechniqueUse[]): TacticGroup[] {
  return TACTICS.map((t) => ({
    tacticId: t.tacticId,
    uses: uses
      .filter((u) => u.tacticPhases.includes(t.tacticId))
      .sort((a, b) => a.techniqueId.localeCompare(b.techniqueId)),
  })).filter((g) => g.uses.length > 0);
}

function Tab({
  tacticId,
  count,
  selected,
  onClick,
}: {
  tacticId: string;
  count: number;
  selected: boolean;
  onClick: () => void;
}) {
  const tactic = getTactic(tacticId);
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-2 whitespace-nowrap px-3 py-2 text-[12px] transition-colors"
      style={{
        color: selected ? "var(--text-primary)" : "var(--text-secondary)",
        backgroundColor: selected ? "var(--bg-raised)" : "transparent",
        borderBottom: selected ? "2px solid var(--accent-primary)" : "2px solid transparent",
      }}
    >
      <span
        className="inline-block h-2 w-2 shrink-0"
        style={{ backgroundColor: tactic?.color ?? "var(--text-muted)", borderRadius: 2 }}
      />
      <span className="font-medium">{tactic?.tacticName ?? tacticId}</span>
      <span className="tabular-nums" style={{ color: "var(--text-muted)" }}>
        {count}
      </span>
    </button>
  );
}

export function TechniqueTable({ uses, activeTactic, onTacticChange }: TechniqueTableProps) {
  const groups = groupByTactic(uses);

  if (groups.length === 0) {
    return (
      <section className="px-8 py-6" style={{ borderBottom: "1px solid var(--border-default)" }}>
        <h2 className="data-label mb-4">Capability · Techniques</h2>
        <p className="text-[13px]" style={{ color: "var(--text-muted)" }}>
          No techniques are attributed to this actor in the ATT&CK dataset.
        </p>
      </section>
    );
  }

  const active = groups.some((g) => g.tacticId === activeTactic)
    ? (activeTactic as string)
    : groups[0].tacticId;
  const activeGroup = groups.find((g) => g.tacticId === active) ?? groups[0];

  return (
    <section className="px-8 py-6" style={{ borderBottom: "1px solid var(--border-default)" }}>
      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="data-label">Capability · Techniques</h2>
        <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>
          {uses.length} total across {groups.length} {groups.length === 1 ? "tactic" : "tactics"}
        </span>
      </div>

      {/* Tactic tabs */}
      <div
        className="flex overflow-x-auto"
        style={{ borderBottom: "1px solid var(--border-default)" }}
        role="tablist"
        aria-label="Tactics"
      >
        {groups.map((g) => (
          <Tab
            key={g.tacticId}
            tacticId={g.tacticId}
            count={g.uses.length}
            selected={g.tacticId === active}
            onClick={() => onTacticChange(g.tacticId)}
          />
        ))}
      </div>

      {/* Techniques for the selected tactic — bounded so the page stays compact */}
      <div className="overflow-y-auto pt-1" style={{ maxHeight: 420 }} role="tabpanel">
        {activeGroup.uses.map((use) => (
          <TechniqueRow key={`${active}-${use.techniqueId}`} use={use} />
        ))}
      </div>
    </section>
  );
}
