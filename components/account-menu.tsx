"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { authTrace } from "@/lib/auth-trace";
import { isEmailVerified } from "@/lib/auth-security";
import { supabase } from "@/lib/supabase/client";

type AccountState = {
  email: string;
};

export function AccountMenu() {
  const router = useRouter();
  const [account, setAccount] = useState<AccountState | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    const authClient = supabase;
    let mounted = true;

    authClient.auth.getSession().then(async ({ data, error }) => {
      if (!mounted) return;

      authTrace("account_menu.initial_session", {
        hasSession: Boolean(data.session),
        userId: data.session?.user.id || null,
        emailVerified: data.session?.user ? isEmailVerified(data.session.user) : false,
        error: error?.message || null
      });

      if (error) {
        setLoading(false);
        return;
      }

      const {
        data: { user },
        error: userError
      } = await authClient.auth.getUser();

      if (!mounted) return;

      authTrace("account_menu.get_user", {
        hasUser: Boolean(user),
        userId: user?.id || null,
        emailVerified: user ? isEmailVerified(user) : false,
        error: userError?.message || null
      });

      if (user?.email && isEmailVerified(user)) {
        setAccount({ email: user.email });
      } else if (!data.session) {
        setAccount(null);
      }

      setLoading(false);
    });

    const {
      data: { subscription }
    } = authClient.auth.onAuthStateChange((event, session) => {
      authTrace("account_menu.auth_state_change", {
        event,
        hasSession: Boolean(session),
        userId: session?.user.id || null,
        emailVerified: session?.user ? isEmailVerified(session.user) : false
      });

      if (event === "SIGNED_OUT") {
        authTrace("account_menu.state_to_null", {
          reason: "SIGNED_OUT"
        });
        setAccount(null);
        setLoading(false);
        router.refresh();
        return;
      }

      if (session?.user.email && isEmailVerified(session.user)) {
        setAccount({ email: session.user.email });
      } else if (session) {
        authTrace("account_menu.preserve_state", {
          reason: "session_present_but_not_confirmed_in_event",
          event
        });
      } else {
        authTrace("account_menu.preserve_state", {
          reason: "non_signout_null_session_event",
          event
        });
      }

      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [router]);

  async function logout() {
    if (!supabase) return;
    authTrace("account_menu.sign_out_invoked", {
      reason: "user_clicked_logout"
    });
    await supabase.auth.signOut();
    authTrace("account_menu.state_to_null", {
      reason: "user_clicked_logout"
    });
    setAccount(null);
    router.replace("/login");
    router.refresh();
  }

  if (loading) {
    return <div className="h-10 w-20 rounded-md border border-white/10 bg-white/5" />;
  }

  if (!account) {
    return (
      <Link
        href="/login"
        className="justify-self-end rounded-md border border-white/15 bg-white/5 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10 hover:shadow-[0_0_24px_rgba(255,255,255,0.14)]"
      >
        Login
      </Link>
    );
  }

  const initial = account.email.slice(0, 1).toUpperCase();

  return (
    <div className="flex max-w-full flex-wrap items-center gap-3 justify-self-end overflow-hidden">
      <div className="min-w-0 flex-1 text-left sm:block">
        <div className="text-xs text-muted-foreground">Signed in</div>
        <div className="max-w-full truncate text-sm font-medium text-white" title={account.email}>
          {account.email}
        </div>
      </div>
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/10 text-sm font-semibold text-white">
        {initial}
      </div>
      <button
        type="button"
        onClick={logout}
        className="inline-flex h-10 shrink-0 items-center gap-2 rounded-md border border-white/15 bg-white/5 px-3 text-sm font-medium text-white transition hover:bg-white/10"
      >
        <LogOut className="h-4 w-4" />
        <span className="hidden sm:inline">Logout</span>
      </button>
    </div>
  );
}
