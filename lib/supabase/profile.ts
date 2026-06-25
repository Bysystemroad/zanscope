import { SupabaseClient, User } from "@supabase/supabase-js";

export type UserProfile = {
  id: string;
  email: string;
  plan: string;
  credits: number;
};

type UserProfileRow = {
  id: string;
  email: string | null;
  plan: string | null;
  credits: number | null;
};

function normalizeProfile(row: UserProfileRow, user: User): UserProfile {
  return {
    id: row.id,
    email: row.email || user.email || "",
    plan: row.plan || "Free",
    credits: row.credits ?? 0
  };
}

export async function ensureUserProfile(supabase: SupabaseClient, user: User): Promise<UserProfile> {
  const { data: profile, error: readError } = await supabase
    .from("users")
    .select("id, email, plan, credits")
    .eq("id", user.id)
    .maybeSingle();

  if (readError) {
    throw new Error(`Could not read public.users profile: ${readError.message}`);
  }

  if (profile) {
    return normalizeProfile(profile as UserProfileRow, user);
  }

  const { data: createdProfile, error: createError } = await supabase
    .from("users")
    .insert({
      id: user.id,
      email: user.email || "",
      plan: "Free",
      credits: 100
    })
    .select("id, email, plan, credits")
    .single();

  if (!createError && createdProfile) {
    return normalizeProfile(createdProfile as UserProfileRow, user);
  }

  if (createError?.code === "23505") {
    const { data: retryProfile, error: retryError } = await supabase
      .from("users")
      .select("id, email, plan, credits")
      .eq("id", user.id)
      .single();

    if (retryError || !retryProfile) {
      throw new Error(`Profile already existed, but could not be read: ${retryError?.message || "No profile returned"}`);
    }

    return normalizeProfile(retryProfile as UserProfileRow, user);
  }

  throw new Error(`Could not create public.users profile: ${createError?.message || "No profile returned"}`);
}
