import { create } from "zustand";
import { getGroupSummaries, loadAttackData } from "../data/attackClient";
import { loadD3fend } from "../data/d3fendClient";
import type { AttackGroupSummary } from "../data/types";

type LoadStatus = "idle" | "loading" | "ready" | "error";

interface AttackStore {
  status: LoadStatus;
  error: string | null;
  groups: AttackGroupSummary[];
  /** attackId of the actor currently in view (mirrors the route). */
  selectedGroupId: string | null;
  /** Lazily-loaded D3FEND countermeasure mappings. */
  d3fendStatus: LoadStatus;
  load: () => Promise<void>;
  loadD3fend: () => Promise<void>;
  setSelectedGroup: (attackId: string | null) => void;
}

export const useAttackStore = create<AttackStore>((set, get) => ({
  status: "idle",
  error: null,
  groups: [],
  selectedGroupId: null,
  d3fendStatus: "idle",

  load: async () => {
    const { status } = get();
    if (status === "loading" || status === "ready") return;
    set({ status: "loading", error: null });
    try {
      await loadAttackData();
      set({ status: "ready", groups: getGroupSummaries() });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error loading ATT&CK data.";
      console.error("[useAttackStore] load failed", err);
      set({ status: "error", error: message });
    }
  },

  loadD3fend: async () => {
    const { d3fendStatus } = get();
    if (d3fendStatus === "loading" || d3fendStatus === "ready") return;
    set({ d3fendStatus: "loading" });
    try {
      await loadD3fend();
      set({ d3fendStatus: "ready" });
    } catch (err) {
      console.error("[useAttackStore] D3FEND load failed", err);
      set({ d3fendStatus: "error" });
    }
  },

  setSelectedGroup: (attackId) => set({ selectedGroupId: attackId }),
}));
