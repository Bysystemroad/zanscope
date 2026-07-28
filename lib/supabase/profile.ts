import { SupabaseClient, User } from "@supabase/supabase-js";
import { authTrace } from "@/lib/auth-trace";
import { SIGNUP_BONUS_CREDITS, isEmailVerified } from "@/lib/auth-security";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export type UserProfile = {
  id: string;
  email: string;
  plan: string;
  credits: number;
  signup_bonus_granted_at?: string | null;
};

type UserProfileRow = {
  id: string;
  email: string | null;
  plan: string | null;
  credits: number | null;
  signup_bonus_granted_at?: string | null;
};

function normalizeProfile(row: UserProfileRow, user: User): UserProfile {
  return {
    id: row.id,
    email: row.email || user.email || "",
    plan: row.plan || "Free",
    credits: row.credits ?? 0,
    signup_bonus_granted_at: row.signup_bonus_granted_at || null
  };
}

async function maybeGrantSignupBonus(profileClient: SupabaseClient, user: User) {
  if (!isEmailVerified(user)) return;

  const { error } = await profileClient.rpc("grant_verified_signup_bonus", {
    p_user_id: user.id,
    p_email: user.email || "",
    p_amount: SIGNUP_BONUS_CREDITS
  });

  authTrace("profile.signup_bonus_rpc", {
    userId: user.id,
    emailVerified: true,
    error: error?.message || null
  });

  if (error) {
    throw new Error(`Could not grant verified signup credits: ${error.message}`);
  }
}

export async function createPendingSignupProfile(user: Pick<User, "id" | "email">): Promise<void> {
  const profileClient = createSupabaseAdminClient();
  const { error } = await profileClient
    .from("users")
    .insert({
      id: user.id,
      email: user.email || "",
      plan: "Free",
      credits: 0,
      signup_bonus_eligible: true
    });

  if (error && error.code !== "23505") {
    throw new Error(`Could not create pending public.users profile: ${error.message}`);
  }
}

export async function ensureUserProfile(supabase: SupabaseClient, user: User): Promise<UserProfile> {
  let profileClient = supabase;

  try {
    profileClient = createSupabaseAdminClient();
  } catch {
    profileClient = supabase;
  }

  const { data: profile, error: readError } = await profileClient
    .from("users")
    .select("id, email, plan, credits, signup_bonus_granted_at")
    .eq("id", user.id)
    .maybeSingle();

  if (readError) {
    throw new Error(`Could not read public.users profile: ${readError.message}`);
  }

  if (profile) {
    await maybeGrantSignupBonus(profileClient, user);
    const { data: refreshedProfile } = await profileClient
      .from("users")
      .select("id, email, plan, credits, signup_bonus_granted_at")
      .eq("id", user.id)
      .single();

    return normalizeProfile((refreshedProfile || profile) as UserProfileRow, user);
  }

  const { data: createdProfile, error: createError } = await profileClient
    .from("users")
    .insert({
      id: user.id,
      email: user.email || "",
      plan: "Free",
      credits: 0,
      signup_bonus_eligible: false
    })
    .select("id, email, plan, credits, signup_bonus_granted_at")
    .single();

  if (!createError && createdProfile) {
    await maybeGrantSignupBonus(profileClient, user);
    const { data: refreshedProfile } = await profileClient
      .from("users")
      .select("id, email, plan, credits, signup_bonus_granted_at")
      .eq("id", user.id)
      .single();

    return normalizeProfile((refreshedProfile || createdProfile) as UserProfileRow, user);
  }

  if (createError?.code === "23505") {
    const { data: retryProfile, error: retryError } = await profileClient
      .from("users")
      .select("id, email, plan, credits, signup_bonus_granted_at")
      .eq("id", user.id)
      .single();

    if (retryError || !retryProfile) {
      throw new Error(`Profile already existed, but could not be read: ${retryError?.message || "No profile returned"}`);
    }

    await maybeGrantSignupBonus(profileClient, user);
    const { data: refreshedProfile } = await profileClient
      .from("users")
      .select("id, email, plan, credits, signup_bonus_granted_at")
      .eq("id", user.id)
      .single();

    return normalizeProfile((refreshedProfile || retryProfile) as UserProfileRow, user);
  }

  throw new Error(`Could not create public.users profile: ${createError?.message || "No profile returned"}`);
}
