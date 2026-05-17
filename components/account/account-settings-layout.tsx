import { redirect } from "next/navigation";

import { getSessionUser } from "@/lib/supabase/get-session-user";

export default async function AccountSettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSessionUser();
  if (!user) {
    redirect("/login?redirectedFrom=/account");
  }

  return children;
}
