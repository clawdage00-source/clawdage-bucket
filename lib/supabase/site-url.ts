import { headers } from "next/headers";

/**
 * Absolute site origin for OAuth and magic-link redirects (falls back to NEXT_PUBLIC_SITE_URL).
 */
export async function getSiteOrigin(): Promise<string> {
  const h = await headers();
  const proto = h.get("x-forwarded-proto") ?? "http";
  const forwardedHost = h.get("x-forwarded-host");
  const host = forwardedHost ?? h.get("host");
  if (host) {
    return `${proto}://${host}`;
  }
  const site = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, "");
  if (site) {
    return site;
  }
  return "http://localhost:3000";
}
