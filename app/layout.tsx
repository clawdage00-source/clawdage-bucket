import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";

import { OrganizationJsonLd } from "@/components/JsonLd";
import { Header } from "@/components/Header";
import { buildGlobalKeywords, DEFAULT_DESCRIPTION, SITE_NAME } from "@/lib/seo/brand";
import { PRODUCTION_CANONICAL_ORIGIN } from "@/lib/seo/site-defaults";
import { getSessionUser } from "@/lib/supabase/get-session-user";
import { getSiteOrigin } from "@/lib/supabase/site-url";
import type { HeaderUser } from "@/types/session";

import "./globals.css";

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

  return (
    <html lang="en" className="h-full" suppressHydrationWarning>
      <body
        className={`flex min-h-screen flex-col antialiased ${inter.className}`}
        suppressHydrationWarning
      >
        <OrganizationJsonLd siteUrl={siteUrl} />
        <Header user={headerUser} />
        <main className="flex-1">{children}</main>
      </body>
    </html>
  );
}
