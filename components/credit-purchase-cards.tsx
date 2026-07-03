"use client";

import { useState } from "react";
import { CreditCard, Loader2, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { creditPackages, type StripePackageKey } from "@/lib/stripe-packages";

type CreditPurchaseCardsProps = {
  isLoggedIn: boolean;
};

export function CreditPurchaseCards({ isLoggedIn }: CreditPurchaseCardsProps) {
  const [loadingPackage, setLoadingPackage] = useState<StripePackageKey | "">("");
  const [message, setMessage] = useState("");

  async function buyCredits(packageKey: StripePackageKey) {
    if (!isLoggedIn) {
      setMessage("Log in to buy credits.");
      return;
    }

    setLoadingPackage(packageKey);
    setMessage("");

    try {
      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packageKey })
      });
      const data = (await response.json()) as { url?: string; error?: string };

      if (!response.ok || !data.url) {
        throw new Error(data.error || "Could not start checkout.");
      }

      window.location.href = data.url;
    } catch (error) {
      setMessage(error instanceof Error ? error.message : String(error));
      setLoadingPackage("");
    }
  }

  return (
    <div className="space-y-4">
      {message && (
        <div className="rounded-xl border border-white/10 bg-white/6 px-4 py-3 text-sm text-[#d8e0e8]">
          {message}
        </div>
      )}
      <div className="grid gap-4 lg:grid-cols-3">
        {creditPackages.map((item) => (
          <div key={item.key} className="glass-panel rounded-2xl p-5 transition hover:-translate-y-1 hover:border-white/20">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-white">{item.name}</h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.description}</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/6 p-2 text-white">
                <Zap className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-6 text-3xl font-semibold text-white">{item.credits.toLocaleString()} credits</div>
            <Button
              type="button"
              className="mt-6 w-full"
              disabled={!isLoggedIn || Boolean(loadingPackage)}
              onClick={() => buyCredits(item.key)}
            >
              {loadingPackage === item.key ? <Loader2 className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />}
              Buy credits
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
