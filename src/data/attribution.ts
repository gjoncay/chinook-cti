/**
 * ATT&CK has no structured "sponsor nation" field for intrusion sets — attribution
 * lives only in the prose description. We derive it heuristically by scanning the
 * lead of the description (where MITRE states attribution, e.g. "APT29 is a threat
 * group that has been attributed to Russia's Foreign Intelligence Service (SVR)…").
 *
 * Limiting the scan to the opening sentence keeps victim/target nations (mentioned
 * later in the text) from being mistaken for the sponsor. This is a best-effort
 * signal, not ground truth.
 */

interface SponsorRule {
  name: string;
  patterns: RegExp[];
}

// Order matters: more specific nations (e.g. "North Korea") are tested before
// looser tokens. Demonyms and intelligence-service acronyms are strong signals.
const RULES: SponsorRule[] = [
  { name: "North Korea", patterns: [/north korea/, /north korean/, /\bdprk\b/, /reconnaissance general bureau/, /\brgb\b/] },
  { name: "South Korea", patterns: [/south korea/, /south korean/] },
  { name: "China", patterns: [/\bchina\b/, /chinese/, /\bprc\b/, /people'?s republic of china/, /ministry of state security/, /\bmss\b/, /people'?s liberation army/, /\bpla\b/] },
  { name: "Russia", patterns: [/\brussia\b/, /russian/, /\bgru\b/, /\bsvr\b/, /\bfsb\b/] },
  { name: "Iran", patterns: [/\biran\b/, /iranian/, /\birgc\b/, /islamic revolutionary guard/, /\bmois\b/, /ministry of intelligence/] },
  { name: "Vietnam", patterns: [/vietnam/, /vietnamese/] },
  { name: "Pakistan", patterns: [/pakistan/, /pakistani/] },
  { name: "India", patterns: [/\bindia\b/, /\bindian\b/] },
  { name: "Lebanon", patterns: [/lebanon/, /lebanese/, /hezbollah/] },
  { name: "Turkey", patterns: [/\bturkey\b/, /turkish/] },
  { name: "Syria", patterns: [/\bsyria\b/, /syrian/] },
  { name: "Nigeria", patterns: [/nigeria/, /nigerian/] },
  { name: "Belarus", patterns: [/belarus/, /belarusian/] },
];

/** Read attribution from the opening of a group's description. Returns null if none found. */
export function detectSponsor(description: string): string | null {
  if (!description) return null;
  // First sentence (or first ~280 chars) — where attribution is stated.
  const head = description.split(/(?<=\.)\s/)[0].slice(0, 280).toLowerCase();
  for (const rule of RULES) {
    if (rule.patterns.some((p) => p.test(head))) return rule.name;
  }
  return null;
}
