import { useState } from "react";
import { Link, Outlet } from "react-router-dom";
import { ActorSidebar } from "./ActorSidebar";
import logoUrl from "../../assets/chinook-logo.png";

export function AppShell() {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div className="flex h-full flex-col md:flex-row" style={{ backgroundColor: "var(--bg-base)" }}>
      {/* Slim top bar — mobile only (below md). Hosts the hamburger + wordmark. */}
      <div
        className="flex shrink-0 items-center gap-3 px-3 py-2 md:hidden"
        style={{ borderBottom: "1px solid var(--border-default)", backgroundColor: "var(--bg-surface)" }}
      >
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          className="flex h-8 w-8 items-center justify-center rounded transition-colors hover:bg-[var(--bg-raised)]"
          style={{ color: "var(--text-secondary)" }}
          aria-label="Open actor navigation"
          aria-expanded={drawerOpen}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="M3 6h18M3 12h18M3 18h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
        <Link to="/" className="flex items-center gap-2" aria-label="Chinook Cyber — home">
          <img src={logoUrl} alt="" className="h-7 w-auto shrink-0" />
          <span className="text-[16px] font-bold leading-none tracking-[-0.01em]">
            <span style={{ color: "var(--text-primary)" }}>Chinook</span>
            <span style={{ color: "var(--accent-primary)" }}> Cyber</span>
          </span>
        </Link>
      </div>

      {/* Persistent sidebar — md and up, exactly as before. */}
      <aside className="hidden w-[240px] shrink-0 md:block">
        <ActorSidebar />
      </aside>

      {/* Off-canvas drawer — below md only. */}
      {drawerOpen && (
        <div className="fixed inset-0 z-40 md:hidden" role="dialog" aria-modal="true" aria-label="Actor navigation">
          <button
            type="button"
            aria-label="Close navigation"
            onClick={() => setDrawerOpen(false)}
            className="absolute inset-0"
            style={{ backgroundColor: "rgba(0,0,0,0.45)" }}
          />
          <div className="absolute inset-y-0 left-0 w-[280px] max-w-[85vw]">
            <ActorSidebar onNavigate={() => setDrawerOpen(false)} />
          </div>
        </div>
      )}

      <main className="min-h-0 min-w-0 flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
