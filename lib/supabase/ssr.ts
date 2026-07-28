import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { isEmailVerified } from "@/lib/auth-security";
import { sessionLoopTrace } from "@/lib/session-loop-trace";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export type ServerAccount = {
  email: string;
  userId: string;
} | null;

export function isSupabaseSsrConfigured() {
  return Boolean(supabaseUrl && supabaseAnonKey);
}

export async function createSupabaseServerClient() {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Supabase SSR environment variables are not configured.");
  }

  const cookieStore = await cookies();

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Server Components cannot always write response cookies. Middleware handles refresh writes.
        }
      }
    }
  });
}

export async function getServerAccount(pathname = "server-render"): Promise<ServerAccount> {
  if (!isSupabaseSsrConfigured()) {
    sessionLoopTrace("server_account.env_missing", { pathname });
    return null;
  }

  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
      error
    } = await supabase.auth.getUser();

    sessionLoopTrace("server_account.auth_result", {
      pathname,
      userId: user?.id || null,
      hasUser: Boolean(user),
      emailVerified: user ? isEmailVerified(user) : false,
      error: error?.message || null
    });

    if (!user?.email || !isEmailVerified(user)) return null;
    return { email: user.email, userId: user.id };
  } catch (error) {
    sessionLoopTrace("server_account.exception", {
      pathname,
      error: error instanceof Error ? error.message : String(error)
    });
    return null;
  }
}
