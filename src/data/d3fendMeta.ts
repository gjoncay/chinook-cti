export interface D3fendTacticMeta {
  /** Matches D3FEND's def_tactic_label exactly. */
  name: string;
  color: string;
  /** 1–7 D3FEND matrix order. */
  order: number;
}

/** The seven D3FEND defensive tactics, in matrix order. */
export const D3FEND_TACTICS: D3fendTacticMeta[] = [
  { name: "Model", color: "var(--d3f-model)", order: 1 },
  { name: "Harden", color: "var(--d3f-harden)", order: 2 },
  { name: "Detect", color: "var(--d3f-detect)", order: 3 },
  { name: "Isolate", color: "var(--d3f-isolate)", order: 4 },
  { name: "Deceive", color: "var(--d3f-deceive)", order: 5 },
  { name: "Evict", color: "var(--d3f-evict)", order: 6 },
  { name: "Restore", color: "var(--d3f-restore)", order: 7 },
];

const BY_NAME = new Map(D3FEND_TACTICS.map((t) => [t.name, t]));

export function getD3fendTactic(name: string): D3fendTacticMeta | undefined {
  return BY_NAME.get(name);
}
