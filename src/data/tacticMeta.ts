export interface TacticMeta {
  /** STIX phase_name / kill-chain slug, e.g. "defense-evasion" */
  tacticId: string;
  /** Full display name, e.g. "Defense Evasion" */
  tacticName: string;
  /** Abbreviated label for the phase-bar axis, e.g. "Defense" */
  displayName: string;
  /** CSS custom property reference for this tactic's color */
  color: string;
  /** 1–14 kill-chain order */
  phase: number;
}

/**
 * The 14 enterprise ATT&CK tactics in kill-chain order.
 * Colors map to the --tactic-* custom properties defined in index.css.
 * Note: the project brief omitted a color for "discovery"; --tactic-discovery
 * was added to complete the set.
 */
export const TACTICS: TacticMeta[] = [
  { tacticId: "reconnaissance", tacticName: "Reconnaissance", displayName: "Recon", color: "var(--tactic-recon)", phase: 1 },
  { tacticId: "resource-development", tacticName: "Resource Development", displayName: "Resource", color: "var(--tactic-resource)", phase: 2 },
  { tacticId: "initial-access", tacticName: "Initial Access", displayName: "Initial", color: "var(--tactic-initial)", phase: 3 },
  { tacticId: "execution", tacticName: "Execution", displayName: "Exec", color: "var(--tactic-exec)", phase: 4 },
  { tacticId: "persistence", tacticName: "Persistence", displayName: "Persist", color: "var(--tactic-persist)", phase: 5 },
  { tacticId: "privilege-escalation", tacticName: "Privilege Escalation", displayName: "PrivEsc", color: "var(--tactic-privesc)", phase: 6 },
  { tacticId: "defense-evasion", tacticName: "Defense Evasion", displayName: "Defense", color: "var(--tactic-defense)", phase: 7 },
  { tacticId: "credential-access", tacticName: "Credential Access", displayName: "Cred", color: "var(--tactic-cred)", phase: 8 },
  { tacticId: "discovery", tacticName: "Discovery", displayName: "Discov", color: "var(--tactic-discovery)", phase: 9 },
  { tacticId: "lateral-movement", tacticName: "Lateral Movement", displayName: "Lateral", color: "var(--tactic-lateral)", phase: 10 },
  { tacticId: "collection", tacticName: "Collection", displayName: "Collect", color: "var(--tactic-collect)", phase: 11 },
  { tacticId: "command-and-control", tacticName: "Command & Control", displayName: "C2", color: "var(--tactic-c2)", phase: 12 },
  { tacticId: "exfiltration", tacticName: "Exfiltration", displayName: "Exfil", color: "var(--tactic-exfil)", phase: 13 },
  { tacticId: "impact", tacticName: "Impact", displayName: "Impact", color: "var(--tactic-impact)", phase: 14 },
];

const TACTIC_BY_ID = new Map<string, TacticMeta>(TACTICS.map((t) => [t.tacticId, t]));

export function getTactic(tacticId: string): TacticMeta | undefined {
  return TACTIC_BY_ID.get(tacticId);
}

/** Sort key for an arbitrary tactic slug (unknown slugs sort last). */
export function tacticPhaseOrder(tacticId: string): number {
  return TACTIC_BY_ID.get(tacticId)?.phase ?? 99;
}
