import { useState } from "react";
import type { AttackSoftware } from "../../data/types";
import { AttackIdBadge } from "../shared/AttackIdBadge";
import { excerpt } from "../../utils/text";
import { ReferenceList } from "../shared/ReferenceList";

interface SoftwarePanelProps {
  software: AttackSoftware[];
}

function TypeBadge({ type }: { type: AttackSoftware["softwareType"] }) {
  const isMalware = type === "malware";
  return (
    <span
      className="data-label shrink-0"
      style={{ color: isMalware ? "var(--tactic-exec)" : "var(--accent-primary)" }}
    >
      {isMalware ? "Malware" : "Tool"}
    </span>
  );
}

function SoftwareItem({ item }: { item: AttackSoftware }) {
  const [open, setOpen] = useState(false);
  const hasRefs = item.references.length > 0;

  return (
    <div className="py-2.5" style={{ borderBottom: "1px solid var(--border-subtle)" }}>
      <div className="flex items-baseline gap-2">
        <AttackIdBadge id={item.attackId} href={item.url} />
        <span className="text-[13px] font-medium" style={{ color: "var(--text-primary)" }}>
          {item.name}
        </span>
        <TypeBadge type={item.softwareType} />
        <a
          href={item.url}
          target="_blank"
          rel="noreferrer"
          className="ml-auto shrink-0 text-[11px] transition-opacity hover:opacity-80"
          style={{ color: "var(--accent-primary)" }}
        >
          ↗ MITRE
        </a>
      </div>
      {item.description && (
        <p className="mt-1 text-[12px]" style={{ color: "var(--text-secondary)" }}>
          {excerpt(item.description, 140)}
        </p>
      )}
      {hasRefs && (
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="mt-1.5 text-[11px] transition-colors hover:text-[var(--text-primary)]"
          style={{ color: "var(--text-muted)" }}
        >
          {open ? "Hide" : "Show"} {item.references.length} reference
          {item.references.length === 1 ? "" : "s"} {open ? "▾" : "▸"}
        </button>
      )}
      {open && hasRefs && (
        <div className="mt-2 pl-1">
          <ReferenceList references={item.references} />
        </div>
      )}
    </div>
  );
}

function Subsection({ title, items }: { title: string; items: AttackSoftware[] }) {
  if (items.length === 0) return null;
  return (
    <div className="mb-5">
      <div className="mb-1 flex items-baseline gap-2">
        <span className="data-label">{title}</span>
        <span className="text-[11px] tabular-nums" style={{ color: "var(--text-muted)" }}>
          {items.length}
        </span>
      </div>
      <div>
        {items.map((item) => (
          <SoftwareItem key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
}

export function SoftwarePanel({ software }: SoftwarePanelProps) {
  const malware = software.filter((s) => s.softwareType === "malware");
  const tools = software.filter((s) => s.softwareType === "tool");

  return (
    <div>
      <h2 className="data-label mb-4">Malware &amp; Tools</h2>
      {software.length === 0 ? (
        <p className="text-[13px]" style={{ color: "var(--text-muted)" }}>
          No software attributed to this actor in the ATT&CK dataset.
        </p>
      ) : (
        <>
          <Subsection title="Malware" items={malware} />
          <Subsection title="Tools" items={tools} />
        </>
      )}
    </div>
  );
}
