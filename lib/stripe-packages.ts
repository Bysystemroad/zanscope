export type StripePackageKey = "starter" | "growth" | "business";

export type CreditPackage = {
  key: StripePackageKey;
  name: string;
  credits: number;
  priceLabel: string;
  description: string;
  envPriceKey: "STRIPE_PRICE_STARTER" | "STRIPE_PRICE_GROWTH" | "STRIPE_PRICE_BUSINESS";
};

type StripePriceEnv = {
  [key: string]: string | undefined;
};

export const creditPackages: CreditPackage[] = [
  {
    key: "starter",
    name: "Starter",
    credits: 1000,
    priceLabel: "€19.00 EUR",
    description: "For focused prospecting sessions and early market tests.",
    envPriceKey: "STRIPE_PRICE_STARTER"
  },
  {
    key: "growth",
    name: "Growth",
    credits: 3000,
    priceLabel: "€49.00 EUR",
    description: "For weekly searches, enrichment, and team list building.",
    envPriceKey: "STRIPE_PRICE_GROWTH"
  },
  {
    key: "business",
    name: "Business",
    credits: 8000,
    priceLabel: "€149.00 EUR",
    description: "For larger lead generation workflows and agency delivery.",
    envPriceKey: "STRIPE_PRICE_BUSINESS"
  }
];

export function getCreditPackage(key?: string) {
  return creditPackages.find((item) => item.key === key);
}

export function getCreditPackageByStripePriceId(
  priceId?: string,
  env: StripePriceEnv = process.env
) {
  if (!priceId) return undefined;

  return creditPackages.find((item) => env[item.envPriceKey] === priceId);
}
