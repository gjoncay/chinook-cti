import { Outlet } from "react-router-dom";
import { ActorSidebar } from "./ActorSidebar";

export function AppShell() {
  return (
    <div className="flex h-full min-w-[1280px]" style={{ backgroundColor: "var(--bg-base)" }}>
      <aside className="w-[240px] shrink-0">
        <ActorSidebar />
      </aside>
      <main className="min-w-0 flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
