import { TACTICS, tacticPhaseOrder } from "./tacticMeta";
import { detectSponsor } from "./attribution";
import type {
  AttackCampaign,
  AttackGroup,
  AttackGroupDetail,
  AttackGroupSummary,
  AttackSoftware,
  AttackTechnique,
  PlatformCount,
  Reference,
  TacticCount,
  TechniqueUse,
} from "./types";

const STIX_URL =
  "https://raw.githubusercontent.com/mitre/cti/master/enterprise-attack/enterprise-attack.json";

/* ------------------------------------------------------------------ *
 * Minimal STIX shapes — only the fields we read. Keeps us off `any`. *
 * ------------------------------------------------------------------ */

interface StixExternalRef {
  source_name: string;
  external_id?: string;
  url?: string;
  description?: string;
}

interface StixKillChainPhase {
  kill_chain_name: string;
  phase_name: string;
}

interface StixObject {
  type: string;
  id: string;
  name?: string;
  description?: string;
  revoked?: boolean;
  created?: string;
  modified?: string;
  aliases?: string[];
  x_mitre_aliases?: string[];
  x_mitre_is_subtechnique?: boolean;
  x_mitre_deprecated?: boolean;
  x_mitre_platforms?: string[];
  first_seen?: string;
  last_seen?: string;
  kill_chain_phases?: StixKillChainPhase[];
  external_references?: StixExternalRef[];
  // relationship fields
  source_ref?: string;
  target_ref?: string;
  relationship_type?: string;
}

interface StixBundle {
  type: string;
  objects: StixObject[];
}

/* --------------------------- Parsed model --------------------------- */

interface InternalTechnique {
  stixId: string;
  attackId: string;
  name: string;
  description: string;
  tacticPhases: string[];
  isSubtechnique: boolean;
  url: string;
  platforms: string[];
  parentStixId?: string;
}

interface ParsedData {
  groups: AttackGroup[];
  summaries: AttackGroupSummary[];
  groupByAttackId: Map<string, AttackGroup>;
  groupByStixId: Map<string, AttackGroup>;
  techniqueByStixId: Map<string, InternalTechnique>;
  techniqueByAttackId: Map<string, InternalTechnique>;
  softwareByStixId: Map<string, AttackSoftware>;
  campaignByStixId: Map<string, AttackCampaign>;
  // group stix id -> data
  techniqueUsesByGroup: Map<string, TechniqueUse[]>;
  softwareByGroup: Map<string, AttackSoftware[]>;
  campaignsByGroup: Map<string, AttackCampaign[]>;
}

let cache: ParsedData | null = null;
let loadPromise: Promise<ParsedData> | null = null;

/* ------------------------------- Helpers ------------------------------- */

function attackRef(obj: StixObject): StixExternalRef | undefined {
  return obj.external_references?.find((r) => r.source_name === "mitre-attack" && r.external_id);
}

/** External reference citations MITRE lists (source reports), excluding the ATT&CK page itself. */
function parseReferences(obj: StixObject): Reference[] {
  const seen = new Set<string>();
  const refs: Reference[] = [];
  for (const r of obj.external_references ?? []) {
    if (!r.url || r.source_name === "mitre-attack") continue;
    if (seen.has(r.url)) continue;
    seen.add(r.url);
    refs.push({ sourceName: r.source_name, description: r.description, url: r.url });
  }
  return refs;
}

function isActive(obj: StixObject): boolean {
  return obj.revoked !== true && obj.x_mitre_deprecated !== true;
}

function tacticPhasesOf(obj: StixObject): string[] {
  return (obj.kill_chain_phases ?? [])
    .filter((p) => p.kill_chain_name === "mitre-attack")
    .map((p) => p.phase_name);
}

/* ------------------------------- Parser ------------------------------- */

