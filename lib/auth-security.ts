import type { User } from "@supabase/supabase-js";

export const SIGNUP_BONUS_CREDITS = 50;
export const SIGNUP_DEVICE_COOKIE = "zs_device_id";
export const EMAIL_VERIFICATION_REQUIRED_MESSAGE = "Check your email to verify your account before signing in.";
export const SIGNUP_BONUS_PENDING_MESSAGE = "Check your email to verify your account. Your 50 free credits will be added after verification.";
export const VERIFIED_ACCOUNT_REQUIRED_MESSAGE = "Verify your email before accessing your Zanscope workspace.";

export function isEmailVerified(user?: Pick<User, "email_confirmed_at" | "confirmed_at"> | null) {
  return Boolean(user?.email_confirmed_at || user?.confirmed_at);
}

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizeEmail(email));
}

export function evaluateSignupAttemptLimits(ipHourCount: number, ipDayCount: number, deviceDayCount: number) {
  if (ipHourCount >= 3 || ipDayCount >= 5 || deviceDayCount >= 2) {
    return {
      allowed: false,
      message: "Too many signup attempts. Please wait before trying again."
    };
  }

  return { allowed: true };
}
