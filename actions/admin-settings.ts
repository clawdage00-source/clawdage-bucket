"use server";

import { revalidatePath } from "next/cache";

import { requireAdminAccess } from "@/lib/supabase/admin-auth";
import { createServiceRoleClient } from "@/lib/supabase/admin";

export type AdminSettingsResult =
  | { ok: true; message?: string }
  | { ok: false; message: string };

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export async function listAllowedAdmins(): Promise<
  { id: string; email: string; created_at: string }[]
> {
  await requireAdminAccess();
  const admin = createServiceRoleClient();
  if (!admin) return [];

  const { data, error } = await admin
    .from("allowed_admins")
    .select("id, email, created_at")
    .order("created_at", { ascending: true });

  if (error) {
    console.error("[admin-settings] list failed", error.message);
    return [];
  }
  return data ?? [];
}

export async function addAllowedAdminFormAction(
  _prev: AdminSettingsResult | null,
  formData: FormData,
): Promise<AdminSettingsResult> {
  await requireAdminAccess();
  const raw = String(formData.get("email") ?? "");
  const email = normalizeEmail(raw);

  if (!email || !isValidEmail(email)) {
    return { ok: false, message: "Enter a valid email address." };
  }

  const client = createServiceRoleClient();
  if (!client) {
    return { ok: false, message: "Server configuration error." };
  }

  const { error } = await client.from("allowed_admins").insert({ email });

  if (error) {
    if (error.code === "23505") {
      return { ok: false, message: "This email is already on the whitelist." };
    }
    return { ok: false, message: error.message };
  }

  revalidatePath("/admin/settings");
  return { ok: true, message: `Added ${email} to the admin whitelist.` };
}

export async function removeAllowedAdminFormAction(
  _prev: AdminSettingsResult | null,
  formData: FormData,
): Promise<AdminSettingsResult> {
  await requireAdminAccess();
  const id = String(formData.get("id") ?? "");
  const email = normalizeEmail(String(formData.get("email") ?? ""));

  if (!id) {
    return { ok: false, message: "Missing admin record." };
  }

  const client = createServiceRoleClient();
  if (!client) {
    return { ok: false, message: "Server configuration error." };
  }

  const { error } = await client.from("allowed_admins").delete().eq("id", id);

  if (error) {
    return { ok: false, message: error.message };
  }

  revalidatePath("/admin/settings");
  return { ok: true, message: `Removed ${email} from the whitelist.` };
}
