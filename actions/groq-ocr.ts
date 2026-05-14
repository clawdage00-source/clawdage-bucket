"use server";

import { getProfilePlanSnapshot, userHasActivePaidPlan } from "@/lib/get-profile-plan";

const GROQ_CHAT_URL = "https://api.groq.com/openai/v1/chat/completions";

/** Groq’s current multimodal default; override with `GROQ_VISION_MODEL` (e.g. legacy vision IDs). */
const DEFAULT_VISION_MODEL = "meta-llama/llama-4-scout-17b-16e-instruct";

const OCR_JSON_PROMPT = `You are an expert OCR engine.

1) Identify the predominant natural language of the visible text in the image. Return a BCP-47 language tag (e.g. "en", "hi", "ta", "zh-Hans"). If the language cannot be determined, use "und".

2) Extract ALL text from the image, including handwritten notes. Preserve line breaks and spacing as closely as possible.

Return ONLY a valid JSON object with exactly two string keys: "language" and "text". The "text" value must be the full transcription. Do not wrap in markdown.`;

const MAX_DATA_URL_LENGTH = 5_500_000;
/** Groq: base64 image requests should stay small (docs cite ~4MB request budget). */
const MAX_APPROX_IMAGE_BYTES = 3.5 * 1024 * 1024;

export type GroqOcrActionResult =
  | { ok: true; text: string; language: string }
  | { ok: false; error: string; code?: "PRO_REQUIRED" | "NOT_CONFIGURED" | "BAD_INPUT" | "UPSTREAM" };

type GroqChatResponse = {
  choices?: { message?: { content?: string | null } }[];
  error?: { message?: string; code?: string };
};

function approxBytesFromDataUrl(dataUrl: string): number {
  const i = dataUrl.indexOf("base64,");
  if (i < 0) return Number.POSITIVE_INFINITY;
  const b64 = dataUrl.slice(i + "base64,".length);
  return Math.floor((b64.length * 3) / 4);
}

function parseGroqApiKeys(): string[] {
  const multiRaw = process.env.GROQ_API_KEYS?.trim();
  const fromMulti = multiRaw
    ? multiRaw
        .split(/[\n,;]+/g)
        .map((k) => k.trim())
        .filter(Boolean)
    : [];
  const single = process.env.GROQ_API_KEY?.trim();
  const out: string[] = [];
  const seen = new Set<string>();
  for (const k of fromMulti) {
    if (!seen.has(k)) {
      seen.add(k);
      out.push(k);
    }
  }
  if (single && !seen.has(single)) {
    out.push(single);
  }
  return out;
}

function shouldFailoverToNextKey(status: number, raw: GroqChatResponse | null): boolean {
  if (status === 429 || status === 503 || status === 502) return true;
  if (status === 401) return true;

  const msg = raw?.error?.message?.toLowerCase() ?? "";
  const code = raw?.error?.code?.toLowerCase() ?? "";
  if (
    msg.includes("rate limit") ||
    msg.includes("too many requests") ||
    msg.includes("quota") ||
    msg.includes("capacity") ||
    msg.includes("throttl") ||
    msg.includes("limit reached") ||
    code.includes("rate_limit")
  ) {
    return true;
  }
  return false;
}

function stripJsonFences(raw: string): string {
  const t = raw.trim();
  if (t.startsWith("```")) {
    const withoutOpen = t.replace(/^```(?:json)?\s*/i, "");
    return withoutOpen.replace(/\s*```$/i, "").trim();
  }
  return t;
}

function parseOcrJson(content: string): { language: string; text: string } | null {
  const s = stripJsonFences(content);
  let parsed: unknown;
  try {
    parsed = JSON.parse(s) as unknown;
  } catch {
    return null;
  }
  if (!parsed || typeof parsed !== "object") return null;
  const o = parsed as Record<string, unknown>;
  const language = typeof o.language === "string" ? o.language.trim() : "";
  if (typeof o.text !== "string") return null;
  const text = o.text;
  return { language: language || "und", text };
}

async function groqChatWithFailover(body: string): Promise<
  | { ok: true; content: string }
  | { ok: false; error: string; code: "NOT_CONFIGURED" | "UPSTREAM" }
