"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { LogIn, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { isSupabaseConfigured, supabase } from "@/lib/supabase/client";

export function AuthForm() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [message, setMessage] = useState("Connect Supabase env vars to enable live auth.");
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email"));
    const password = String(form.get("password"));

    if (!supabase || !isSupabaseConfigured) {
      setMessage("Demo mode: Supabase auth is not configured yet.");
      return;
    }

    setLoading(true);
    const response =
      mode === "login"
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password });

    setLoading(false);
    if (response.error) {
      setMessage(response.error.message);
      return;
    }

    setMessage(mode === "login" ? "Signed in. Redirecting..." : "Check your email to confirm signup.");

    if (mode === "login") {
      router.push("/dashboard");
      router.refresh();
    }
  }

  return (
    <div className="rounded-lg border bg-white p-6 shadow-soft">
      <div className="mb-5 flex rounded-md bg-muted p-1">
        <button
          type="button"
          onClick={() => setMode("login")}
          className={`h-9 flex-1 rounded-md text-sm font-medium ${mode === "login" ? "bg-white shadow-sm" : "text-muted-foreground"}`}
        >
          Login
        </button>
        <button
          type="button"
          onClick={() => setMode("signup")}
          className={`h-9 flex-1 rounded-md text-sm font-medium ${mode === "signup" ? "bg-white shadow-sm" : "text-muted-foreground"}`}
        >
          Signup
        </button>
      </div>
      <form onSubmit={onSubmit} className="space-y-4">
        <label className="space-y-2">
          <span className="text-sm font-medium">Email</span>
          <Input type="email" name="email" required placeholder="you@company.com" />
        </label>
        <label className="space-y-2">
          <span className="text-sm font-medium">Password</span>
          <Input type="password" name="password" required placeholder="Minimum 6 characters" />
        </label>
        <Button type="submit" className="w-full" disabled={loading}>
          {mode === "login" ? <LogIn className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
          {loading ? "Working" : mode === "login" ? "Login" : "Create account"}
        </Button>
      </form>
      <p className="mt-4 text-sm text-muted-foreground">{message}</p>
    </div>
  );
}
