import { getTactic } from "../../data/tacticMeta";

interface TacticBadgeProps {
  tacticId: string;
  count?: number;
}

/** Tactic color dot + uppercase name; used as a technique-group header. */
export function TacticBadge({ tacticId, count }: TacticBadgeProps) {
  const tactic = getTactic(tacticId);
  const color = tactic?.color ?? "var(--text-muted)";
  const name = tactic?.tacticName ?? tacticId;

  return (
    <div className="flex items-center gap-2">
      <span
        className="inline-block h-2 w-2 shrink-0"
        style={{ backgroundColor: color, borderRadius: 2 }}
        aria-hidden
      />
      <span className="data-label" style={{ color: "var(--text-secondary)" }}>
        {name}
      </span>
      {count !== undefined && (
        <span className="text-[11px] tabular-nums" style={{ color: "var(--text-muted)" }}>
          {count}
        </span>
      )}
    </div>
  );
}
