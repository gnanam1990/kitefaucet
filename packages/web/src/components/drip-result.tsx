import { Check, ExternalLink, AlertTriangle } from "lucide-react";
import type { DripResponse } from "../lib/api-client";

interface Props {
  result: DripResponse;
  address: string;
  onReset: () => void;
}

const TX_BASE = "https://testnet.kitescan.ai/tx/";
const ADDR_BASE = "https://testnet.kitescan.ai/address/";

export function DripResult({ result, address, onReset }: Props) {
  if (result.error) {
    return (
      <div className="rounded-xl border border-kite-destructive/50 bg-kite-destructive/5 p-5">
        <div className="flex items-center gap-2 text-kite-destructive font-semibold">
          <AlertTriangle className="w-5 h-5" /> {result.error}
        </div>
        {result.daily_kite_remaining !== undefined && (
          <p className="mt-2 text-xs font-mono text-kite-fg/60">
            remaining today — kite: {result.daily_kite_remaining}, usdt:{" "}
            {result.daily_usdt_remaining}
          </p>
        )}
        <button
          onClick={onReset}
          className="mt-4 text-xs font-semibold text-kite-fg/70 hover:text-kite-fg transition-colors"
        >
          ← try a different address
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-kite-accent/40 bg-kite-accent/5 p-6">
      <div className="flex items-center gap-2 text-kite-accent font-semibold mb-3">
        <Check className="w-5 h-5" /> Drip sent
      </div>
      <div className="grid sm:grid-cols-2 gap-3 text-sm">
        <Tx label={`${result.kite_amount} KITE`} hash={result.kite_tx} />
        <Tx label={`${result.usdt_amount} Test USDT`} hash={result.usdt_tx} />
      </div>
      <div className="mt-4 flex items-center justify-between text-xs">
        <a
          href={`${ADDR_BASE}${address}`}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 text-kite-primary hover:text-kite-fg font-semibold"
        >
          View address on KiteScan <ExternalLink className="w-3 h-3" />
        </a>
        <button
          onClick={onReset}
          className="text-kite-fg/60 hover:text-kite-fg font-semibold"
        >
          Drip another address
        </button>
      </div>
    </div>
  );
}

function Tx({ label, hash }: { label: string; hash?: string }) {
  if (!hash) return null;
  return (
    <a
      href={`${TX_BASE}${hash}`}
      target="_blank"
      rel="noreferrer"
      className="rounded-md border border-kite-border bg-kite-bg px-3 py-2 hover:border-kite-primary transition-colors"
    >
      <div className="text-xs text-kite-fg/55 font-mono">{label}</div>
      <div className="font-mono text-xs text-kite-fg truncate flex items-center gap-1">
        {hash.slice(0, 10)}…{hash.slice(-8)} <ExternalLink className="w-3 h-3" />
      </div>
    </a>
  );
}
