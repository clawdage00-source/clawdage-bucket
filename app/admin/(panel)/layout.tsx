import { AdminShell } from "@/components/admin/admin-shell";
import { requireAdminAccess } from "@/lib/supabase/admin-auth";

export default async function AdminPanelLayout({ children }: { children: React.ReactNode }) {
  await requireAdminAccess();

  return <AdminShell>{children}</AdminShell>;
}
