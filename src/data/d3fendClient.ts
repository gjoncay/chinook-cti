import { D3FEND_TACTICS } from "./d3fendMeta";
import { d3fendIdFor } from "./d3fendIds";

/**
 * MITRE D3FEND ATT&CK→countermeasure mapping. The full-mappings CSV is served
 * with permissive CORS, so the browser fetches it directly. It's ~11.7 MB, so we
 * load it lazily (first time an actor detail page mounts) and cache module-level.
 */
const CSV_URL = "https://d3fend.mitre.org/api/ontology/inference/d3fend-full-mappings.csv";

export interface Countermeasure {
  id: string; // D3FEND local name, e.g. "NetworkTrafficAnalysis"
  d3fendId: string | null; // canonical ontology ID, e.g. "D3-NTA"
  name: string; // e.g. "Network Traffic Analysis"
  tactic: string; // D3FEND defensive tactic, e.g. "Detect"
  url: string; // link to d3fend.mitre.org
}

export interface CoverageTechniqueRef {
  id: string; // ATT&CK technique id, e.g. "T1566.001"
  name: string;
  url: string;
}

export interface CoverageItem {
  countermeasure: Countermeasure;
  coverage: number; // how many of the actor's techniques this addresses
  techniques: CoverageTechniqueRef[]; // the specific ATT&CK techniques it correlates to
}

export interface CoverageTacticGroup {
  tactic: string;
  items: CoverageItem[];
}

export interface ActorCoverage {
  groups: CoverageTacticGroup[];
  totalCountermeasures: number;
  coveredTechniques: number; // actor techniques with ≥1 mapped countermeasure
  totalTechniques: number;
}

interface ParsedD3fend {
  byTechnique: Map<string, Countermeasure[]>; // off_tech_id -> deduped countermeasures
}

let cache: ParsedD3fend | null = null;
let loadPromise: Promise<ParsedD3fend> | null = null;

/** Full CSV parser honoring quoted fields, escaped quotes, and newlines in quotes. */
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cur = "";
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          quoted = false;
        }
      } else {
        cur += c;
      }
    } else if (c === '"') {
      quoted = true;
    } else if (c === ",") {
      row.push(cur);
      cur = "";
    } else if (c === "\n") {
      row.push(cur);
      rows.push(row);
      row = [];
      cur = "";
    } else if (c !== "\r") {
      cur += c;
    }
  }
  if (cur !== "" || row.length > 0) {
    row.push(cur);
    rows.push(row);
  }
  return rows;
}

function build(rows: string[][]): ParsedD3fend {
  const byTechnique = new Map<string, Map<string, Countermeasure>>();
  if (rows.length === 0) return { byTechnique: new Map() };

  const header = rows[0];
  const iTactic = header.indexOf("def_tactic_label");
  const iDef = header.indexOf("def_tech_label");
  const iOff = header.indexOf("off_tech_id");
  const iUri = header.indexOf("def_tech");
  if (iTactic < 0 || iDef < 0 || iOff < 0 || iUri < 0) {
    console.error("[d3fendClient] unexpected CSV columns", header);
    return { byTechnique: new Map() };
  }

  for (let k = 1; k < rows.length; k++) {
    const r = rows[k];
    const off = r[iOff];
    const name = r[iDef];
    const tactic = r[iTactic];
    const uri = r[iUri];
    if (!off || !name || !uri) continue;
    const id = uri.split("#")[1] ?? name;
    const cm: Countermeasure = {
      id,
      d3fendId: d3fendIdFor(id) ?? null,
      name,
      tactic,
      url: `https://d3fend.mitre.org/technique/d3f:${id}/`,
    };
    let perTech = byTechnique.get(off);
    if (!perTech) {
      perTech = new Map();
      byTechnique.set(off, perTech);
    }
    if (!perTech.has(id)) perTech.set(id, cm);
  }

  const out = new Map<string, Countermeasure[]>();
  for (const [off, perTech] of byTechnique) out.set(off, [...perTech.values()]);
  return { byTechnique: out };
}

export async function loadD3fend(): Promise<void> {
  if (cache) return;
  if (!loadPromise) {
    loadPromise = (async () => {
      const res = await fetch(CSV_URL);
      if (!res.ok) throw new Error(`D3FEND fetch failed: ${res.status} ${res.statusText}`);
      const text = await res.text();
      const parsed = build(parseCsv(text));
      cache = parsed;
      return parsed;
    })().catch((err) => {
      loadPromise = null; // allow retry
      throw err;
    });
  }
  await loadPromise;
}

export function isD3fendLoaded(): boolean {
  return cache !== null;
}

/** Countermeasures for a technique; sub-techniques fall back to their parent's mapping. */
export function getCountermeasuresForTechnique(attackId: string): Countermeasure[] {
  if (!cache) return [];
  const direct = cache.byTechnique.get(attackId);
  if (direct && direct.length > 0) return direct;
  if (attackId.includes(".")) {
    return cache.byTechnique.get(attackId.split(".")[0]) ?? [];
  }
  return [];
}

/** Aggregate + rank countermeasures across an actor's techniques, grouped by D3FEND tactic. */
export function getActorCoverage(techniques: CoverageTechniqueRef[]): ActorCoverage {
  const cmMap = new Map<string, { cm: Countermeasure; techs: Map<string, CoverageTechniqueRef> }>();
  let covered = 0;

  for (const tech of techniques) {
    const cms = getCountermeasuresForTechnique(tech.id);
    if (cms.length > 0) covered++;
    for (const cm of cms) {
      let entry = cmMap.get(cm.id);
      if (!entry) {
        entry = { cm, techs: new Map() };
        cmMap.set(cm.id, entry);
      }
      entry.techs.set(tech.id, tech);
    }
  }

  const byTactic = new Map<string, CoverageItem[]>();
  for (const { cm, techs } of cmMap.values()) {
    const techList = [...techs.values()].sort((a, b) => a.id.localeCompare(b.id));
    const item: CoverageItem = { countermeasure: cm, coverage: techList.length, techniques: techList };
    const arr = byTactic.get(cm.tactic);
    if (arr) arr.push(item);
    else byTactic.set(cm.tactic, [item]);
  }

  const groups: CoverageTacticGroup[] = D3FEND_TACTICS.map((t) => ({
    tactic: t.name,
    items: (byTactic.get(t.name) ?? []).sort(
      (a, b) => b.coverage - a.coverage || a.countermeasure.name.localeCompare(b.countermeasure.name),
    ),
  })).filter((g) => g.items.length > 0);

  return {
    groups,
    totalCountermeasures: cmMap.size,
    coveredTechniques: covered,
    totalTechniques: techniques.length,
  };
}
