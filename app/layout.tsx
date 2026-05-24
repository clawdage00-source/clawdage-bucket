import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import { Inter, Geist } from "next/font/google";

import { OrganizationJsonLd, WebSiteJsonLd } from "@/components/JsonLd";
import { PwaInstallPrompt } from "@/components/PwaInstallPrompt";
import { ThirdPartyAnalytics } from "@/components/ThirdPartyAnalytics";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { buildGlobalKeywords, DEFAULT_DESCRIPTION, SITE_NAME } from "@/lib/seo/brand";
import { PRODUCTION_CANONICAL_ORIGIN } from "@/lib/seo/site-defaults";
import { getSessionUser } from "@/lib/supabase/get-session-user";
import { getSiteOrigin } from "@/lib/supabase/site-url";
import type { HeaderUser } from "@/types/session";
import { AnalyticsRoot } from "@/components/analytics-root";
import { ThemeProvider } from "@/components/theme-provider";
import { Analytics } from "@vercel/analytics/next";

import "./globals.css";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
});

function metadataBaseUrl(): URL {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (raw) {
    try {
      return new URL(raw.replace(/\/$/, ""));
    } catch {
      /* fall through */
    }
  }
  return new URL(PRODUCTION_CANONICAL_ORIGIN);
}

export const metadata: Metadata = {
  metadataBase: metadataBaseUrl(),
  title: {
    default: SITE_NAME,
    template: `%s | ${SITE_NAME}`,
  },
  description: DEFAULT_DESCRIPTION,
  keywords: buildGlobalKeywords().split(", "),
  applicationName: SITE_NAME,
  authors: [{ name: SITE_NAME }],
  creator: SITE_NAME,
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  openGraph: {
    type: "website",
    locale: "en_IN",
    siteName: SITE_NAME,
    title: SITE_NAME,
    description: DEFAULT_DESCRIPTION,
    images: [
      {
        url: "/web-tab-logo.png",
        width: 512,
        height: 512,
        alt: SITE_NAME,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_NAME,
    description: DEFAULT_DESCRIPTION,
  },
  alternates: {
    types: {
      "text/plain": [{ url: "/llms.txt", title: "LLM-readable site summary" }],
    },
  },
  icons: {
    icon: [{ url: "/web-tab-logo.png", type: "image/png", sizes: "any" }],
    apple: [{ url: "/web-tab-logo.png", type: "image/png" }],
  },
  ...(process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION
    ? {
        verification: {
          google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
        },
      }
    : {}),
};

export const viewport: Viewport = {
  themeColor: "#2a1fff",
  width: "device-width",
  initialScale: 1,
};

function displayNameFromSession(
  user: NonNullable<Awaited<ReturnType<typeof getSessionUser>>>,
): string {
  const meta = user.user_metadata as Record<string, unknown> | undefined;
  for (const key of ["full_name", "name", "preferred_username"] as const) {
    const v = meta?.[key];
    if (typeof v === "string" && v.trim()) {
      return v.trim();
    }
  }
  const email = user.email;
  if (email) {
    const local = email.split("@")[0];
    if (local) {
      return local;
    }
  }
  return "Account";
}

function toHeaderUser(user: NonNullable<Awaited<ReturnType<typeof getSessionUser>>>): HeaderUser {
  const meta = user.user_metadata as Record<string, unknown> | undefined;
  const avatarUrl =
    (typeof meta?.avatar_url === "string" && meta.avatar_url) ||
    (typeof meta?.picture === "string" && meta.picture) ||
    null;
  return {
    id: user.id,
    email: user.email ?? undefined,
    displayName: displayNameFromSession(user),
    avatarUrl,
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const sessionUser = await getSessionUser();
  const headerUser = sessionUser ? toHeaderUser(sessionUser) : null;
  const siteUrl = await getSiteOrigin();
  const requestHeaders = await headers();
  const isAdminRoute = requestHeaders.get("x-admin-route") === "1";

  return (
    <html lang="en" className={cn("h-full", "font-sans", geist.variable)} suppressHydrationWarning>
      <body
        className={`flex min-h-screen flex-col bg-background text-foreground antialiased ${inter.className}`}
        suppressHydrationWarning
      >
        <ThemeProvider>
          <OrganizationJsonLd siteUrl={siteUrl} />
          <WebSiteJsonLd siteUrl={siteUrl} />
          <ThirdPartyAnalytics />
          {!isAdminRoute ? <Header user={headerUser} /> : null}
          <Analytics />
          {!isAdminRoute ? <AnalyticsRoot /> : null}
          {!isAdminRoute ? <PwaInstallPrompt /> : null}
          <main className={isAdminRoute ? "flex-1" : "flex-1 pt-14"}>{children}</main>
          {!isAdminRoute ? <Footer /> : null}
        </ThemeProvider>
      </body>
    </html>
  );
}
