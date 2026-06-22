import { useEffect } from "react";
import { useAttackStore } from "../store/useAttackStore";

export function HomePage() {
  const status = useAttackStore((s) => s.status);
  const groups = useAttackStore((s) => s.groups);

  useEffect(() => {
    document.title = "VANTAGE — ATT&CK Intelligence Browser";
  }, []);

  return (
    <div className="flex h-full items-center justify-center px-8">
      <div className="max-w-[440px]">
        <div className="mono text-[12px]" style={{ color: "var(--text-muted)" }}>
          VANTAGE
        </div>
        <h1
          className="mt-2 text-[22px] font-semibold"
          style={{ color: "var(--text-primary)" }}
        >
          ATT&CK threat actor intelligence
        </h1>
        <p className="mt-3 text-[14px]" style={{ color: "var(--text-secondary)" }}>
          Select an actor from the index to review its tactic profile, technique
          breakdown, attributed software, and campaigns — sourced directly from the
          MITRE ATT&amp;CK STIX dataset.
        </p>
        <p className="mt-4 text-[13px]" style={{ color: "var(--text-muted)" }}>
          {status === "loading" && "Loading ATT&CK dataset…"}
          {status === "ready" && `${groups.length} tracked intrusion sets indexed.`}
          {status === "error" && "The ATT&CK dataset failed to load. Reload to retry."}
        </p>
      </div>
    </div>
  );
}
