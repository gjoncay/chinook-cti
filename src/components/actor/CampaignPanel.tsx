import type { AttackCampaign } from "../../data/types";
import { AttackIdBadge } from "../shared/AttackIdBadge";
import { excerpt } from "../../utils/text";

interface CampaignPanelProps {
  campaigns: AttackCampaign[];
}

function formatYear(value?: string): string | null {
  if (!value) return null;
  const year = value.slice(0, 4);
  return /^\d{4}$/.test(year) ? year : null;
}

function dateRange(campaign: AttackCampaign): string | null {
  const first = formatYear(campaign.firstSeen);
  const last = formatYear(campaign.lastSeen);
  if (first && last) return first === last ? first : `${first} – ${last}`;
  return first ?? last;
}

function CampaignItem({ campaign }: { campaign: AttackCampaign }) {
  const range = dateRange(campaign);
  return (
    <div className="py-2.5" style={{ borderBottom: "1px solid var(--border-subtle)" }}>
      <div className="flex items-baseline gap-2">
        <AttackIdBadge id={campaign.attackId} />
        <span className="text-[13px] font-medium" style={{ color: "var(--text-primary)" }}>
          {campaign.name}
        </span>
        <a
          href={campaign.url}
          target="_blank"
          rel="noreferrer"
          className="ml-auto shrink-0 text-[11px] transition-opacity hover:opacity-80"
          style={{ color: "var(--accent-primary)" }}
        >
          ↗ MITRE
        </a>
      </div>
      {range && (
        <div className="mono mt-0.5 text-[11px]" style={{ color: "var(--text-muted)" }}>
          {range}
        </div>
      )}
      {campaign.description && (
        <p className="mt-1 text-[12px]" style={{ color: "var(--text-secondary)" }}>
          {excerpt(campaign.description, 140)}
        </p>
      )}
    </div>
  );
}

export function CampaignPanel({ campaigns }: CampaignPanelProps) {
  return (
    <div>
      <h2 className="data-label mb-4">Attributed Campaigns</h2>
      {campaigns.length === 0 ? (
        <p className="text-[13px]" style={{ color: "var(--text-muted)" }}>
          No attributed campaigns in ATT&CK dataset
        </p>
      ) : (
        <div>
          {campaigns.map((campaign) => (
            <CampaignItem key={campaign.id} campaign={campaign} />
          ))}
        </div>
      )}
    </div>
  );
}
