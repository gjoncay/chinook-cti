import type { ReactNode } from "react";

interface PanelProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}

/** Consistent card container for the home-page sections. */
export function Panel({ title, subtitle, action, children, className = "" }: PanelProps) {
  return (
    <section
      className={`rounded-lg p-4 ${className}`}
      style={{
        border: "1px solid var(--border-default)",
        backgroundColor: "var(--bg-surface)",
        boxShadow: "var(--shadow-card)",
      }}
    >
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <div>
          <h2 className="text-[14px] font-semibold" style={{ color: "var(--text-primary)" }}>
            {title}
          </h2>
          {subtitle && (
            <p className="mt-0.5 text-[11px]" style={{ color: "var(--text-muted)" }}>
              {subtitle}
            </p>
          )}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}
