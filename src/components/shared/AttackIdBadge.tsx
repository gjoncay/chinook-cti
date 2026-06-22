interface AttackIdBadgeProps {
  id: string;
  href?: string;
  /** Visual emphasis: "muted" (default) or "primary" tinted. */
  tone?: "muted" | "primary";
  className?: string;
}

/** ATT&CK IDs are always monospaced and visually distinct — never plain text. */
export function AttackIdBadge({ id, href, tone = "muted", className = "" }: AttackIdBadgeProps) {
  const color = tone === "primary" ? "var(--accent-primary)" : "var(--text-muted)";
  const classes = `mono inline-block text-[12px] leading-none ${className}`;

  if (href) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noreferrer"
        className={`${classes} transition-colors hover:text-[var(--text-primary)]`}
        style={{ color }}
      >
        {id}
      </a>
    );
  }

  return (
    <span className={classes} style={{ color }}>
      {id}
    </span>
  );
}
