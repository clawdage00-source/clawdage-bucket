import type { Metadata } from "next";

import { AdminLoginForm } from "@/components/admin/admin-login-form";

export const metadata: Metadata = {
  title: "Admin login",
  robots: { index: false, follow: false },
};

type PageProps = {
  searchParams: Promise<{ error?: string }>;
};

export default async function AdminLoginPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const error =
    params.error === "session_expired"
      ? "Your admin session expired due to inactivity. Please sign in again."
      : params.error
        ? decodeURIComponent(params.error)
        : undefined;

  return <AdminLoginForm initialError={error} />;
}
