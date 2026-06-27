import { CreditCard, Zap } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getUserProfile } from "@/lib/supabase/server";

export default async function BillingPage() {
  const userProfile = await getUserProfile();

  return (
    <AppShell>
      <div className="mb-6">
        <h1 className="text-3xl font-semibold tracking-normal text-white">Billing and credits</h1>
        <p className="mt-1 text-muted-foreground">Track usage and prepare plan upgrades for the MVP.</p>
      </div>
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
            <Button className="mt-5">
              <Zap className="h-4 w-4" />
              Buy credits
            </Button>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}

