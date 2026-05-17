"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createServiceRoleClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export type ProfileSettingsState = { ok: true; message?: string } | { ok: false; error: string };

const ACCOUNT_PATHS = ["/account", "/profile", "/subscription"] as const;

function revalidateAccountPaths() {
  for (const path of ACCOUNT_PATHS) {
    revalidatePath(path);
  }
  revalidatePath("/", "layout");
}

export async function updateProfileSettings(
  _prev: ProfileSettingsState | undefined,
  formData: FormData,
): Promise<ProfileSettingsState> {
  const fullName = String(formData.get("full_name") ?? "").trim();
  const displayName = String(formData.get("display_name") ?? "").trim();

  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return { ok: false, error: "You must be signed in." };
  }

  const { error } = await supabase.auth.updateUser({
    data: {
      full_name: fullName || undefined,
      display_name: displayName || fullName || undefined,
    },
  });

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidateAccountPaths();
  return { ok: true, message: "Profile updated." };
}

export async function signOutEverywhere(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut({ scope: "global" });
  redirect("/login");
}

export type DeleteAccountState = { ok: true } | { ok: false; error: string };

export async function deleteAccount(
  _prev: DeleteAccountState | undefined,
  formData: FormData,
): Promise<DeleteAccountState> {
  const confirm = String(formData.get("confirm") ?? "").trim();
  if (confirm !== "DELETE") {
    return { ok: false, error: 'Type "DELETE" to confirm account removal.' };
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return { ok: false, error: "You must be signed in." };
  }

  const admin = createServiceRoleClient();
  if (!admin) {
    return {
      ok: false,
      error: "Account deletion is temporarily unavailable. Please contact support.",
    };
  }

  const { error } = await admin.auth.admin.deleteUser(user.id);
  if (error) {
    return { ok: false, error: error.message };
  }

  await supabase.auth.signOut({ scope: "global" });
  redirect("/?deleted=1");
}
