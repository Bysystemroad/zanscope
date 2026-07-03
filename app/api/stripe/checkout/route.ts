import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { getCreditPackage } from "@/lib/stripe-packages";
import { ensureUserProfile } from "@/lib/supabase/profile";

type CheckoutPayload = {
  packageKey?: string;
};

function checkoutUrl(request: Request, path: string) {
  const origin = request.headers.get("origin") || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  return new URL(path, origin).toString();
}

export async function POST(request: Request) {
  const payload = (await request.json()) as CheckoutPayload;
  const creditPackage = getCreditPackage(payload.packageKey);

  if (!creditPackage) {
    return NextResponse.json({ error: "Choose a valid credit package." }, { status: 400 });
  }

  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  const priceId = process.env[creditPackage.envPriceKey];

  if (!stripeSecretKey || !priceId) {
    return NextResponse.json({ error: "Credit purchases are not configured yet." }, { status: 500 });
  }

  const supabase = createRouteHandlerClient({ cookies });
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Log in to buy credits." }, { status: 401 });
  }

  try {
    await ensureUserProfile(supabase, user);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }

  const body = new URLSearchParams();
  body.set("mode", "payment");
  body.set("line_items[0][price]", priceId);
  body.set("line_items[0][quantity]", "1");
  body.set("success_url", checkoutUrl(request, "/billing?success=true"));
  body.set("cancel_url", checkoutUrl(request, "/billing?canceled=true"));
  body.set("client_reference_id", user.id);
  if (user.email) body.set("customer_email", user.email);
  body.set("metadata[user_id]", user.id);
  body.set("metadata[credits]", String(creditPackage.credits));
  body.set("metadata[package_name]", creditPackage.name);

  const response = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${stripeSecretKey}`,
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body
  });

  const data = (await response.json()) as { url?: string; error?: { message?: string } };

  if (!response.ok || !data.url) {
    return NextResponse.json({ error: data.error?.message || "Could not start checkout." }, { status: 500 });
  }

  return NextResponse.json({ url: data.url });
}
