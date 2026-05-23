# Clawdage SEO & Growth Audit — May 2026

## SEO improvements implemented

| Area | Status |
|------|--------|
| Homepage H1 + India positioning | Done — "India's Daily Digital Utility Platform" |
| Trust section (global) | Done — `TrustSection` on home, pricing, tools |
| 10 SEO landing pages | Done — `app/(seo-pages)/[slug]` |
| Blog system (5 guides) | Done — `app/blog` (TypeScript content; MDX-ready structure) |
| Internal linking | Done — `RelatedToolsSection`, exam utility chips, blog ↔ tool links |
| Schema | Done — Organization, WebSite, FAQ, SoftwareApplication, Article |
| Sitemap | Updated — landing pages, blog, admin excluded |
| Metadata | Homepage, pricing, landings, blog per-route |
| Canonical URLs | Via `buildToolMetadata` / `buildLandingMetadata` |

## Performance improvements

| Item | Notes |
|------|--------|
| Tool route code splitting | Existing lazy loaders retained |
| Third-party scripts | GA4 + Clarity load `afterInteractive` only when env set |
| PWA | Existing manifest + new install prompt |
| Mobile sticky CTA | Tool pages — thumb-friendly bottom bar |
| Font | Inter `display: swap` already in layout |

**Target Lighthouse 90+:** Run `npm run build && npx lighthouse https://clawdage.com --preset=mobile` after deploy. Largest wins: hero image `priority` already set; consider WebP for mascot.

## Missing opportunities

1. **merge-pdf / compress-pdf** — catalog entries without full tool UI; high-intent keywords blocked.
2. **pdf-to-excel / excel-editor** — add `tool-registry` SEO entries + `ToolJsonLd` on pages.
3. **image-to-pdf / format-converter** — wire `ToolJsonLd` + `ToolSeoContent` on dedicated pages.
4. **Hindi/regional** — architecture ready; content not started.
5. **Real testimonials** — pricing uses illustrative quotes; replace with verified user stories.
6. **OG images per tool** — still global logo only.
7. **Search Console** — set `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` in production.

## Future scaling recommendations

1. **Content velocity:** 2 landers + 1 blog/week targeting exam calendar.
2. **Programmatic SEO:** State PSC variants from `content/seo` templates.
3. **API monetization:** Rate-limited OCR/BG removal API for cafés.
4. **Accounts:** Saved presets (SSC 140×60, NEET size) tied to user profiles.
5. **Analytics:** Enable `NEXT_PUBLIC_GA_MEASUREMENT_ID` and `NEXT_PUBLIC_CLARITY_PROJECT_ID`; map `trackEvent` upload clicks to GA events.

## Environment variables

```env
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-G-KXTTDFGPTY
NEXT_PUBLIC_CLARITY_PROJECT_ID=xxxxxxxx
NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION=08e3cc052e47613f
```
