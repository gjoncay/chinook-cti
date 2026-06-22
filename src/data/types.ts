export interface Reference {
  sourceName: string;
  description?: string;
  url: string;
}

export interface AttackGroup {
  id: string;
  attackId: string; // e.g. "G0016"
  name: string;
  aliases: string[];
  description: string;
  url: string;
  created: string;
  modified: string;
  revoked: boolean;
  sponsor: string | null; // attributed nation/state, derived from description
  references: Reference[];
}

export interface TechniqueUse {
  techniqueId: string; // e.g. "T1566.001"
  techniqueName: string;
  tacticPhases: string[]; // e.g. ["initial-access"]
  description: string; // group-specific use description from STIX relationship
  isSubtechnique: boolean;
  parentId?: string;
  parentName?: string;
  url: string; // link to the technique on attack.mitre.org
  platforms: string[]; // x_mitre_platforms — the systems this technique targets
}

export interface AttackSoftware {
  id: string;
  attackId: string; // e.g. "S0154"
  name: string;
  softwareType: "malware" | "tool";
  description: string;
  url: string;
  references: Reference[];
}

export interface AttackCampaign {
  id: string;
  attackId: string; // e.g. "C0001"
  name: string;
  description: string;
  firstSeen?: string;
  lastSeen?: string;
  url: string;
  references: Reference[];
}

export interface TacticCount {
  tacticId: string;
  tacticName: string;
  displayName: string;
  count: number;
  phase: number; // 1–14 for ordering
}

export interface PlatformCount {
  name: string;
  count: number;
}

export interface AttackGroupDetail extends AttackGroup {
  techniqueUses: TechniqueUse[];
  software: AttackSoftware[];
  campaigns: AttackCampaign[];
  tacticProfile: TacticCount[];
  platforms: PlatformCount[]; // aggregated victim systems across all techniques
}

export interface AttackTechnique {
  id: string;
  attackId: string; // e.g. "T1566.001"
  name: string;
  description: string;
  tacticPhases: string[];
  isSubtechnique: boolean;
  parentId?: string;
  parentName?: string;
  url: string;
}

/** Lightweight row model for the sidebar list. */
export interface AttackGroupSummary {
  id: string;
  attackId: string;
  name: string;
  aliases: string[];
  techniqueCount: number;
  sponsor: string | null;
}
