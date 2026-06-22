import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { getGroupDetail } from "../data/attackClient";
import { useAttackStore } from "../store/useAttackStore";
import type { AttackGroupDetail } from "../data/types";
import { ActorHeader } from "../components/actor/ActorHeader";
import { DiamondModel } from "../components/actor/DiamondModel";
import { TacticPhaseBar } from "../components/actor/TacticPhaseBar";
import { TechniqueTable } from "../components/actor/TechniqueTable";
import { DefensiveCoverage } from "../components/actor/DefensiveCoverage";
import { SoftwarePanel } from "../components/actor/SoftwarePanel";
import { CampaignPanel } from "../components/actor/CampaignPanel";
import { ReferencesPanel } from "../components/actor/ReferencesPanel";

function ActorSkeleton() {
  return (
    <div className="px-4 py-7 md:px-8">
      <p className="text-[13px]" style={{ color: "var(--text-muted)" }}>
        Loading ATT&CK dataset…
      </p>
      <div className="mt-4 space-y-3">
        {[40, 220, 120].map((h, i) => (
          <div
            key={i}
            className="animate-pulse"
            style={{ height: h, backgroundColor: "var(--bg-raised)", borderRadius: 4 }}
          />
        ))}
      </div>
    </div>
  );
}

export function ActorPage() {
  const { groupId } = useParams<{ groupId: string }>();
  const status = useAttackStore((s) => s.status);
  const setSelectedGroup = useAttackStore((s) => s.setSelectedGroup);
  const loadD3fend = useAttackStore((s) => s.loadD3fend);

  // Lazily pull D3FEND mappings the first time an actor detail page is viewed.
  useEffect(() => {
    void loadD3fend();
  }, [loadD3fend]);

  const [activeTactic, setActiveTactic] = useState<string | null>(null);
  const techniquesRef = useRef<HTMLDivElement>(null);
  const sourcesRef = useRef<HTMLDivElement>(null);

  const detail: AttackGroupDetail | null = useMemo(() => {
    if (status !== "ready" || !groupId) return null;
    try {
      return getGroupDetail(groupId);
    } catch {
      return null;
    }
  }, [status, groupId]);

  const coverageTechniques = useMemo(
    () =>
      detail
        ? detail.techniqueUses.map((u) => ({ id: u.techniqueId, name: u.techniqueName, url: u.url }))
        : [],
    [detail],
  );

  useEffect(() => {
    setSelectedGroup(groupId ?? null);
    setActiveTactic(null); // reset tab when switching actors
  }, [groupId, setSelectedGroup]);

  useEffect(() => {
    if (detail) document.title = `${detail.name} — Chinook Cyber`;
    document.querySelector("main")?.scrollTo(0, 0);
  }, [detail]);

  function scrollTo(ref: React.RefObject<HTMLElement>) {
    ref.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function selectTactic(tacticId: string) {
    setActiveTactic(tacticId);
    scrollTo(techniquesRef);
  }

  function focusInfrastructure() {
    const hasC2 = detail?.tacticProfile.some(
      (t) => t.tacticId === "command-and-control" && t.count > 0,
    );
    if (hasC2) setActiveTactic("command-and-control");
    scrollTo(techniquesRef);
  }

  if (status === "loading" || status === "idle") return <ActorSkeleton />;

  if (status === "error") {
    return (
      <div className="px-4 py-7 md:px-8">
        <p className="text-[13px]" style={{ color: "var(--text-muted)" }}>
          The ATT&CK dataset failed to load. Reload the page to retry.
        </p>
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="px-4 py-7 md:px-8">
        <div className="mono text-[12px]" style={{ color: "var(--text-muted)" }}>
          {groupId}
        </div>
        <p className="mt-2 text-[14px]" style={{ color: "var(--text-secondary)" }}>
          No actor with this ID exists in the ATT&CK dataset.
        </p>
      </div>
    );
  }

  return (
    <article>
      <ActorHeader detail={detail} />
      <DiamondModel
        detail={detail}
        onFocusCapability={() => scrollTo(techniquesRef)}
        onFocusInfrastructure={focusInfrastructure}
        onFocusSources={() => scrollTo(sourcesRef)}
      />
      <TacticPhaseBar detail={detail} onSelectTactic={selectTactic} />

      <div ref={techniquesRef}>
        <TechniqueTable
          uses={detail.techniqueUses}
          activeTactic={activeTactic}
          onTacticChange={setActiveTactic}
        />
      </div>

      <DefensiveCoverage techniques={coverageTechniques} />

      <section className="grid grid-cols-1 lg:grid-cols-[3fr_2fr]">
        <div className="border-b px-4 py-6 md:px-8 lg:border-b-0 lg:border-r" style={{ borderColor: "var(--border-default)" }}>
          <SoftwarePanel software={detail.software} />
        </div>
        <div className="px-4 py-6 md:px-8">
          <CampaignPanel campaigns={detail.campaigns} />
        </div>
      </section>

      <div ref={sourcesRef} style={{ borderTop: "1px solid var(--border-default)" }}>
        <ReferencesPanel references={detail.references} />
      </div>
    </article>
  );
}
