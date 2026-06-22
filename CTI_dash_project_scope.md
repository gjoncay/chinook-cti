Build a React + TypeScript single-page application: an ATT&CK-native threat actor intelligence browser. This is a professional tool for CTI practitioners — it must look and feel like something a senior analyst would actually open every day, not a demo or a portfolio piece. No generic dashboard chrome, no gradient hero sections, no card-grid-for-everything layouts.

---

## Design language

The aesthetic reference points are: Bloomberg Terminal (information density, zero decoration), Linear.app (spatial clarity, precise type), and a printed intelligence brief (structured hierarchy, deliberate use of negative space). The UI should feel like it was designed by someone who reads threat reports for a living.

Typography:
- Display / actor names: Inter 600 weight, tight tracking (-0.02em)
- Body / descriptions: Inter 400, 14px, line-height 1.6
- Data labels: Inter 500, 11px, uppercase, 0.08em tracking, muted color
- Monospaced (ATT&CK IDs, technique codes): JetBrains Mono or IBM Plex Mono, 12px
- Load both from Google Fonts

Color system — define as CSS custom properties on :root:

--bg-base: #0f1117;
--bg-surface: #161b27;
--bg-raised: #1e2538;
--bg-overlay: #252d3d;

--border-subtle: #ffffff0f;
--border-default: #ffffff1a;
--border-strong: #ffffff30;

--text-primary: #e8eaf0;
--text-secondary: #8b92a5;
--text-muted: #565f75;
--text-inverse: #0f1117;

--accent-primary: #4f8ef7;
--accent-glow: #4f8ef720;

--tactic-recon:    #94a3b8;
--tactic-resource: #94a3b8;
--tactic-initial:  #f97316;
--tactic-exec:     #ef4444;
--tactic-persist:  #a855f7;
--tactic-privesc:  #ec4899;
--tactic-defense:  #14b8a6;
--tactic-cred:     #f59e0b;
--tactic-lateral:  #3b82f6;
--tactic-collect:  #6366f1;
--tactic-c2:       #06b6d4;
--tactic-exfil:    #84cc16;
--tactic-impact:   #ff4444;

No gradients. No box shadows. No border-radius above 6px on any data element (use 4px default). Panels separated by 1px borders, not drop shadows. The darkness of the background is the signature — everything floats on a near-black surface that reads as serious and dense.

---

## Stack

- Vite + React 18 + TypeScript (strict mode)
- Tailwind CSS configured with the custom properties above (use CSS vars, not Tailwind color names)
- Zustand for selected actor state
- React Router v6 (two routes: / for actor list, /actor/:groupId for actor detail)
- Recharts for the tactic phase bar visualization only
- No UI component libraries — every component hand-built

---

## Data layer — MITRE ATT&CK STIX

Fetch directly from MITRE's public STIX bundle. Do not mock this data.

const STIX_URL = "https://raw.githubusercontent.com/mitre/cti/master/enterprise-attack/enterprise-attack.json";

Parse and expose these functions from src/data/attackClient.ts:
- getGroups(): AttackGroup[]
- getGroupDetail(groupId: string): AttackGroupDetail
- getTechnique(techniqueId: string): AttackTechnique
- getSoftwareForGroup(groupId: string): AttackSoftware[]
- getCampaignsForGroup(groupId: string): AttackCampaign[]

TypeScript interfaces:

interface AttackGroup {
  id: string;
  attackId: string;         // e.g. "G0016"
  name: string;
  aliases: string[];
  description: string;
  url: string;
  created: string;
  modified: string;
  revoked: boolean;
}

interface TechniqueUse {
  techniqueId: string;      // e.g. "T1566.001"
  techniqueName: string;
  tacticPhases: string[];   // e.g. ["initial-access"]
  description: string;      // group-specific use description from STIX relationship
  isSubtechnique: boolean;
  parentId?: string;
  parentName?: string;
}

interface AttackGroupDetail extends AttackGroup {
  techniqueUses: TechniqueUse[];
  software: AttackSoftware[];
  campaigns: AttackCampaign[];
  tacticProfile: TacticCount[];
}

interface AttackSoftware {
  id: string;
  attackId: string;         // e.g. "S0154"
  name: string;
  softwareType: "malware" | "tool";
  description: string;
  url: string;
}

interface AttackCampaign {
  id: string;
  attackId: string;         // e.g. "C0001"
  name: string;
  description: string;
  firstSeen?: string;
  lastSeen?: string;
  url: string;
}

interface TacticCount {
  tacticId: string;
  tacticName: string;
  displayName: string;
  count: number;
  phase: number;            // 1–14 for ordering
}

Implement a caching layer: fetch once on app load, store parsed result in a module-level variable, return cached data on subsequent calls. Show a minimal loading state (single line of muted text: "Loading ATT&CK dataset…") while fetching.

---

## Application structure

