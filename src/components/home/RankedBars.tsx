import { useNavigate } from "react-router-dom";
import type { RankedItem } from "../../data/dashboard";

interface Props {
  items: RankedItem[];
  /** CSS color expression for the bar fill, e.g. "var(--accent-primary)". */
  accent: string;
}

/** Horizontal ranked bars; each row links to the actor page or the MITRE page. */
export function RankedBars({ items, accent }: Props) {
  const navigate = useNavigate();
  const max = items.reduce((m, i) => Math.max(m, i.value), 1);

  function open(item: RankedItem) {
    if (item.navTo) navigate(item.navTo);
    else if (item.url && /^https?:\/\//i.test(item.url))
      window.open(item.url, "_blank", "noopener,noreferrer");
  }

  return (
    <ol className="space-y-2.5">
      {items.map((item) => {
        const clickable = Boolean(item.navTo || item.url);
        return (
          <li key={item.id}>
            <Row clickable={clickable} onClick={() => open(item)} item={item}>
              <div className="flex items-baseline justify-between gap-3">
                <span className="flex min-w-0 items-baseline gap-2">
                  <span
                    className={`truncate text-[13px] font-medium ${clickable ? "transition-colors group-hover:text-[var(--accent-primary)]" : ""}`}
                    style={{ color: "var(--text-primary)" }}
                  >
                    {item.label}
                  </span>
                  {item.sub && (
                    <span className="mono shrink-0 text-[10px]" style={{ color: "var(--text-muted)" }}>
                      {item.sub}
                    </span>
                  )}
                </span>
                <span
                  className="shrink-0 text-[12px] tabular-nums"
                  style={{ color: "var(--text-secondary)" }}
                >
                  {item.value}
                </span>
              </div>
              <div
                className="mt-1 h-1.5 w-full overflow-hidden rounded-full"
                style={{ backgroundColor: "var(--bg-raised)" }}
              >
                <div
                  className="h-full rounded-full"
                  style={{ width: `${(item.value / max) * 100}%`, backgroundColor: accent }}
                />
              </div>
            </Row>
          </li>
        );
      })}
    </ol>
  );
}

function Row({
  clickable,
  onClick,
  item,
  children,
}: {
  clickable: boolean;
  onClick: () => void;
  item: RankedItem;
  children: React.ReactNode;
}) {
  const title = item.meta ? `${item.label} · ${item.meta}` : item.label;
  if (!clickable) {
    return (
      <div className="block w-full" title={title}>
        {children}
      </div>
    );
  }
  return (
    <button type="button" onClick={onClick} className="group block w-full text-left" title={title}>
      {children}
    </button>
  );
}