> {
  const keys = parseGroqApiKeys();
  if (keys.length === 0) {
    return {
      ok: false,
      error:
        "Groq API is not configured (set GROQ_API_KEYS with one or more keys, or a single GROQ_API_KEY).",
      code: "NOT_CONFIGURED",
    };
  }

  let lastError = "Groq request failed.";
  let lastStatus = 0;

  for (let i = 0; i < keys.length; i += 1) {
    const apiKey = keys[i]!;

    let res: Response;
    try {
      res = await fetch(GROQ_CHAT_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body,
      });
    } catch {
      lastError = "Network error calling Groq.";
      if (i < keys.length - 1) continue;
      return { ok: false, error: lastError, code: "UPSTREAM" };
    }

    const raw = (await res.json().catch(() => null)) as GroqChatResponse | null;
    lastStatus = res.status;
    lastError = raw?.error?.message ?? `Groq request failed (${res.status})`;

    if (res.ok) {
      const text = raw?.choices?.[0]?.message?.content;
      if (typeof text === "string" && text.length > 0) {
        return { ok: true, content: text };
      }
      return { ok: false, error: "Groq returned an empty or unexpected response.", code: "UPSTREAM" };
    }

    const failover = shouldFailoverToNextKey(res.status, raw);
    const hasNext = i < keys.length - 1;

    if (failover && hasNext) {
      continue;
    }

    if (failover && !hasNext) {
      return {
        ok: false,
        error: `All configured Groq API keys are limited or unavailable. Last error: ${lastError}`,
        code: "UPSTREAM",
      };
    }

    return { ok: false, error: lastError, code: "UPSTREAM" };
  }

  return {
    ok: false,
    error: lastError || `Groq request failed (${lastStatus || "unknown"})`,
    code: "UPSTREAM",
  };
}

function validateImageInput(imageDataUrl: string): GroqOcrActionResult | null {
  if (typeof imageDataUrl !== "string" || imageDataUrl.length === 0 || imageDataUrl.length > MAX_DATA_URL_LENGTH) {
    return { ok: false, error: "Invalid or oversized image payload.", code: "BAD_INPUT" };
  }
  if (!imageDataUrl.startsWith("data:image/") || !imageDataUrl.includes("base64,")) {
    return { ok: false, error: "Expected a base64 data URL (data:image/...;base64,...).", code: "BAD_INPUT" };
  }
  if (approxBytesFromDataUrl(imageDataUrl) > MAX_APPROX_IMAGE_BYTES) {
    return {
      ok: false,
      error: "Image is too large after encoding. Try a smaller file or lower resolution.",
      code: "BAD_INPUT",
    };
  }
  return null;
}

/**
 * Pro-only: Groq vision OCR + automatic language tag (BCP-47) in one request.
 * Keys: `GROQ_API_KEYS` and/or `GROQ_API_KEY` with automatic failover on limits.
 */
export async function runGroqVisionOcrWithLang(imageDataUrl: string): Promise<GroqOcrActionResult> {
  const bad = validateImageInput(imageDataUrl);
  if (bad) return bad;

  const snapshot = await getProfilePlanSnapshot();
  if (!userHasActivePaidPlan(snapshot)) {
    return { ok: false, error: "An active pass is required for cloud AI OCR.", code: "PRO_REQUIRED" };
  }

  const model = process.env.GROQ_VISION_MODEL?.trim() || DEFAULT_VISION_MODEL;

  const body = JSON.stringify({
    model,
    temperature: 0.15,
    max_completion_tokens: 8192,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: OCR_JSON_PROMPT },
          { type: "image_url", image_url: { url: imageDataUrl } },
        ],
      },
    ],
  });

  const chat = await groqChatWithFailover(body);
  if (!chat.ok) {
    return { ok: false, error: chat.error, code: chat.code === "NOT_CONFIGURED" ? "NOT_CONFIGURED" : "UPSTREAM" };
  }

  const parsed = parseOcrJson(chat.content);
  if (!parsed) {
    return { ok: false, error: "Could not parse OCR response from Groq.", code: "UPSTREAM" };
  }

  return { ok: true, text: parsed.text.trim(), language: parsed.language };
}
