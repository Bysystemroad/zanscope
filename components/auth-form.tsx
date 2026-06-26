"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { LogIn, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BrandLogo } from "@/components/brand-logo";
import { isSupabaseConfigured, supabase } from "@/lib/supabase/client";

export function AuthForm() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [message, setMessage] = useState("Your data, saved searches, credits, and lead lists are securely linked to your account.");
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email"));
    const password = String(form.get("password"));

    if (!supabase || !isSupabaseConfigured) {
      setMessage("Authentication is temporarily unavailable. Please try again shortly.");
      return;
    }

    setLoading(true);
    const response =
      mode === "login"
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password });

    if (response.error) {
      setLoading(false);
      setMessage(response.error.message);
      return;
    }

    if (mode === "login") {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

      if (sessionError || !sessionData.session) {
        setLoading(false);
        setMessage(sessionError?.message || "Login succeeded, but the session could not be confirmed. Please try again.");
        return;
      }

      router.replace("/dashboard");
      return;
    }

    setLoading(false);
    setMessage("Check your email to confirm your account.");
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
      </div>

      <div className="mb-6 flex rounded-2xl border border-white/10 bg-white/[0.045] p-1">
        <button
          type="button"
          onClick={() => setMode("login")}
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
          onClick={() => setMode("signup")}
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
