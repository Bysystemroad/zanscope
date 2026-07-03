import { CreditCard, Zap } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { CreditPurchaseCards } from "@/components/credit-purchase-cards";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getUserProfile } from "@/lib/supabase/server";

export default async function BillingPage({
  searchParams
}: {
  searchParams?: Promise<{ success?: string; canceled?: string }>;
}) {
  const userProfile = await getUserProfile();
  const params = await searchParams;
  const notice = params?.success
    ? "Payment successful. Your credits will appear shortly."
    : params?.canceled
      ? "Payment canceled."
      : "";

  return (
    <AppShell>
      <div className="mb-6">
        <h1 className="text-3xl font-semibold tracking-normal text-white">Billing and credits</h1>
        <p className="mt-1 text-muted-foreground">Track usage and buy one-time credit packages for lead discovery and enrichment.</p>
      </div>
      {notice && (
        <div className="mb-6 rounded-xl border border-white/10 bg-white/6 px-4 py-3 text-sm text-[#d8e0e8]">
          {notice}
        </div>
      )}
      <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
        <Card>
          <CardHeader><CardTitle>Current plan</CardTitle></CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold text-white">{userProfile.plan}</div>
            <p className="mt-2 text-sm text-muted-foreground">Includes saved searches, lead discovery, email extraction, deduplication, and Excel and CSV export.</p>
            <Button className="mt-5" variant="outline">
              <CreditCard className="h-4 w-4" />
              Manage billing
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Credits remaining</CardTitle></CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold text-white">{userProfile.credits}</div>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
              <div className="h-full w-[72%] rounded-full bg-gradient-to-r from-white to-[#a7b0b8]" />
            </div>
            <p className="mt-4 text-sm text-muted-foreground">Credits are added after Stripe confirms payment.</p>
          </CardContent>
        </Card>
      </div>
      <div className="mt-6">
        <div className="mb-4 flex items-center gap-2 text-white">
          <Zap className="h-5 w-5" />
          <h2 className="text-xl font-semibold">Buy credits</h2>
        </div>
        <CreditPurchaseCards isLoggedIn={!userProfile.demoMode} loggedInButtonText="Buy credits" loggedOutButtonText="Log in to buy credits" />
      </div>
    </AppShell>
  );
}

