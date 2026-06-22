import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getGroupSummaries, getTopLevelTechniques } from "../../data/attackClient";
import { SearchInput } from "../shared/SearchInput";

interface Result {
  kind: "actor" | "technique";
  id: string;
  label: string;
  sub: string;
  navTo?: string;
  url?: string;
}

/** Type-ahead launcher across threat actors and top-level techniques. */
export function QuickSearch() {
  const navigate = useNavigate();
  const [q, setQ] = useState("");

  const results = useMemo<Result[]>(() => {
    const query = q.trim().toLowerCase();
    if (query.length < 2) return [];
    const actors = getGroupSummaries()
      .filter(
        (g) =>
          g.name.toLowerCase().includes(query) ||
          g.attackId.toLowerCase().includes(query) ||
          g.aliases.some((a) => a.toLowerCase().includes(query)),
      )
      .slice(0, 6)
      .map<Result>((g) => ({
        kind: "actor",
        id: g.attackId,
        label: g.name,
        sub: g.attackId,
        navTo: `/actor/${g.attackId}`,
      }));
    const techs = getTopLevelTechniques()
      .filter((t) => t.name.toLowerCase().includes(query) || t.attackId.toLowerCase().includes(query))
      .slice(0, 6)
      .map<Result>((t) => ({ kind: "technique", id: t.attackId, label: t.name, sub: t.attackId, url: t.url }));
    return [...actors, ...techs];
  }, [q]);

  function go(r: Result) {
    if (r.navTo) navigate(r.navTo);
    else if (r.url && /^https?:\/\//i.test(r.url)) window.open(r.url, "_blank", "noopener,noreferrer");
  }

  return (
    <div className="relative w-full max-w-[420px]">
      <SearchInput
        value={q}
        placeholder="Search actors or techniques…"
        onChange={(e) => setQ(e.target.value)}
        aria-label="Search actors or techniques"
      />
      {results.length > 0 && (
        <div
          className="absolute z-20 mt-1 w-full overflow-hidden rounded-md"
          style={{
            border: "1px solid var(--border-default)",
            backgroundColor: "var(--bg-overlay)",
            boxShadow: "var(--shadow-card)",
          }}
        >
          {results.map((r) => (
            <button
              key={`${r.kind}-${r.id}`}
              type="button"
              onClick={() => go(r)}
              className="flex w-full items-center justify-between gap-3 px-3 py-1.5 text-left transition-colors hover:bg-[var(--bg-raised)]"
            >
              <span className="flex min-w-0 items-baseline gap-2">
                <span className="truncate text-[13px]" style={{ color: "var(--text-primary)" }}>
                  {r.label}
                </span>
                <span className="mono shrink-0 text-[10px]" style={{ color: "var(--text-muted)" }}>
                  {r.sub}
                </span>
              </span>
              <span
                className="shrink-0 text-[10px] uppercase tracking-wide"
                style={{ color: "var(--text-muted)" }}
              >
                {r.kind}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
