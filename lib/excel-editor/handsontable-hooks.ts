import type Handsontable from "handsontable";

type HookName = Parameters<Handsontable.Core["removeHook"]>[0];
type HookHandler = Parameters<Handsontable.Core["removeHook"]>[1];

/** Remove hooks without throwing if the grid was already destroyed. */
export function safeRemoveHook(hot: Handsontable.Core, hook: HookName, handler: HookHandler): void {
  try {
    hot.removeHook(hook, handler);
  } catch {
    /* Handsontable throws when removeHook runs after destroy(). */
  }
}

export function safeAddHook(hot: Handsontable.Core, hook: HookName, handler: HookHandler): void {
  hot.addHook(hook, handler);
}