function parseBundle(bundle: StixBundle): ParsedData {
  const objects = Array.isArray(bundle.objects) ? bundle.objects : [];

  const techniqueByStixId = new Map<string, InternalTechnique>();
  const techniqueByAttackId = new Map<string, InternalTechnique>();
  const softwareByStixId = new Map<string, AttackSoftware>();
  const campaignByStixId = new Map<string, AttackCampaign>();
  const groupByStixId = new Map<string, AttackGroup>();
  const groupByAttackId = new Map<string, AttackGroup>();

  const relationships: StixObject[] = [];

  for (const obj of objects) {
    try {
      switch (obj.type) {
        case "attack-pattern": {
          if (!isActive(obj)) break;
          const ref = attackRef(obj);
          if (!ref?.external_id) break;
          techniqueByStixId.set(obj.id, {
            stixId: obj.id,
            attackId: ref.external_id,
            name: obj.name ?? ref.external_id,
            description: obj.description ?? "",
            tacticPhases: tacticPhasesOf(obj),
            isSubtechnique: obj.x_mitre_is_subtechnique === true,
            url: ref.url ?? "",
            platforms: obj.x_mitre_platforms ?? [],
          });
          break;
        }
        case "malware":
        case "tool": {
          if (!isActive(obj)) break;
          const ref = attackRef(obj);
          if (!ref?.external_id) break;
          softwareByStixId.set(obj.id, {
            id: obj.id,
            attackId: ref.external_id,
            name: obj.name ?? ref.external_id,
            softwareType: obj.type === "malware" ? "malware" : "tool",
            description: obj.description ?? "",
            url: ref.url ?? "",
            references: parseReferences(obj),
          });
          break;
        }
        case "campaign": {
          if (!isActive(obj)) break;
          const ref = attackRef(obj);
          if (!ref?.external_id) break;
          campaignByStixId.set(obj.id, {
            id: obj.id,
            attackId: ref.external_id,
            name: obj.name ?? ref.external_id,
            description: obj.description ?? "",
            firstSeen: obj.first_seen,
            lastSeen: obj.last_seen,
            url: ref.url ?? "",
            references: parseReferences(obj),
          });
          break;
        }
        case "intrusion-set": {
          const ref = attackRef(obj);
          if (!ref?.external_id) break;
          const name = obj.name ?? ref.external_id;
          // STIX `aliases` includes the primary name first; drop it for display.
          const aliases = (obj.aliases ?? []).filter((a) => a && a !== name);
          const description = obj.description ?? "";
          const group: AttackGroup = {
            id: obj.id,
            attackId: ref.external_id,
            name,
            aliases,
            description,
            url: ref.url ?? "",
            created: obj.created ?? "",
            modified: obj.modified ?? "",
            revoked: obj.revoked === true || obj.x_mitre_deprecated === true,
            sponsor: detectSponsor(description),
            references: parseReferences(obj),
          };
          groupByStixId.set(obj.id, group);
          groupByAttackId.set(group.attackId, group);
          break;
        }
        case "relationship": {
          relationships.push(obj);
          break;
        }
        default:
          break;
      }
    } catch (err) {
      console.error("[attackClient] failed to parse STIX object", obj.id, err);
    }
  }

  // Resolve sub-technique parents.
  for (const rel of relationships) {
    if (rel.relationship_type !== "subtechnique-of") continue;
    const child = rel.source_ref ? techniqueByStixId.get(rel.source_ref) : undefined;
    if (child && rel.target_ref) child.parentStixId = rel.target_ref;
  }

  // Index techniques by attack id once parents are known.
  for (const t of techniqueByStixId.values()) techniqueByAttackId.set(t.attackId, t);

  const techniqueUsesByGroup = new Map<string, TechniqueUse[]>();
  const softwareByGroup = new Map<string, AttackSoftware[]>();
  const campaignsByGroup = new Map<string, AttackCampaign[]>();

  for (const rel of relationships) {
    try {
      const { relationship_type: type, source_ref: src, target_ref: tgt } = rel;
      if (!src || !tgt) continue;

      if (type === "uses" && groupByStixId.has(src)) {
        // group -> technique
        const tech = techniqueByStixId.get(tgt);
        if (tech) {
          const parent = tech.parentStixId ? techniqueByStixId.get(tech.parentStixId) : undefined;
          const use: TechniqueUse = {
            techniqueId: tech.attackId,
            techniqueName: tech.name,
            tacticPhases: tech.tacticPhases,
            description: rel.description ?? "",
            isSubtechnique: tech.isSubtechnique,
            parentId: parent?.attackId,
            parentName: parent?.name,
            url: tech.url,
            platforms: tech.platforms,
          };
          const list = techniqueUsesByGroup.get(src);
          if (list) list.push(use);
          else techniqueUsesByGroup.set(src, [use]);
          continue;
        }
        // group -> software
        const sw = softwareByStixId.get(tgt);
        if (sw) {
          const list = softwareByGroup.get(src);
          if (list) list.push(sw);
          else softwareByGroup.set(src, [sw]);
        }
      } else if (type === "attributed-to" && groupByStixId.has(tgt)) {
        // campaign attributed-to group
        const campaign = campaignByStixId.get(src);
        if (campaign) {
          const list = campaignsByGroup.get(tgt);
          if (list) list.push(campaign);
          else campaignsByGroup.set(tgt, [campaign]);
        }
      }
    } catch (err) {
      console.error("[attackClient] failed to process relationship", rel.id, err);
    }
  }

  const groups = [...groupByStixId.values()]
    .filter((g) => !g.revoked)
    .sort((a, b) => a.name.localeCompare(b.name));

  const summaries: AttackGroupSummary[] = groups.map((g) => ({
    id: g.id,
    attackId: g.attackId,
    name: g.name,
    aliases: g.aliases,
    techniqueCount: dedupeUses(techniqueUsesByGroup.get(g.id) ?? []).length,
    sponsor: g.sponsor,
  }));

  return {
    groups,
    summaries,
    groupByAttackId,
    groupByStixId,
    techniqueByStixId,
    techniqueByAttackId,
    softwareByStixId,
    campaignByStixId,
    techniqueUsesByGroup,
    softwareByGroup,
    campaignsByGroup,
  };
}

