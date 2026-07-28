import crypto from "crypto";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getCreditPackageByStripePriceId } from "@/lib/stripe-packages";

type StripeCheckoutSession = {
  id: string;
  object: "checkout.session";
  metadata?: {
    user_id?: string;
    package_name?: string;
  };
};

type StripeLineItemsResponse = {
  data?: Array<{
    price?: {
      id?: string;
    };
  }>;
};

type StripeEvent = {
  id: string;
  type: string;
  data: {
    object: StripeCheckoutSession;
  };
};

type PurchaseResult = {
  processed: boolean;
  remaining_credits: number;
};

export const runtime = "nodejs";

function verifyStripeSignature(payload: string, signatureHeader: string | null, secret: string) {
  if (!signatureHeader) return false;

  const parts = Object.fromEntries(
    signatureHeader.split(",").map((part) => {
      const [key, value] = part.split("=");
      return [key, value];
    })
  );

  const timestamp = parts.t;
  const signature = parts.v1;
  if (!timestamp || !signature) return false;

  const signedPayload = `${timestamp}.${payload}`;
  const expected = crypto.createHmac("sha256", secret).update(signedPayload).digest("hex");
  const expectedBuffer = Buffer.from(expected, "hex");
  const signatureBuffer = Buffer.from(signature, "hex");

  return expectedBuffer.length === signatureBuffer.length && crypto.timingSafeEqual(expectedBuffer, signatureBuffer);
}

function adminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Supabase service configuration is missing.");
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });
}

async function getCheckoutSessionPriceId(sessionId: string, stripeSecretKey: string) {
  const response = await fetch(`https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(sessionId)}/line_items?limit=1`, {
    headers: {
      Authorization: `Bearer ${stripeSecretKey}`
    }
  });

  const data = (await response.json()) as StripeLineItemsResponse & { error?: { message?: string } };

  if (!response.ok) {
    throw new Error(data.error?.message || "Could not read checkout session line item.");
  }

  return data.data?.[0]?.price?.id || "";
}

export async function POST(request: Request) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

  if (!webhookSecret || !stripeSecretKey) {
    return NextResponse.json({ error: "Webhook is not configured." }, { status: 500 });
  }

  const payload = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!verifyStripeSignature(payload, signature, webhookSecret)) {
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  }

  const event = JSON.parse(payload) as StripeEvent;

  if (event.type !== "checkout.session.completed") {
    return NextResponse.json({ received: true });
  }

  const session = event.data.object;
  const userId = session.metadata?.user_id;

  if (!session.id || !userId) {
    return NextResponse.json({ error: "Checkout metadata is incomplete." }, { status: 400 });
  }

  const priceId = await getCheckoutSessionPriceId(session.id, stripeSecretKey);
  const creditPackage = getCreditPackageByStripePriceId(priceId);

  if (!creditPackage) {
    return NextResponse.json({ error: "Checkout price is not mapped to a credit package." }, { status: 400 });
  }

  const supabase = adminClient();
  const { data, error } = await supabase.rpc("process_stripe_credit_purchase", {
    p_user_id: userId,
    p_stripe_session_id: session.id,
    p_credits: creditPackage.credits,
    p_package_name: creditPackage.name
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const result = Array.isArray(data) ? (data[0] as PurchaseResult | undefined) : undefined;
  return NextResponse.json({ received: true, processed: Boolean(result?.processed) });
}
