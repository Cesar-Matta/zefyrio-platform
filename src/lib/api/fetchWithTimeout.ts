// fetchWithTimeout — browser-safe fetch wrapper that always aborts after
// `timeoutMs` ms, even if the network layer never resolves. Prevents the
// HUD from hanging forever when an upstream API stalls on mobile networks.
export async function fetchWithTimeout(
  input: RequestInfo | URL,
  init: RequestInit = {},
  timeoutMs = 5000,
): Promise<Response> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    return await fetch(input, { ...init, signal: ctrl.signal });
  } finally {
    clearTimeout(timer);
  }
}