/** A group can reference the same technique via multiple relationships — dedupe by technique id. */
function dedupeUses(uses: TechniqueUse[]): TechniqueUse[] {
  const seen = new Map<string, TechniqueUse>();
  for (const u of uses) {
    const existing = seen.get(u.techniqueId);
    // Prefer the entry that carries a group-specific description.
    if (!existing || (!existing.description && u.description)) seen.set(u.techniqueId, u);
  }
  return [...seen.values()];
}

/** Aggregate the victim systems targeted across all of a group's techniques. */
function buildPlatformProfile(uses: TechniqueUse[]): PlatformCount[] {
  const counts = new Map<string, number>();
  for (const use of uses) {
    for (const platform of use.platforms) {
      counts.set(platform, (counts.get(platform) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}

function buildTacticProfile(uses: TechniqueUse[]): TacticCount[] {
  const counts = new Map<string, number>();
  for (const use of uses) {
    for (const phase of use.tacticPhases) {
      counts.set(phase, (counts.get(phase) ?? 0) + 1);
    }
  }
  return TACTICS.map((t) => ({
    tacticId: t.tacticId,
    tacticName: t.tacticName,
    displayName: t.displayName,
    count: counts.get(t.tacticId) ?? 0,
    phase: t.phase,
  }));
}

/* ------------------------------- Loading ------------------------------- */

export async function loadAttackData(): Promise<void> {
  if (cache) return;
  if (!loadPromise) {
    loadPromise = (async () => {
      const res = await fetch(STIX_URL);
      if (!res.ok) {
        throw new Error(`STIX fetch failed: ${res.status} ${res.statusText}`);
      }
      const bundle = (await res.json()) as StixBundle;
      const parsed = parseBundle(bundle);
      cache = parsed;
      return parsed;
    })().catch((err) => {
      // Allow a later retry by clearing the in-flight promise.
      loadPromise = null;
      throw err;
    });
  }
  await loadPromise;
}

function requireCache(): ParsedData {
  if (!cache) throw new Error("ATT&CK data not loaded — call loadAttackData() first.");
  return cache;
}

/* ------------------------------- Public API ------------------------------- */

export function getGroups(): AttackGroup[] {
  return requireCache().groups;
}

export function getGroupSummaries(): AttackGroupSummary[] {
  return requireCache().summaries;
}

export function getGroupDetail(groupId: string): AttackGroupDetail {
  const data = requireCache();
  const group = data.groupByAttackId.get(groupId) ?? data.groupByStixId.get(groupId);
  if (!group) throw new Error(`Unknown group: ${groupId}`);

  const techniqueUses = dedupeUses(data.techniqueUsesByGroup.get(group.id) ?? []).sort(
    sortTechniqueUses,
  );

  const software = dedupeById(data.softwareByGroup.get(group.id) ?? []).sort((a, b) =>
    a.name.localeCompare(b.name),
  );

  const campaigns = dedupeById(data.campaignsByGroup.get(group.id) ?? []).sort((a, b) =>
    a.attackId.localeCompare(b.attackId),
  );

  return {
    ...group,
    techniqueUses,
    software,
    campaigns,
    tacticProfile: buildTacticProfile(techniqueUses),
    platforms: buildPlatformProfile(techniqueUses),
  };
}

export function getTechnique(techniqueId: string): AttackTechnique {
  const data = requireCache();
  const tech = data.techniqueByAttackId.get(techniqueId);
  if (!tech) throw new Error(`Unknown technique: ${techniqueId}`);
  const parent = tech.parentStixId ? data.techniqueByStixId.get(tech.parentStixId) : undefined;
  return {
    id: tech.stixId,
    attackId: tech.attackId,
    name: tech.name,
    description: tech.description,
    tacticPhases: tech.tacticPhases,
    isSubtechnique: tech.isSubtechnique,
    parentId: parent?.attackId,
    parentName: parent?.name,
    url: tech.url,
  };
}

export function getSoftwareForGroup(groupId: string): AttackSoftware[] {
  const data = requireCache();
  const group = data.groupByAttackId.get(groupId) ?? data.groupByStixId.get(groupId);
  if (!group) return [];
  return dedupeById(data.softwareByGroup.get(group.id) ?? []).sort((a, b) =>
    a.name.localeCompare(b.name),
  );
}

export function getCampaignsForGroup(groupId: string): AttackCampaign[] {
  const data = requireCache();
  const group = data.groupByAttackId.get(groupId) ?? data.groupByStixId.get(groupId);
  if (!group) return [];
  return dedupeById(data.campaignsByGroup.get(group.id) ?? []);
}

/* ------------------------------- sort utils ------------------------------- */

function dedupeById<T extends { id: string }>(items: T[]): T[] {
  const seen = new Map<string, T>();
  for (const item of items) if (!seen.has(item.id)) seen.set(item.id, item);
  return [...seen.values()];
}

/** Order technique uses by kill-chain phase, then attack id (keeps subs after parents). */
function sortTechniqueUses(a: TechniqueUse, b: TechniqueUse): number {
  const pa = Math.min(...a.tacticPhases.map(tacticPhaseOrder), 99);
  const pb = Math.min(...b.tacticPhases.map(tacticPhaseOrder), 99);
  if (pa !== pb) return pa - pb;
  return a.techniqueId.localeCompare(b.techniqueId);
}
