import { removeBackground, type Config } from "@imgly/background-removal";

export type BgRemovalProgress = (message: string) => void;

/**
 * Client-side background removal; returns a transparent PNG {@link Blob}.
 * First run may spend several seconds loading WASM / models.
 */
export async function processImage(file: File, onProgress?: BgRemovalProgress): Promise<Blob> {
  onProgress?.("Loading AI engine (WASM) — this can take 5–10 seconds…");
  const config: Config = {
    progress: (_key, current, total) => {
      onProgress?.(`AI is analyzing pixels… (${current}/${total})`);
    },
  };
  return removeBackground(file, config);
}
