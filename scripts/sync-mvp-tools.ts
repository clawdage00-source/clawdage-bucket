/**
 * One-off sync: upserts MVP tool rows (name, slug, is_pro) to match `lib/tools-data.ts`.
 *
 * Requires `SUPABASE_SERVICE_ROLE_KEY` (never expose to the browser; add only in local .env).
 *
 * Run: `npm run db:sync-tools`
 */
import { createClient } from "@supabase/supabase-js";

import { MVP_TOOLS } from "../lib/tools-data";

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!url || !serviceKey) {
    console.error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. Add them to .env.local for this script only.",
    );
    process.exit(1);
  }

  const supabase = createClient(url, serviceKey);

  for (const tool of MVP_TOOLS) {
    const { error } = await supabase.from("tools").upsert(
      {
        name: tool.name,
        slug: tool.slug,
        is_pro: tool.is_pro,
      },
      { onConflict: "slug" },
    );
    if (error) {
      console.error(`Upsert failed for ${tool.slug}:`, error.message);
      process.exit(1);
    }
  }

  console.log(`Synced ${MVP_TOOLS.length} tools to Supabase.`);
}

main();
