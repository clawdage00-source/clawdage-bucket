export const BG_REMOVER_TOOL_NAME = "bg-remover";

export type BgRemoverEligibility = {
  /** Paid pass or freemode / unconfigured — no daily cap */
  unlimited: boolean;
  /** Count of logged removals since UTC midnight (signed-in free only) */
  usedToday: number;
  isLoggedIn: boolean;
  /** Signed-in free user may run another removal */
  allowed: boolean;
};
