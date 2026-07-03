import crypto from "crypto";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

type StripeCheckoutSession = {
  id: string;
  object: "checkout.session";
  metadata?: {
    user_id?: string;
    credits?: string;
    package_name?: string;
  };
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

export async function POST(request: Request) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
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
  const credits = Number(session.metadata?.credits || 0);
  const packageName = session.metadata?.package_name || "Credit package";

  if (!session.id || !userId || !Number.isInteger(credits) || credits <= 0) {
    return NextResponse.json({ error: "Checkout metadata is incomplete." }, { status: 400 });
  }

  const supabase = adminClient();
  const { data, error } = await supabase.rpc("process_stripe_credit_purchase", {
    p_user_id: userId,
    p_stripe_session_id: session.id,
    p_credits: credits,
    p_package_name: packageName
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const result = Array.isArray(data) ? (data[0] as PurchaseResult | undefined) : undefined;
  return NextResponse.json({ received: true, processed: Boolean(result?.processed) });
}
