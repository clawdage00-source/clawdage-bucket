import type { Metadata } from "next";
import { Inter } from "next/font/google";

import { Header } from "@/components/Header";
import { getSessionUser } from "@/lib/supabase/get-session-user";
import type { HeaderUser } from "@/types/session";

import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "EssentialToolbox",
  description: "EssentialToolbox",
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

  return (
    <html lang="en" className="h-full">
      <body className={`flex min-h-screen flex-col antialiased ${inter.className}`}>
        <Header user={headerUser} />
        <main className="flex-1">{children}</main>
      </body>
    </html>
  );
}
