import { useState, type ReactNode } from "react";

interface TooltipProps {
  label: ReactNode;
  children: ReactNode;
}

/** Lightweight hover/focus tooltip — no dependencies, no portal. */
export function Tooltip({ label, children }: TooltipProps) {
  const [open, setOpen] = useState(false);

  return (
    <span
      className="relative inline-flex"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
    >
      {children}
      {open && (
        <span
          role="tooltip"
          className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-1.5 -translate-x-1/2 whitespace-nowrap px-2 py-1 text-[11px]"
          style={{
            backgroundColor: "var(--bg-overlay)",
            color: "var(--text-primary)",
            border: "1px solid var(--border-default)",
            borderRadius: 4,
          }}
        >
          {label}
        </span>
      )}
    </span>
  );
}
