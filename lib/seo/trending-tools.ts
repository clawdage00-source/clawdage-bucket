import { MVP_TOOLS, type ToolDefinition } from "@/lib/tools-data";

/** Seasonal / high-intent tools for India — rotate by exam calendar in future */
const TRENDING_SLUGS = [
  "id-resizer",
  "passport-photo",
  "compress-pdf",
  "image-compressor",
  "e-sign",
  "image-to-pdf",
] as const;

const EXAM_SEASON_SLUGS = [
  "id-resizer",
  "passport-photo",
  "compress-pdf",
  "merge-pdf",
  "e-sign",
] as const;

export function getTrendingTools(excludeSlug?: string, limit = 6): ToolDefinition[] {
  return TRENDING_SLUGS.map((s) => MVP_TOOLS.find((t) => t.slug === s))
    .filter((t): t is ToolDefinition => Boolean(t && t.slug !== excludeSlug))
    .slice(0, limit);
}

export function getExamSeasonTools(limit = 5): ToolDefinition[] {
  return EXAM_SEASON_SLUGS.map((s) => MVP_TOOLS.find((t) => t.slug === s))
    .filter((t): t is ToolDefinition => Boolean(t))
    .slice(0, limit);
}

export function getPopularInIndiaTools(limit = 6): ToolDefinition[] {
  return MVP_TOOLS.filter((t) => t.category === "indian" || t.slug === "id-resizer" || t.slug === "passport-photo").slice(
    0,
    limit,
  );
}
