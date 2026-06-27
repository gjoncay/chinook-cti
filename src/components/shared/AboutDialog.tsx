import { useEffect, type ReactNode } from "react";

interface AboutDialogProps {
  open: boolean;
  onClose: () => void;
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <h3 className="data-label mb-1.5" style={{ color: "var(--text-secondary)" }}>
        {title}
      </h3>
      <div className="space-y-2 text-[13px]" style={{ color: "var(--text-secondary)", lineHeight: 1.6 }}>
        {children}
      </div>
    </div>
  );
}

function Ext({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="transition-opacity hover:opacity-80"
      style={{ color: "var(--accent-primary)" }}
    >
      {children}
    </a>
  );
}

export function AboutDialog({ open, onClose }: AboutDialogProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-6"
      style={{ backgroundColor: "rgba(8, 10, 15, 0.72)" }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="About and legal"
    >
      <div
        className="max-h-[85vh] w-full max-w-[560px] overflow-y-auto"
        style={{
          backgroundColor: "var(--bg-surface)",
          border: "1px solid var(--border-default)",
          borderRadius: 6,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="sticky top-0 flex items-center justify-between px-6 py-4"
          style={{ backgroundColor: "var(--bg-surface)", borderBottom: "1px solid var(--border-default)" }}
        >
          <div>
            <h2 className="text-[15px] font-semibold" style={{ color: "var(--text-primary)" }}>
              About Chinook Cyber
            </h2>
            <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>
              Attribution &amp; legal
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="px-2 py-0.5 text-[18px] leading-none transition-colors hover:text-[var(--text-primary)]"
            style={{ color: "var(--text-muted)" }}
          >
            ×
          </button>
        </div>

        <div className="space-y-5 px-6 py-5">
          <Section title="Independent project">
            <p>
              Chinook Cyber is an independent, non-commercial project created by <Ext href="https://www.linkedin.com/in/grant-oncay-b340b0243">Grant Oncay</Ext> for education
              and research. It is not affiliated with, endorsed by, or sponsored by The MITRE
              Corporation, and its author derives no revenue from it.
            </p>
          </Section>

          <Section title="Data & attribution">
            <p>
              Threat-actor, technique, software, and campaign data is sourced from MITRE ATT&amp;CK®.
              © The MITRE Corporation. This work is reproduced and distributed with the permission of
              The MITRE Corporation, under the{" "}
              <Ext href="https://attack.mitre.org/resources/legal-and-branding/terms-of-use/">
                ATT&amp;CK Terms of Use
              </Ext>
              .
            </p>
            <p>
              Defensive countermeasure mappings and D3-identifiers are sourced from MITRE D3FEND™.
              © The MITRE Corporation, used under the{" "}
              <Ext href="https://d3fend.mitre.org/resources/legal/">D3FEND Terms of Use</Ext>.
            </p>
          </Section>

          <Section title="Trademarks">
            <p>
              ATT&amp;CK® and D3FEND™ are trademarks of The MITRE Corporation. All trademarks are the
              property of their respective owners and are used here only to identify the source of the
              underlying data. No claim of ownership is made over MITRE's content.
            </p>
          </Section>

          <Section title="No warranty">
            <p>
              This tool is provided “as is,” without warranty of any kind. Some fields — including the
              associated-nation grouping — are derived heuristically from MITRE text and may be
              incomplete or inaccurate. Always verify findings against the linked primary sources.
            </p>
          </Section>

          <div className="flex flex-wrap gap-x-4 gap-y-1 pt-1 text-[12px]">
            <Ext href="https://attack.mitre.org/">attack.mitre.org ↗</Ext>
            <Ext href="https://d3fend.mitre.org/">d3fend.mitre.org ↗</Ext>
            <Ext href="https://www.mitre.org/">mitre.org ↗</Ext>
          </div>

          <p className="text-[12px]" style={{ color: "var(--text-muted)", paddingTop: 4 }}>
            Created by <Ext href="https://www.linkedin.com/in/grant-oncay-b340b0243">Grant Oncay</Ext> · independent, non-commercial project.
          </p>
        </div>
      </div>
    </div>
  );
}
