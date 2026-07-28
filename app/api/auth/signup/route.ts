import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import {
  SIGNUP_BONUS_PENDING_MESSAGE,
  isEmailVerified,
  isValidEmail,
  normalizeEmail
} from "@/lib/auth-security";
import {
  checkAndRecordSignupAttempt,
  getOrCreateSignupDeviceId,
  signupDeviceCookieHeader
} from "@/lib/signup-rate-limit";
import { createPendingSignupProfile } from "@/lib/supabase/profile";

type SignupPayload = {
  email?: string;
  password?: string;
};

function responseWithDeviceCookie(payload: unknown, status: number, deviceId: string) {
  return NextResponse.json(payload, {
    status,
    headers: {
      "Set-Cookie": signupDeviceCookieHeader(deviceId)
    }
  });
}

export async function POST(request: Request) {
  const deviceId = getOrCreateSignupDeviceId(request);

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return responseWithDeviceCookie({ error: "Authentication is temporarily unavailable." }, 500, deviceId);
  }

  const payload = (await request.json()) as SignupPayload;
  const email = normalizeEmail(String(payload.email || ""));
  const password = String(payload.password || "");

  if (!isValidEmail(email) || password.length < 6) {
    return responseWithDeviceCookie({ error: "Enter a valid email and a password with at least 6 characters." }, 400, deviceId);
  }

  try {
    const limit = await checkAndRecordSignupAttempt(request, email, deviceId);
    if (!limit.allowed) {
      return responseWithDeviceCookie({ error: limit.message || "Too many signup attempts. Please try again later." }, 429, deviceId);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return responseWithDeviceCookie({ error: message }, 500, deviceId);
  }

  const supabase = createRouteHandlerClient({ cookies });
  const { data, error } = await supabase.auth.signUp({ email, password });

  if (error) {
    return responseWithDeviceCookie({ error: error.message }, 400, deviceId);
  }

  if (data.user?.id) {
    try {
      await createPendingSignupProfile({ id: data.user.id, email: data.user.email || email });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return responseWithDeviceCookie({ error: message }, 500, deviceId);
    }
  }

  if (data.session && data.user && isEmailVerified(data.user)) {
    return responseWithDeviceCookie({ session: true, message: "Account created. Opening your dashboard." }, 200, deviceId);
  }

  if (data.session && data.user && !isEmailVerified(data.user)) {
    await supabase.auth.signOut();
  }

  return responseWithDeviceCookie(
    {
      session: false,
      requiresVerification: true,
      message: SIGNUP_BONUS_PENDING_MESSAGE
    },
    200,
    deviceId
  );
}
