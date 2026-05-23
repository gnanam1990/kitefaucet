const BASE = (import.meta.env.VITE_FAUCET_API ?? "/api") as string;
const API_UNAVAILABLE = "Faucet API is not configured for this Vercel preview yet.";

export interface DripResponse {
  ok?: true;
  kite_amount?: number;
  usdt_amount?: number;
  kite_tx?: string;
  usdt_tx?: string;
  explorer?: string;
  error?: string;
  daily_kite_remaining?: number;
  daily_usdt_remaining?: number;
}

export interface LimitsResponse {
  allowed: boolean;
  reason?: string;
  daily_kite_remaining: number;
  daily_usdt_remaining: number;
  weekly_kite_used: number;
}

async function readJson<T>(response: Response): Promise<T> {
  if (!response.headers.get("content-type")?.includes("application/json")) {
    throw new Error(API_UNAVAILABLE);
  }
  return (await response.json()) as T;
}

export async function drip(address: string): Promise<DripResponse> {
  const res = await fetch(`${BASE}/drip`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ address }),
  });
  return readJson<DripResponse>(res);
}

export async function getLimits(address: string): Promise<LimitsResponse> {
  const res = await fetch(
    `${BASE}/status/limits?address=${encodeURIComponent(address)}`
  );
  return readJson<LimitsResponse>(res);
}

export async function getFaucetStatus() {
  const res = await fetch(`${BASE}/status`);
  return readJson<{
    ok: boolean;
    faucet_address?: string;
    kite_balance_wei?: string;
    usdt_balance_wei?: string;
    error?: string;
  }>(res);
}
