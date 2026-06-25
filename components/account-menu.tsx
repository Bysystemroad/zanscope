"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
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

    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setAccount(data.session?.user.email ? { email: data.session.user.email } : null);
      setLoading(false);
    });

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((event, session) => {
      setAccount(session?.user.email ? { email: session.user.email } : null);
      setLoading(false);
      if (event === "SIGNED_IN" || event === "SIGNED_OUT") {
        router.refresh();
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [router]);

  async function logout() {
    if (!supabase) return;
    await supabase.auth.signOut();
    setAccount(null);
    router.refresh();
    router.push("/");
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
    <div className="flex items-center gap-3 justify-self-end">
      <div className="hidden text-right sm:block">
        <div className="text-xs text-muted-foreground">Signed in</div>
        <div className="max-w-[190px] truncate text-sm font-medium text-white">{account.email}</div>
      </div>
      <div className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/10 text-sm font-semibold text-white">
        {initial}
      </div>
      <button
        type="button"
        onClick={logout}
        className="inline-flex h-10 items-center gap-2 rounded-md border border-white/15 bg-white/5 px-3 text-sm font-medium text-white transition hover:bg-white/10"
      >
        <LogOut className="h-4 w-4" />
        <span className="hidden sm:inline">Logout</span>
      </button>
    </div>
  );
}
