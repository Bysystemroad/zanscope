"use client";

import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { LogIn, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BrandLogo } from "@/components/brand-logo";
import { authTrace } from "@/lib/auth-trace";
import { EMAIL_VERIFICATION_REQUIRED_MESSAGE, SIGNUP_BONUS_PENDING_MESSAGE, isEmailVerified } from "@/lib/auth-security";
import { isSupabaseConfigured, supabase } from "@/lib/supabase/client";

type SignupResponse = {
  session?: boolean;
  requiresVerification?: boolean;
  message?: string;
  error?: string;
};

function loginRedirectTrace(event: string, details: Record<string, unknown> = {}) {
  console.info("[LOGIN-REDIRECT-TRACE]", event, details);
}

export function AuthForm() {
  const router = useRouter();
  const pathname = usePathname();
  const submittingRef = useRef(false);
  const redirectingRef = useRef(false);
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [message, setMessage] = useState("Create an account, verify your email, and your 50 free credits will be added after verification.");
  const [loading, setLoading] = useState(false);

  const redirectToDashboard = useCallback(
    (source: string) => {
      if (redirectingRef.current) return;
      redirectingRef.current = true;
      submittingRef.current = true;

      authTrace("auth_form.redirect_started", { source });
      loginRedirectTrace("before_dashboard_navigation", {
        source,
        pathname: typeof window !== "undefined" ? window.location.pathname : pathname,
        loading
      });

      if (typeof window !== "undefined") {
        window.setTimeout(() => {
          loginRedirectTrace("pathname_100ms_after_redirect", {
            source,
            pathname: window.location.pathname,
            loading
          });
        }, 100);
        window.setTimeout(() => {
          loginRedirectTrace("pathname_500ms_after_redirect", {
            source,
            pathname: window.location.pathname,
            loading
          });
        }, 500);
        window.setTimeout(() => {
          loginRedirectTrace("pathname_1500ms_after_redirect", {
            source,
            pathname: window.location.pathname,
            loading
          });
        }, 1500);

        window.location.assign("/dashboard");
        loginRedirectTrace("after_window_location_assign_call", {
          source,
          pathname: window.location.pathname
        });
        return;
      }

      router.replace("/dashboard");
      router.refresh();
      loginRedirectTrace("after_router_replace_call", { source, pathname });
    },
    [loading, pathname, router]
  );

  useEffect(() => {
    if (!redirectingRef.current) return;

    authTrace("auth_form.pathname_after_redirect", {
      pathname,
      reachedDashboard: pathname === "/dashboard"
    });
  }, [pathname]);

  useEffect(() => {
    if (!supabase || !isSupabaseConfigured) return;

    const authClient = supabase;
    let mounted = true;

    authClient.auth.getSession().then(async ({ data, error }) => {
      authTrace("auth_form.existing_session_check", {
        hasSession: Boolean(data.session),
        userId: data.session?.user.id || null,
        emailVerified: data.session?.user ? isEmailVerified(data.session.user) : false,
        error: error?.message || null
      });

      if (mounted && data.session && isEmailVerified(data.session.user)) {
        redirectToDashboard("existing-session");
      } else if (mounted && data.session) {
        setMessage(EMAIL_VERIFICATION_REQUIRED_MESSAGE);
      }
    });

    return () => {
      mounted = false;
    };
  }, [redirectToDashboard]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    loginRedirectTrace("submit_handler_entered", {
      mode,
      loading,
      submitting: submittingRef.current,
      redirecting: redirectingRef.current,
      pathname: typeof window !== "undefined" ? window.location.pathname : pathname
    });

    event.preventDefault();
    if (loading || submittingRef.current || redirectingRef.current) return;

    submittingRef.current = true;

    const form = new FormData(event.currentTarget);
    const email = String(form.get("email"));
    const password = String(form.get("password"));

    if (!supabase || !isSupabaseConfigured) {
      submittingRef.current = false;
      setMessage("Authentication is temporarily unavailable. Please try again shortly.");
      return;
    }

    const authClient = supabase;
    setLoading(true);
    setMessage(mode === "login" ? "Signing in..." : "Creating your account...");

    authTrace("auth_form.submit_started", {
      mode,
      emailProvided: Boolean(email)
    });
    loginRedirectTrace("sign_in_flow_started", {
      mode,
      emailProvided: Boolean(email),
      pathname: typeof window !== "undefined" ? window.location.pathname : pathname
    });

    try {
      if (mode === "login") {
        loginRedirectTrace("signInWithPassword_started", {
          pathname: typeof window !== "undefined" ? window.location.pathname : pathname
        });
      }

      const response =
        mode === "login"
          ? await authClient.auth.signInWithPassword({ email, password })
          : {
              data: { session: null, user: null },
              error: null,
              signup: await fetch("/api/auth/signup", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password })
              })
            };

      if ("signup" in response) {
        const parsed = (await response.signup.json()) as SignupResponse;

        if (!response.signup.ok || parsed.error) {
          submittingRef.current = false;
          setLoading(false);
          setMessage(parsed.error || "Could not create your account. Please try again.");
          loginRedirectTrace("signup_error_branch", {
            error: parsed.error || null,
            loading: false
          });
          return;
        }

        if (parsed.session) {
          setMessage(parsed.message || "Account created. Opening your dashboard...");
          loginRedirectTrace("signup_session_success_branch", {
            session: true,
            pathname: typeof window !== "undefined" ? window.location.pathname : pathname
          });
          redirectToDashboard("signup");
          return;
        }

        submittingRef.current = false;
        setLoading(false);
        setMessage(parsed.message || SIGNUP_BONUS_PENDING_MESSAGE);
        loginRedirectTrace("signup_requires_verification_branch", {
          session: false,
          loading: false
        });
        return;
      }

      authTrace("auth_form.sign_in_returned", {
        mode,
        hasSession: Boolean(response.data.session),
        userId: response.data.user?.id || response.data.session?.user.id || null,
        emailVerified: response.data.session?.user ? isEmailVerified(response.data.session.user) : false,
        emailConfirmedAt: response.data.session?.user.email_confirmed_at || null,
        error: response.error?.message || null
      });
      loginRedirectTrace("signInWithPassword_resolved", {
        authError: response.error?.message || null,
        sessionExists: Boolean(response.data.session),
        userExists: Boolean(response.data.user),
        userId: response.data.user?.id || response.data.session?.user.id || null,
        emailVerifiedFromSession: response.data.session?.user ? isEmailVerified(response.data.session.user) : false,
        emailConfirmedAt: response.data.session?.user.email_confirmed_at || null,
        pathname: typeof window !== "undefined" ? window.location.pathname : pathname
      });

      if (response.error) {
        submittingRef.current = false;
        setLoading(false);
        setMessage(response.error.message);
        loginRedirectTrace("auth_error_branch", {
          authError: response.error.message,
          loading: false
        });
        return;
      }

      if (mode === "login") {
        if (!response.data.session) {
          submittingRef.current = false;
          setLoading(false);
          setMessage(EMAIL_VERIFICATION_REQUIRED_MESSAGE);
          loginRedirectTrace("missing_session_branch", {
            loading: false,
            message: "email_verification_required"
          });
          return;
        }

        const verifiedFromSession = isEmailVerified(response.data.session.user);
        loginRedirectTrace("login_success_branch_entered", {
          sessionExists: true,
          verifiedFromSession,
          pathname: typeof window !== "undefined" ? window.location.pathname : pathname
        });
        if (!verifiedFromSession) {
          const {
            data: { user },
            error: userError
          } = await authClient.auth.getUser();

          authTrace("auth_form.sign_in_get_user", {
            hasUser: Boolean(user),
            userId: user?.id || null,
            emailVerified: user ? isEmailVerified(user) : false,
            emailConfirmedAt: user?.email_confirmed_at || null,
            error: userError?.message || null
          });
          loginRedirectTrace("verified_user_fallback_resolved", {
            userExists: Boolean(user),
            userId: user?.id || null,
            emailVerifiedFromUser: user ? isEmailVerified(user) : false,
            emailConfirmedAt: user?.email_confirmed_at || null,
            error: userError?.message || null
          });

          if (user?.email && isEmailVerified(user)) {
            setMessage("Signed in. Opening your dashboard...");
            loginRedirectTrace("verified_user_fallback_redirect_branch", {
              userId: user.id,
              loading: true
            });
            redirectToDashboard("login-verified-user");
            return;
          }

          submittingRef.current = false;
          setLoading(false);
          setMessage(EMAIL_VERIFICATION_REQUIRED_MESSAGE);
          loginRedirectTrace("unverified_user_branch", {
            loading: false,
            message: "email_verification_required"
          });
          return;
        }

        setMessage("Signed in. Opening your dashboard...");
        loginRedirectTrace("verified_session_redirect_branch", {
          userId: response.data.session.user.id,
          loading: true
        });
        redirectToDashboard("login");
        return;
      }

      submittingRef.current = false;
      setLoading(false);
      setMessage(SIGNUP_BONUS_PENDING_MESSAGE);
      loginRedirectTrace("non_login_fallback_branch", {
        mode,
        loading: false
      });
    } catch (error) {
      loginRedirectTrace("caught_exception", {
        message: error instanceof Error ? error.message : String(error),
        redirecting: redirectingRef.current,
        loading: redirectingRef.current ? loading : false
      });
      if (!redirectingRef.current) {
        submittingRef.current = false;
        setLoading(false);
        setMessage(error instanceof Error ? error.message : "Authentication failed. Please try again.");
      }
    }
  }

  return (
    <div className="self-center rounded-3xl border border-white/10 bg-[#111923]/75 p-6 shadow-[0_30px_90px_rgba(0,0,0,0.38),0_0_50px_rgba(90,155,205,0.08)] backdrop-blur-xl sm:p-7">
      <div className="mb-6">
        <BrandLogo href="/" className="h-14" />
      </div>

      <div className="mb-7">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#b8c7d4]">Secure authentication</p>
        <h2 className="mt-3 text-2xl font-semibold tracking-normal text-white">
          {mode === "login" ? "Welcome back to Zanscope" : "Create your Zanscope account"}
        </h2>
        <p className="mt-3 text-sm leading-6 text-[#a7b0bb]">
          {mode === "login"
            ? "Access your workspace, saved leads, exports, lead lists and search history."
            : "Discover high-quality B2B companies, organize your prospects, and build better outbound campaigns."}
        </p>
        <p className="mt-3 text-sm font-medium text-[#d8e0e8]">Secure access to your lead workspace.</p>
        <p className="mt-1 text-xs leading-5 text-[#7f8c98]">Verify your email before signing in. Your 50 free credits are added after verification.</p>
      </div>

      <div className="mb-6 flex rounded-2xl border border-white/10 bg-white/[0.045] p-1">
        <button
          type="button"
          onClick={() => {
            if (loading || redirectingRef.current) return;
            submittingRef.current = false;
            setMode("login");
            setMessage("Create an account, verify your email, and your 50 free credits will be added after verification.");
          }}
          disabled={loading}
          className={`h-11 flex-1 rounded-xl text-sm font-medium transition ${
            mode === "login"
              ? "bg-white text-[#080f14] shadow-[0_10px_30px_rgba(255,255,255,0.12)]"
              : "text-[#a7b0bb] hover:text-white"
          }`}
        >
          Login
        </button>
        <button
          type="button"
          onClick={() => {
            if (loading || redirectingRef.current) return;
            submittingRef.current = false;
            setMode("signup");
            setMessage("Create an account, verify your email, and your 50 free credits will be added after verification.");
          }}
          disabled={loading}
          className={`h-11 flex-1 rounded-xl text-sm font-medium transition ${
            mode === "signup"
              ? "bg-white text-[#080f14] shadow-[0_10px_30px_rgba(255,255,255,0.12)]"
              : "text-[#a7b0bb] hover:text-white"
          }`}
        >
          Signup
        </button>
      </div>
      <form onSubmit={onSubmit} className="space-y-5">
        <label className="space-y-2">
          <span className="text-sm font-medium text-white">Email</span>
          <Input
            type="email"
            name="email"
            required
            placeholder="you@company.com"
            className="h-12 rounded-xl border-white/10 bg-[#0b1218]/80 text-white placeholder:text-[#64717d] focus-visible:ring-[#79bce8]"
          />
        </label>
        <label className="space-y-2">
          <span className="text-sm font-medium text-white">Password</span>
          <Input
            type="password"
            name="password"
            required
            placeholder="Minimum 6 characters"
            className="h-12 rounded-xl border-white/10 bg-[#0b1218]/80 text-white placeholder:text-[#64717d] focus-visible:ring-[#79bce8]"
          />
        </label>
        <Button
          type="submit"
          className="h-12 w-full rounded-xl bg-[linear-gradient(135deg,#ffffff_0%,#b9d6e9_52%,#78bce8_100%)] font-semibold text-[#071017] shadow-[0_18px_40px_rgba(90,155,205,0.24)] transition hover:translate-y-[-1px] hover:shadow-[0_22px_50px_rgba(90,155,205,0.34)]"
          disabled={loading}
        >
          {mode === "login" ? <LogIn className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
          {loading ? "Working" : mode === "login" ? "Login" : "Create account"}
        </Button>
      </form>
      <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.045] p-4">
        <p className="text-sm font-medium text-white">Secure authentication</p>
        <p className="mt-1 text-sm leading-6 text-[#a7b0bb]">{message}</p>
      </div>
    </div>
  );
}
