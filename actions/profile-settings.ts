"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";

export type ProfileSettingsState = { ok: true; message?: string } | { ok: false; error: string };

export async function updateProfileSettings(
  _prev: ProfileSettingsState | undefined,
  formData: FormData,
): Promise<ProfileSettingsState> {
  const fullName = String(formData.get("full_name") ?? "").trim();
  const avatarUrl = String(formData.get("avatar_url") ?? "").trim();

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
      avatar_url: avatarUrl || undefined,
    },
  });

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath("/", "layout");
  revalidatePath("/profile");
  return { ok: true, message: "Profile updated." };
}
