import { useEffect, useState } from "react";
import { SiteHeader } from "./components/site-header";
import { SiteFooter } from "./components/site-footer";
import { DripForm } from "./components/drip-form";
import { DripResult } from "./components/drip-result";
import { PreviewBadge } from "./components/preview-badge";
import { getFaucetStatus, type DripResponse } from "./lib/api-client";

export default function App() {
  const [result, setResult] = useState<{ data: DripResponse; address: string } | null>(null);
  const [lowFaucet, setLowFaucet] = useState(false);

  useEffect(() => {
    getFaucetStatus()
      .then((s) => {
        if (s.ok && s.kite_balance_wei) {
          const kite = Number(BigInt(s.kite_balance_wei) / BigInt(1e15)) / 1000;
          if (kite < 50) setLowFaucet(true);
        }
      })
      .catch(() => {});
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />

      <main className="flex-1">
        <section className="kite-gradient border-b border-kite-border">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 text-center">
            <p className="text-xs font-bold tracking-widest uppercase text-kite-primary mb-3">
              Kite Testnet · Chain 2368
            </p>
            <h1 className="text-5xl sm:text-6xl font-bold tracking-tight text-kite-fg">
              Kite testnet faucet.
            </h1>
            <p className="mt-5 text-lg text-kite-fg/70 max-w-2xl mx-auto">
              5 KITE + 10 Test USDT per 24h. No captcha. Built for devs shipping
              against Kite.
            </p>
          </div>
        </section>

        <section className="max-w-xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="rounded-xl border border-kite-border bg-kite-card p-6 sm:p-8">
            {result ? (
              <DripResult
                result={result.data}
                address={result.address}
                onReset={() => setResult(null)}
              />
            ) : (
              <DripForm onResult={(data, address) => setResult({ data, address })} />
            )}
          </div>

          {lowFaucet && (
            <p className="mt-4 text-center text-xs text-kite-destructive font-mono">
              Faucet running low — top-up requested.
            </p>
          )}

          <div className="mt-10 grid sm:grid-cols-2 gap-3 text-sm">
            <div className="rounded-lg border border-kite-border bg-kite-bg p-4">
              <div className="text-xs font-semibold uppercase tracking-widest text-kite-fg/55">Limits</div>
              <p className="mt-2 text-kite-fg/80">
                5 KITE + 10 Test USDT per 24h (per IP/address).<br />
                7-day cap of 100 KITE per address.
              </p>
            </div>
            <div className="rounded-lg border border-kite-border bg-kite-bg p-4">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-kite-fg/55">
                Higher limits <PreviewBadge>v0.2</PreviewBadge>
              </div>
              <p className="mt-2 text-kite-fg/80">
                GitHub sign-in for 25/100 daily quota — coming in v0.2.
              </p>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
