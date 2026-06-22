import { useEffect, useMemo } from "react";
import { useAttackStore } from "../store/useAttackStore";
import { Panel } from "../components/home/Panel";
import { RankedBars } from "../components/home/RankedBars";
import { AttackMatrix } from "../components/home/AttackMatrix";
import { QuickSearch } from "../components/home/QuickSearch";
import {
  datasetStats,
  topActors,
  topPlatforms,
  topSoftware,
  topTechniques,
  type DatasetStats,
} from "../data/dashboard";

export function HomePage() {
  const status = useAttackStore((s) => s.status);
  const error = useAttackStore((s) => s.error);

  useEffect(() => {
    document.title = "Chinook Cyber — ATT&CK Browser";
  }, []);

  const ready = status === "ready";

  const dash = useMemo(
    () =>
      ready
        ? {
            stats: datasetStats(),
            actors: topActors(10),
            techniques: topTechniques(10),
            software: topSoftware(8),
            platforms: topPlatforms(8),
          }
        : null,
    [ready],
  );

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-[1120px] px-6 py-6">
        <header className="mb-5 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-[22px] font-semibold" style={{ color: "var(--text-primary)" }}>
              Threat landscape
            </h1>
            <p className="mt-1 max-w-[560px] text-[13px]" style={{ color: "var(--text-secondary)" }}>
              A curated view of the MITRE ATT&CK intrusion-set corpus — who's most active, which
              techniques are most common, and how it all maps across the kill chain.
            </p>
          </div>
          <QuickSearch />
        </header>

        {status === "error" ? (
          <Notice>{error ?? "The ATT&CK dataset failed to load. Reload to retry."}</Notice>
        ) : !dash ? (
          <Notice>Loading ATT&CK dataset…</Notice>
        ) : (
          <div className="space-y-4">
            <StatCards stats={dash.stats} />

            <div className="grid grid-cols-2 gap-4">
              <Panel title="Most active threat actors" subtitle="By distinct techniques observed">
                <RankedBars items={dash.actors} accent="var(--accent-primary)" />
              </Panel>
              <Panel title="Most prevalent techniques" subtitle="By number of tracked actors using them">
                <RankedBars items={dash.techniques} accent="var(--accent-secondary)" />
              </Panel>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Panel title="Most-used software & tools" subtitle="By number of tracked actors using them">
                <RankedBars items={dash.software} accent="var(--accent-primary)" />
              </Panel>
              <Panel title="Most targeted platforms" subtitle="By number of techniques that target them">
                <RankedBars items={dash.platforms} accent="var(--accent-secondary)" />
              </Panel>
            </div>

            <Panel
              title="ATT&CK coverage"
              subtitle="Top-level techniques by tactic, shaded by how many tracked actors use each · click a cell for MITRE"
            >
              <AttackMatrix />
            </Panel>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCards({ stats }: { stats: DatasetStats }) {
  const cards = [
    { label: "Threat actors", value: stats.actors },
    { label: "Top-level techniques", value: stats.techniques },
    { label: "ATT&CK tactics", value: stats.tactics },
    { label: "Associated states", value: stats.states },
  ];
  return (
    <div className="grid grid-cols-4 gap-3">
      {cards.map((c) => (
        <div
          key={c.label}
          className="rounded-lg px-4 py-3"
          style={{
            border: "1px solid var(--border-default)",
            backgroundColor: "var(--bg-surface)",
            boxShadow: "var(--shadow-card)",
          }}
        >
          <div className="text-[22px] font-semibold tabular-nums" style={{ color: "var(--text-primary)" }}>
            {c.value}
          </div>
          <div className="data-label mt-0.5">{c.label}</div>
        </div>
      ))}
    </div>
  );
}

function Notice({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="flex items-center justify-center rounded-lg px-6 py-16 text-center text-[13px]"
      style={{
        border: "1px solid var(--border-default)",
        backgroundColor: "var(--bg-surface)",
        color: "var(--text-muted)",
      }}
    >
      {children}
    </div>
  );
}
