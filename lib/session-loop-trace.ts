export function sessionLoopTrace(event: string, details: Record<string, unknown> = {}) {
  console.info("[SESSION-LOOP-TRACE]", event, details);
}
