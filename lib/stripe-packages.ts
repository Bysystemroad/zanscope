export type StripePackageKey = "starter" | "growth" | "business";

export type CreditPackage = {
  key: StripePackageKey;
  name: string;
  credits: number;
  description: string;
  envPriceKey: "STRIPE_PRICE_STARTER" | "STRIPE_PRICE_GROWTH" | "STRIPE_PRICE_BUSINESS";
};

export const creditPackages: CreditPackage[] = [
  {
    key: "starter",
    name: "Starter",
    credits: 1000,
    description: "For focused prospecting sessions and early market tests.",
    envPriceKey: "STRIPE_PRICE_STARTER"
  },
  {
    key: "growth",
    name: "Growth",
    credits: 5000,
    description: "For weekly searches, enrichment, and team list building.",
    envPriceKey: "STRIPE_PRICE_GROWTH"
  },
  {
    key: "business",
    name: "Business",
    credits: 20000,
    description: "For larger lead generation workflows and agency delivery.",
    envPriceKey: "STRIPE_PRICE_BUSINESS"
  }
];

export function getCreditPackage(key?: string) {
  return creditPackages.find((item) => item.key === key);
}