src/
  components/
    layout/
      AppShell.tsx
      ActorSidebar.tsx
    actor/
      ActorHeader.tsx
      TacticPhaseBar.tsx
      TechniqueTable.tsx
      TechniqueRow.tsx
      SoftwarePanel.tsx
      CampaignPanel.tsx
    shared/
      TacticBadge.tsx
      AttackIdBadge.tsx
      Tooltip.tsx
      SearchInput.tsx
  pages/
    HomePage.tsx
    ActorPage.tsx
  data/
    attackClient.ts
    tacticMeta.ts
    types.ts
  store/
    useAttackStore.ts
  App.tsx
  main.tsx

---

## Page layouts

### Actor sidebar (fixed, 240px wide)

- App name top-left: "ATLAS" in Inter 600 13px, --text-primary. Subtitle: "ATT&CK Intelligence Browser" in --text-muted 11px.
- Search input below: full width, --bg-raised background, no border on unfocused, --border-default on focus, 13px placeholder "Search actors or aliases…"
- Actor list: virtualized if possible with react-window, otherwise standard scroll
- Each row: ATT&CK group ID in mono --text-muted 11px, actor name --text-primary 13px 500 weight, technique count in --text-muted 11px right-aligned
- Selected row: --bg-raised background, left border 2px --accent-primary
- No avatar circles, no flags, no colored tag pills in the list — keep it dense and clean

### Actor detail page — four sections, full width

Section 1 — Actor header (not a card, just a header block):
- ATT&CK ID in mono --text-muted 12px above the name
- Actor name: Inter 600 28px --text-primary
- Aliases on one line: "Also known as:" in --text-muted, alias names in --text-secondary separated by middot ·
- Two-line description excerpt (truncated with expand toggle) in --text-secondary 14px
- Row of metadata chips: technique count, software count, campaign count, ATT&CK URL link
- Right-aligned: "View on MITRE ATT&CK ↗" link in --accent-primary 13px

Section 2 — Tactic phase profile (the signature visualization):

This is the most important visual in the app. It shows the shape of how an actor operates across the ATT&CK kill chain.

- A horizontal bar chart (Recharts BarChart) spanning full width
- X-axis: the 14 ATT&CK tactic phases in order, abbreviated display names
- Y-axis: technique count, no axis line, just gridlines in --border-subtle
- Each bar colored by its tactic phase color from the CSS variables above
- Bar width generous, gap between bars minimal
- On hover: custom tooltip showing tactic full name + technique count + percentage of this actor's total techniques
- Below the chart: a single dynamically generated sentence in --text-secondary 13px summarizing the actor's most active phase, e.g. "APT29 concentrates most heavily in Defense Evasion (23 techniques), suggesting a persistent, low-and-slow operational style."
- Generate that sentence dynamically from the data — do not hardcode it

Section 3 — Technique breakdown (primary analysis view):

- Grouped by tactic phase, phases in kill chain order
- Each tactic group header: tactic color dot + tactic name uppercase 11px 500 weight + technique count in --text-muted
- Each technique row:
  - Left: ATT&CK ID in mono 12px --text-muted, fixed 100px width column
  - Center: technique name in --text-primary 13px. Sub-techniques indented 20px with muted "└" prefix
  - Right: expand chevron
  - On expand: show the group-specific use description from the STIX relationship data (not the generic technique description) in --text-secondary 13px italic. If no group-specific description exists, show the first 200 chars of the technique description.
  - Expanded row background: --bg-raised
  - Hover state: --bg-raised background only, no other change

Section 4 — Two-column lower section:

Left column (60%): Software / tooling
- Section label: "Malware & Tools"
- Separate subsections for malware vs tools
- Each item: ATT&CK software ID in mono, name in --text-primary, type badge ("MALWARE" or "TOOL" in 10px uppercase colored), one-line description excerpt, "↗ MITRE" link

Right column (40%): Campaigns
- Section label: "Attributed campaigns"
- Each item: campaign ID in mono, name, date range if available, one-line excerpt, "↗ MITRE" link
- If no campaigns: muted text "No attributed campaigns in ATT&CK dataset"

---

## Interactions

- Clicking an actor in sidebar navigates to /actor/:groupId and scrolls to top
- All technique rows collapsed by default; clicking expands inline, no modal
- Sidebar search filters by actor name AND aliases, case-insensitive
- ATT&CK IDs in any context are monospaced and visually distinct — never plain text
- External MITRE links open in new tab
- No loading spinners — use skeleton screens: --bg-raised rectangles at correct approximate heights while data loads

---

## Quality requirements

- TypeScript strict mode, no any types
- All STIX parsing errors caught and logged, degrade gracefully
- No console warnings in production build
- Responsive to 1280px minimum width
- Keyboard navigable actor list (arrow keys, enter to select)
- Title tag updates to actor name on navigation

---

## Build order

1. Vite scaffold + dependency install + CSS custom properties in index.css
2. STIX fetch + parser in attackClient.ts — get this working and console.log a parsed group before building any UI
3. Zustand store wired to attackClient
4. AppShell + ActorSidebar with real data
5. Router setup + HomePage empty state
6. ActorHeader
7. TacticPhaseBar — do this before the technique table, it is the hardest and most important component
8. TechniqueTable + TechniqueRow with expand/collapse
9. SoftwarePanel + CampaignPanel
10. Polish pass: hover states, keyboard nav, skeleton screens, title tag updates
