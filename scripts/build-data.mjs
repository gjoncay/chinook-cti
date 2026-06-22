// Build-time data preprocessing for Chinook CTI.
//
// Fetches the full MITRE ATT&CK STIX bundle (~47 MB) and the MITRE D3FEND
// full-mappings CSV (~11.7 MB), then emits small TRIMMED JSON assets the app
// loads at runtime instead of the heavy remote sources:
//   - public/data/attack.json  : STIX objects/fields parseBundle() consumes.
//   - public/data/d3fend.json  : precomputed off_tech_id -> countermeasures[].
//
// Node built-ins only (global fetch + node:fs / node:path / node:zlib).

import { mkdir, writeFile, readFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { gzipSync } from "node:zlib";

const STIX_URL =
  "https://raw.githubusercontent.com/mitre/cti/master/enterprise-attack/enterprise-attack.json";
const CSV_URL = "https://d3fend.mitre.org/api/ontology/inference/d3fend-full-mappings.csv";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const OUT_DIR = join(ROOT, "public", "data");

/* -------------------------------------------------------------------------- *
 * D3FEND id lookup — parsed from src/data/d3fendIds.ts so the build reuses    *
 * the exact same canonical-id table the runtime ships (single source).        *
 * -------------------------------------------------------------------------- */

async function loadD3fendIds() {
  const src = await readFile(join(ROOT, "src", "data", "d3fendIds.ts"), "utf8");
  const map = {};
  // Match `"LocalName": "D3-XXX",` entries inside the D3FEND_IDS object.
  const re = /"([^"]+)"\s*:\s*"([^"]+)"/g;
  let m;
  while ((m = re.exec(src)) !== null) {
    // Skip anything that isn't a D3-* identifier (defensive against header text).
    if (/^D3-/.test(m[2])) map[m[1]] = m[2];
  }
  return map;
}

/* ----------------------------------- ATT&CK ---------------------------------- */

// Only the STIX object types parseBundle() consumes.
const KEPT_TYPES = new Set([
  "intrusion-set",
  "attack-pattern",
  "malware",
  "tool",
  "campaign",
  "relationship",
]);

// Only the fields parseBundle() (+ helpers parseReferences/attackRef) read.
function trimStixObject(obj) {
  const out = { type: obj.type, id: obj.id };
  if (obj.name !== undefined) out.name = obj.name;
  if (obj.description !== undefined) out.description = obj.description;
  if (obj.revoked !== undefined) out.revoked = obj.revoked;
  if (obj.x_mitre_deprecated !== undefined) out.x_mitre_deprecated = obj.x_mitre_deprecated;
  if (obj.x_mitre_is_subtechnique !== undefined)
    out.x_mitre_is_subtechnique = obj.x_mitre_is_subtechnique;
  if (obj.x_mitre_platforms !== undefined) out.x_mitre_platforms = obj.x_mitre_platforms;
  if (obj.aliases !== undefined) out.aliases = obj.aliases;
  if (obj.x_mitre_aliases !== undefined) out.x_mitre_aliases = obj.x_mitre_aliases;
  if (obj.created !== undefined) out.created = obj.created;
  if (obj.modified !== undefined) out.modified = obj.modified;
  if (obj.first_seen !== undefined) out.first_seen = obj.first_seen;
  if (obj.last_seen !== undefined) out.last_seen = obj.last_seen;

  if (Array.isArray(obj.kill_chain_phases)) {
    out.kill_chain_phases = obj.kill_chain_phases.map((p) => ({
      kill_chain_name: p.kill_chain_name,
      phase_name: p.phase_name,
    }));
  }
  if (Array.isArray(obj.external_references)) {
    out.external_references = obj.external_references.map((r) => {
      const ref = { source_name: r.source_name };
      if (r.external_id !== undefined) ref.external_id = r.external_id;
      if (r.url !== undefined) ref.url = r.url;
      if (r.description !== undefined) ref.description = r.description;
      return ref;
    });
  }
  // relationship fields
  if (obj.source_ref !== undefined) out.source_ref = obj.source_ref;
  if (obj.target_ref !== undefined) out.target_ref = obj.target_ref;
  if (obj.relationship_type !== undefined) out.relationship_type = obj.relationship_type;
  return out;
}

async function buildAttack() {
  console.log(`[build-data] fetching ATT&CK STIX bundle ...`);
  const res = await fetch(STIX_URL);
  if (!res.ok) throw new Error(`STIX fetch failed: ${res.status} ${res.statusText}`);
  const raw = await res.text();
  const rawBytes = Buffer.byteLength(raw);
  const bundle = JSON.parse(raw);
  const objects = Array.isArray(bundle.objects) ? bundle.objects : [];

  const kept = [];
  let intrusionSets = 0;
  let attackPatterns = 0;
  for (const obj of objects) {
    if (!obj || !KEPT_TYPES.has(obj.type)) continue;
    try {
      kept.push(trimStixObject(obj));
      if (obj.type === "intrusion-set") intrusionSets++;
      else if (obj.type === "attack-pattern") attackPatterns++;
    } catch (err) {
      console.error("[build-data] failed to trim STIX object", obj?.id, err);
    }
  }

  const trimmed = { type: "bundle", objects: kept };
  const json = JSON.stringify(trimmed);
  await writeFile(join(OUT_DIR, "attack.json"), json);

  console.log(
    `[build-data] attack.json: ${kept.length} objects ` +
      `(${intrusionSets} intrusion-set, ${attackPatterns} attack-pattern) ` +
      `from ${objects.length} total`,
  );
  reportSize("attack.json", json, rawBytes);
  return { intrusionSets, attackPatterns, objects: kept.length };
}

/* ----------------------------------- D3FEND ---------------------------------- */

// Full CSV parser honoring quoted fields, escaped quotes, and newlines in quotes.
// (Mirrors parseCsv in src/data/d3fendClient.ts.)
function parseCsv(text) {
  const rows = [];
  let row = [];
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

// Mirrors build() in src/data/d3fendClient.ts, producing the same
// off_tech_id -> Countermeasure[] structure (deduped per technique).
function buildD3fendMap(rows, d3fendIds) {
  const byTechnique = new Map();
  if (rows.length === 0) return {};

  const header = rows[0];
  const iTactic = header.indexOf("def_tactic_label");
  const iDef = header.indexOf("def_tech_label");
  const iOff = header.indexOf("off_tech_id");
  const iUri = header.indexOf("def_tech");
  if (iTactic < 0 || iDef < 0 || iOff < 0 || iUri < 0) {
    console.error("[build-data] unexpected CSV columns", header);
    return {};
  }

  for (let k = 1; k < rows.length; k++) {
    const r = rows[k];
    const off = r[iOff];
    const name = r[iDef];
    const tactic = r[iTactic];
    const uri = r[iUri];
    if (!off || !name || !uri) continue;
    const id = uri.split("#")[1] ?? name;
    const cm = {
      id,
      d3fendId: d3fendIds[id] ?? null,
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

  const out = {};
  for (const [off, perTech] of byTechnique) out[off] = [...perTech.values()];
  return out;
}

async function buildD3fend(d3fendIds) {
  console.log(`[build-data] fetching D3FEND mappings CSV ...`);
  const res = await fetch(CSV_URL);
  if (!res.ok) throw new Error(`D3FEND fetch failed: ${res.status} ${res.statusText}`);
  const text = await res.text();
  const rawBytes = Buffer.byteLength(text);

  const byTechnique = buildD3fendMap(parseCsv(text), d3fendIds);
  const techCount = Object.keys(byTechnique).length;

  const json = JSON.stringify({ byTechnique });
  await writeFile(join(OUT_DIR, "d3fend.json"), json);

  console.log(`[build-data] d3fend.json: ${techCount} mapped ATT&CK techniques`);
  reportSize("d3fend.json", json, rawBytes);
  return { techniques: techCount };
}

/* ----------------------------------- utils ----------------------------------- */

function fmt(bytes) {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${bytes} B`;
}

function reportSize(label, json, sourceBytes) {
  const raw = Buffer.byteLength(json);
  const gz = gzipSync(json).length;
  console.log(
    `[build-data] ${label}: raw ${fmt(raw)}, gzip ${fmt(gz)} ` +
      `(source was ${fmt(sourceBytes)})`,
  );
}

/* ------------------------------------ main ----------------------------------- */

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  const d3fendIds = await loadD3fendIds();
  console.log(`[build-data] loaded ${Object.keys(d3fendIds).length} D3FEND ids`);
  await buildAttack();
  await buildD3fend(d3fendIds);
  console.log(`[build-data] done -> ${OUT_DIR}`);
}

main().catch((err) => {
  console.error("[build-data] FAILED:", err);
  process.exit(1);
});
