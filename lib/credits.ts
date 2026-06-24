import { Lead } from "@/lib/dummy-data";

export function calculateLeadCreditCost(leads: Lead[]) {
  const uniqueLeadCredits = leads.length;
  const emailCredits = leads.filter((lead) => Boolean(lead.email)).length;

  return {
    total: uniqueLeadCredits + emailCredits,
    uniqueLeadCredits,
    emailCredits
  };
}
