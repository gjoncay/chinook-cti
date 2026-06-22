# Chinook CTI — ATT&CK Intelligence Browser

A threat-actor intelligence browser built around the **Diamond Model of Intrusion
Analysis**, sourced live from MITRE ATT&CK® and enriched with MITRE D3FEND™
defensive coverage. It reframes ATT&CK group data as adversary analysis — not a
flat directory — so you can see *how* an actor operates and *what counters it*.

![Chinook CTI — APT29 detail](docs/screenshot.png)

## Features

- **Diamond Model panel** — every actor mapped across the four core features
  (Adversary · Capability · Infrastructure · Victim) with a meta-features strip.
- **Tactic phase profile** — a Recharts bar chart of techniques across the 14
  ATT&CK tactics; click a bar to jump to that tactic.
- **Tabbed technique browser** — techniques grouped by tactic, each linking to
  its ATT&CK page, expandable for the group-specific use description.
- **Defensive coverage (D3FEND)** — countermeasures ranked by how many of the
  actor's techniques they address, grouped by D3FEND tactic; expand any
  countermeasure to see the exact ATT&CK techniques it correlates to (with D3-IDs).
- **Associated-nation grouping** — sidebar groups actors by the nation named in
  their attribution text (heuristic), with collapsible sections.
- **Software, campaigns, and sources** — attributed malware/tools, campaigns, and
  the original MITRE reference reports.

## Stack

Vite · React 18 · TypeScript (strict) · Tailwind CSS · Zustand · React Router ·
Recharts. No UI component library — every component is hand-built.

## Data

Fetched directly in the browser, cached after first load:

- **MITRE ATT&CK** — the enterprise STIX bundle.
- **MITRE D3FEND** — the full ATT&CK→countermeasure mapping (lazy-loaded on first
  actor view); D3-IDs are bundled from the D3FEND ontology.

## Develop

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # type-check + production build to dist/
npm run preview  # preview the production build
```

## Disclaimer

Chinook CTI is an independent, non-commercial project for education and research. It
is **not affiliated with, endorsed by, or sponsored by The MITRE Corporation.**
All data is © The MITRE Corporation, reproduced under the
[ATT&CK Terms of Use](https://attack.mitre.org/resources/legal-and-branding/terms-of-use/)
and the [D3FEND Terms of Use](https://d3fend.mitre.org/resources/legal/). ATT&CK®
and D3FEND™ are trademarks of The MITRE Corporation. See the in-app **About &
legal** dialog for full attribution. Some fields (e.g. associated nation) are
heuristic — always verify against the linked primary sources.
