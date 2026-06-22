import {
  Bar,
  BarChart,
  Cell,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type TooltipProps,
} from "recharts";
import { getTactic } from "../../data/tacticMeta";
import type { AttackGroupDetail, TacticCount } from "../../data/types";

interface TacticPhaseBarProps {
  detail: AttackGroupDetail;
  /** Click a bar to jump to that tactic in the technique browser. */
  onSelectTactic: (tacticId: string) => void;
}

interface ChartDatum extends TacticCount {
  color: string;
}

function PhaseTooltip({
  active,
  payload,
  total,
}: TooltipProps<number, string> & { total: number }) {
  if (!active || !payload || payload.length === 0) return null;
  const datum = payload[0].payload as ChartDatum;
  const pct = total > 0 ? Math.round((datum.count / total) * 100) : 0;
  return (
    <div
      className="px-2.5 py-1.5 text-[12px]"
      style={{
        backgroundColor: "var(--bg-overlay)",
        border: "1px solid var(--border-default)",
        borderRadius: 4,
      }}
    >
      <div className="flex items-center gap-2">
        <span
          className="inline-block h-2 w-2"
          style={{ backgroundColor: datum.color, borderRadius: 2 }}
        />
        <span style={{ color: "var(--text-primary)" }}>{datum.tacticName}</span>
      </div>
      <div className="mt-1 mono text-[11px]" style={{ color: "var(--text-secondary)" }}>
        {datum.count} {datum.count === 1 ? "technique" : "techniques"} · {pct}% of total
        {datum.count > 0 && " · click to view"}
      </div>
    </div>
  );
}

export function TacticPhaseBar({ detail, onSelectTactic }: TacticPhaseBarProps) {
  const total = detail.techniqueUses.length;
  const data: ChartDatum[] = detail.tacticProfile.map((t) => ({
    ...t,
    color: getTactic(t.tacticId)?.color ?? "var(--text-muted)",
  }));

  return (
    <section className="px-4 py-6 md:px-8" style={{ borderBottom: "1px solid var(--border-default)" }}>
      <h2 className="data-label mb-4">Tactic Phase Profile</h2>

      {/* Scrolls horizontally when the 15 tactic labels can't fit (mobile);
          at >= 720px wide it renders full-width exactly as before. */}
      <div className="overflow-x-auto">
        <div style={{ width: "100%", minWidth: 720, height: 240 }}>
        <ResponsiveContainer>
          <BarChart data={data} margin={{ top: 4, right: 0, bottom: 0, left: -24 }} barCategoryGap="12%">
            <CartesianGrid vertical={false} stroke="var(--border-subtle)" strokeDasharray="0" />
            <XAxis
              dataKey="displayName"
              tickLine={false}
              axisLine={{ stroke: "var(--border-default)" }}
              interval={0}
              tick={{ fill: "var(--text-muted)", fontSize: 10 }}
              height={28}
            />
            <YAxis
              allowDecimals={false}
              tickLine={false}
              axisLine={false}
              tick={{ fill: "var(--text-muted)", fontSize: 10 }}
              width={40}
            />
            <Tooltip cursor={{ fill: "var(--bg-raised)" }} content={<PhaseTooltip total={total} />} />
            <Bar
              dataKey="count"
              isAnimationActive={false}
              radius={[2, 2, 0, 0]}
              onClick={(entry: ChartDatum) => {
                if (entry.count > 0) onSelectTactic(entry.tacticId);
              }}
            >
              {data.map((d) => (
                <Cell
                  key={d.tacticId}
                  fill={d.color}
                  cursor={d.count > 0 ? "pointer" : "default"}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        </div>
      </div>
    </section>
  );
}
