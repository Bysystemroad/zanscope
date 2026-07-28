import crypto from "crypto";
import { SIGNUP_DEVICE_COOKIE, evaluateSignupAttemptLimits, normalizeEmail } from "@/lib/auth-security";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const ONE_HOUR_MS = 60 * 60 * 1000;
const ONE_DAY_MS = 24 * ONE_HOUR_MS;
const RETENTION_DAYS = 30;

type SignupLimitDecision = {
  allowed: boolean;
  message?: string;
};

function hashValue(value: string) {
  const secret = process.env.SIGNUP_RATE_LIMIT_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!secret) {
    throw new Error("Signup protection is not configured.");
  }

  return crypto.createHmac("sha256", secret).update(value).digest("hex");
}

export function signupClientIp(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwardedFor || request.headers.get("x-real-ip") || request.headers.get("cf-connecting-ip") || "unknown";
}

export function getOrCreateSignupDeviceId(request: Request) {
  const cookieHeader = request.headers.get("cookie") || "";
  const existing = cookieHeader
    .split(";")
    .map((cookie) => cookie.trim())
    .find((cookie) => cookie.startsWith(`${SIGNUP_DEVICE_COOKIE}=`))
    ?.split("=")[1];

  return existing || crypto.randomUUID();
}

export function signupDeviceCookieHeader(deviceId: string) {
  return `${SIGNUP_DEVICE_COOKIE}=${encodeURIComponent(deviceId)}; Path=/; Max-Age=${60 * 60 * 24 * 365}; SameSite=Lax; Secure; HttpOnly`;
}

export async function checkAndRecordSignupAttempt(request: Request, email: string, deviceId: string): Promise<SignupLimitDecision> {
  const supabase = createSupabaseAdminClient();
  const now = Date.now();
  const ipHash = hashValue(signupClientIp(request));
  const deviceHash = hashValue(deviceId);
  const emailHash = hashValue(normalizeEmail(email));
  const retentionCutoff = new Date(now - RETENTION_DAYS * ONE_DAY_MS).toISOString();
  const oneHourAgo = new Date(now - ONE_HOUR_MS).toISOString();
  const oneDayAgo = new Date(now - ONE_DAY_MS).toISOString();

  await supabase.from("signup_rate_limits").delete().lt("created_at", retentionCutoff);

  const [ipHour, ipDay, deviceDay] = await Promise.all([
    supabase
      .from("signup_rate_limits")
      .select("id", { count: "exact", head: true })
      .eq("hashed_ip", ipHash)
      .eq("event_type", "signup")
      .gte("created_at", oneHourAgo),
    supabase
      .from("signup_rate_limits")
      .select("id", { count: "exact", head: true })
      .eq("hashed_ip", ipHash)
      .eq("event_type", "signup")
      .gte("created_at", oneDayAgo),
    supabase
      .from("signup_rate_limits")
      .select("id", { count: "exact", head: true })
      .eq("hashed_device_id", deviceHash)
      .eq("event_type", "signup")
      .gte("created_at", oneDayAgo)
  ]);

  const limitDecision = evaluateSignupAttemptLimits(ipHour.count || 0, ipDay.count || 0, deviceDay.count || 0);
  if (!limitDecision.allowed) return limitDecision;

  const { error } = await supabase.from("signup_rate_limits").insert({
    hashed_ip: ipHash,
    hashed_device_id: deviceHash,
    email_hash: emailHash,
    event_type: "signup"
  });

  if (error) {
    throw new Error(`Could not record signup attempt: ${error.message}`);
  }

  return { allowed: true };
}
