export type TrocrProgress = {
  percent: number;
  message: string;
};

const MODEL_ID = "Xenova/trocr-small-handwritten";

type ImageToTextPipeline = (input: unknown, options?: { max_new_tokens?: number }) => Promise<Array<{ generated_text: string }> | { generated_text: string }>;

let pipelinePromise: Promise<ImageToTextPipeline> | null = null;

function normalizeOutput(
  out: Array<{ generated_text: string }> | { generated_text: string },
): string {
  if (Array.isArray(out)) {
    const first = out[0];
    return first?.generated_text?.trim() ?? "";
  }
  return out.generated_text?.trim() ?? "";
}

/**
 * Loads TrOCR once per page session. Large download — call only after Pro user enables handwriting mode.
 */
export function loadHandwritingPipeline(onProgress: (p: TrocrProgress) => void): Promise<ImageToTextPipeline> {
  if (pipelinePromise) return pipelinePromise;

  pipelinePromise = (async () => {
    const { pipeline, env } = await import("@xenova/transformers");
    env.allowLocalModels = false;

    const pipe = (await pipeline("image-to-text", MODEL_ID, {
      /** Some ONNX builds are flaky in-browser; fp32 weights are larger but more compatible. */
      quantized: false,
      progress_callback: (ev: { progress?: number; status?: string; file?: string } | null | undefined) => {
        if (ev == null || typeof ev !== "object") {
          onProgress({ percent: 0, message: "Downloading AI model…" });
          return;
        }
        const raw = typeof ev.progress === "number" ? ev.progress : 0;
        const pct = Math.min(100, Math.max(0, Math.round(raw * 100)));
        const file = typeof ev.file === "string" ? ev.file.split("/").pop() ?? ev.file : "";
        const status = typeof ev.status === "string" ? ev.status : "Downloading AI model…";
        const message = file ? `${status} — ${file}` : status;
        onProgress({ percent: pct || (ev.status === "ready" ? 100 : 0), message });
      },
    })) as ImageToTextPipeline;

    onProgress({ percent: 100, message: "Handwriting model ready" });
    return pipe;
  })().catch((e) => {
    pipelinePromise = null;
    throw e;
  });

  return pipelinePromise;
}

export async function runHandwritingOcr(
  image: Blob | File | HTMLCanvasElement,
  onProgress: (p: TrocrProgress) => void,
): Promise<string> {
  const pipe = await loadHandwritingPipeline(onProgress);
  onProgress({ percent: 100, message: "Reading handwriting…" });
  const out = await pipe(image, { max_new_tokens: 256 });
  return normalizeOutput(out);
}

export function resetHandwritingPipelineCache(): void {
  pipelinePromise = null;
}
