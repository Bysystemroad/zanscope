type TraceDetails = Record<string, unknown>;

export function authTrace(event: string, details: TraceDetails = {}) {
  const enabled = process.env.NEXT_PUBLIC_AUTH_TRACE === "1" || process.env.AUTH_TRACE === "1";

  if (!enabled) return;

  console.info("[AUTH-TRACE]", event, details);
}
