import {
  getGroupSummaries,
  getPlatformUsage,
  getSoftwareUsage,
  getTopLevelTechniques,
} from "./attackClient";
import { TACTICS } from "./tacticMeta";

/* -------------------------------- rankings -------------------------------- */

export interface RankedItem {
  id: string;
  label: string;
  sub: string; // attack id
  meta?: string; // e.g. associated state
  value: number;
  navTo?: string; // internal route
  url?: string; // external MITRE link
}

/** Threat actors ranked by how many distinct techniques they're documented using. */
export function topActors(limit = 10): RankedItem[] {
  return [...getGroupSummaries()]
    .sort((a, b) => b.techniqueCount - a.techniqueCount || a.name.localeCompare(b.name))
    .slice(0, limit)
    .map((g) => ({
      id: g.attackId,
      label: g.name,
      sub: g.attackId,
      meta: g.sponsor ?? undefined,
      value: g.techniqueCount,
      navTo: `/actor/${g.attackId}`,
    }));
}

/** Top-level techniques ranked by how many tracked actors use them. */
export function topTechniques(limit = 10): RankedItem[] {
  return [...getTopLevelTechniques()]
    .sort((a, b) => b.actorCount - a.actorCount || a.attackId.localeCompare(b.attackId))
    .slice(0, limit)
    .map((t) => ({
      id: t.attackId,
      label: t.name,
      sub: t.attackId,
      value: t.actorCount,
      url: t.url,
    }));
}

/** Malware/tools used across the most tracked actors. */
export function topSoftware(limit = 8): RankedItem[] {
  return getSoftwareUsage()
    .slice(0, limit)
    .map((s) => ({
      id: s.attackId,
      label: s.name,
      sub: s.attackId,
      meta: s.softwareType,
      value: s.actorCount,
      url: s.url,
    }));
}

/** Platforms ranked by how many top-level techniques target them. */
export function topPlatforms(limit = 8): RankedItem[] {
  return getPlatformUsage()
    .slice(0, limit)
    .map((p) => ({ id: p.name, label: p.name, sub: "", value: p.techniqueCount }));
}

/* ----------------------------- ATT&CK matrix ------------------------------ */

export interface MatrixCell {
  id: string;
  name: string;
  count: number; // # actors using it
  url: string;
}

export interface MatrixColumn {
  tacticId: string;
  tacticName: string;
  color: string; // var(--tactic-*)
  cells: MatrixCell[];
}

/** Tactic columns (kill-chain order) with their top-level techniques, shaded by prevalence. */
export function tacticMatrix(): { columns: MatrixColumn[]; maxCount: number } {
  const techs = getTopLevelTechniques();
  let maxCount = 1;
  const byTactic = new Map<string, MatrixCell[]>();
  for (const t of techs) {
    if (t.actorCount > maxCount) maxCount = t.actorCount;
    for (const phase of t.tacticPhases) {
      const cell: MatrixCell = { id: t.attackId, name: t.name, count: t.actorCount, url: t.url };
      const arr = byTactic.get(phase);
      if (arr) arr.push(cell);
      else byTactic.set(phase, [cell]);
    }
  }
  const columns: MatrixColumn[] = TACTICS.map((t) => ({
    tacticId: t.tacticId,
    tacticName: t.tacticName,
    color: t.color,
    cells: (byTactic.get(t.tacticId) ?? []).sort(
      (a, b) => b.count - a.count || a.id.localeCompare(b.id),
    ),
  }));
  return { columns, maxCount };
}

/* --------------------------------- stats ---------------------------------- */

export interface DatasetStats {
  actors: number;
  techniques: number;
  tactics: number;
  states: number;
}

export function datasetStats(): DatasetStats {
  const groups = getGroupSummaries();
  const states = new Set(groups.map((g) => g.sponsor).filter((s): s is string => Boolean(s)));
  return {
    actors: groups.length,
    techniques: getTopLevelTechniques().length,
    tactics: TACTICS.length,
    states: states.size,
  };
}
