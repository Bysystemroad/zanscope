import { POST as runSearch } from "@/app/api/searches/route";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";

export async function POST(request: Request) {
  const rateLimit = checkRateLimit(request, "places-search", { limit: 8, windowMs: 60_000 });
  if (!rateLimit.allowed) return rateLimitResponse(rateLimit.retryAfter);

  return runSearch(request);
}
