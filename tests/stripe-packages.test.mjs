import assert from "node:assert/strict";
import test from "node:test";
import { getCreditPackage, getCreditPackageByStripePriceId } from "../lib/stripe-packages.ts";

const stripePriceEnv = {
  STRIPE_PRICE_STARTER: "price_starter",
  STRIPE_PRICE_GROWTH: "price_growth",
  STRIPE_PRICE_BUSINESS: "price_business"
};

test("Starter package maps to exactly 1,000 credits", () => {
  assert.equal(getCreditPackage("starter")?.credits, 1000);
  assert.equal(getCreditPackageByStripePriceId("price_starter", stripePriceEnv)?.credits, 1000);
});

test("Growth package maps to exactly 3,000 credits", () => {
  assert.equal(getCreditPackage("growth")?.credits, 3000);
  assert.equal(getCreditPackageByStripePriceId("price_growth", stripePriceEnv)?.credits, 3000);
});

test("Business package maps to exactly 8,000 credits", () => {
  assert.equal(getCreditPackage("business")?.credits, 8000);
  assert.equal(getCreditPackageByStripePriceId("price_business", stripePriceEnv)?.credits, 8000);
});

test("Unknown Stripe price IDs do not resolve to a package", () => {
  assert.equal(getCreditPackageByStripePriceId("price_unknown", stripePriceEnv), undefined);
});
