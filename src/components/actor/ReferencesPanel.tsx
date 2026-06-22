import type { Reference } from "../../data/types";
import { ReferenceList } from "../shared/ReferenceList";

interface ReferencesPanelProps {
  references: Reference[];
}

export function ReferencesPanel({ references }: ReferencesPanelProps) {
  return (
    <section className="px-4 py-6 md:px-8">
      <div className="mb-4 flex items-baseline gap-2">
        <h2 className="data-label">Sources</h2>
        <span className="text-[11px] tabular-nums" style={{ color: "var(--text-muted)" }}>
          {references.length}
        </span>
      </div>
      {references.length === 0 ? (
        <p className="text-[13px]" style={{ color: "var(--text-muted)" }}>
          No source references listed in the ATT&CK dataset.
        </p>
      ) : (
        <div className="max-w-[80ch]">
          <ReferenceList references={references} />
        </div>
      )}
    </section>
  );
}
