export type OcrWordToken = {
  text: string;
  confidence: number;
};

/** Walk Tesseract `blocks` tree and collect words in reading order (depth-first). */
export function collectWordTokensFromBlocks(blocksRoot: unknown): OcrWordToken[] {
  const out: OcrWordToken[] = [];

  const visit = (node: unknown): void => {
    if (node == null || typeof node !== "object") return;
    const o = node as Record<string, unknown>;

    if (Array.isArray(o.lines)) {
      for (const line of o.lines) {
        visit(line);
      }
      return;
    }

    if (Array.isArray(o.words)) {
      for (const w of o.words as Array<{ text?: string; confidence?: number }>) {
        const text = w.text != null ? String(w.text) : "";
        if (!text) continue;
        const confidence = typeof w.confidence === "number" && Number.isFinite(w.confidence) ? w.confidence : 0;
        out.push({ text, confidence });
      }
      return;
    }

    for (const key of ["blocks", "paragraphs", "blocklist", "pages"]) {
      const arr = o[key];
      if (Array.isArray(arr)) {
        for (const child of arr) visit(child);
      }
    }
  };

  visit(blocksRoot);
  return out;
}

/** Flatten tokens to a display string (spaces between words; preserves line breaks only if present in tokens). */
export function tokensToSpacedText(tokens: OcrWordToken[]): string {
  return tokens.map((t) => t.text).join(" ");
}
