const BASE = (import.meta.env.VITE_FAUCET_API ?? "/api") as string;

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

export async function drip(address: string): Promise<DripResponse> {
  const res = await fetch(`${BASE}/drip`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ address }),
  });
  return res.json();
}

export async function getLimits(address: string): Promise<LimitsResponse> {
  const res = await fetch(
    `${BASE}/status/limits?address=${encodeURIComponent(address)}`
  );
  return res.json();
}

export async function getFaucetStatus() {
  const res = await fetch(`${BASE}/status`);
  return res.json() as Promise<{
    ok: boolean;
    faucet_address?: string;
    kite_balance_wei?: string;
    usdt_balance_wei?: string;
    error?: string;
  }>;
}
