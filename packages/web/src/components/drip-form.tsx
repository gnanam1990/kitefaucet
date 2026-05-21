import { useState } from "react";
import { Droplet } from "lucide-react";
import { drip, type DripResponse } from "../lib/api-client";

const isAddress = (v: string) => /^0x[a-fA-F0-9]{40}$/.test(v.trim());

interface Props {
  onResult: (result: DripResponse, address: string) => void;
}

export function DripForm({ onResult }: Props) {
  const [address, setAddress] = useState("");
  const [busy, setBusy] = useState(false);
  const valid = isAddress(address);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!valid) return;
    setBusy(true);
    try {
      const r = await drip(address.trim());
      onResult(r, address.trim());
    } catch (err) {
      onResult({ error: (err as Error).message }, address.trim());
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <label htmlFor="address" className="block text-xs font-semibold uppercase tracking-widest text-kite-fg/60">
        Kite testnet address
      </label>
      <input
        id="address"
        value={address}
        onChange={(e) => setAddress(e.target.value)}
        placeholder="0x…"
        autoComplete="off"
        spellCheck={false}
        className="w-full px-4 py-3 rounded-md border border-kite-border bg-kite-card font-mono text-sm focus:outline-none focus:border-kite-primary"
      />
      <button
        type="submit"
        disabled={!valid || busy}
        className="h-12 w-full inline-flex items-center justify-center gap-2 rounded-md bg-kite-primary text-white font-medium hover:bg-[#8a755a] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        <Droplet className="w-4 h-4" />
        {busy ? "Dripping…" : "Drip 5 KITE + 10 Test USDT"}
      </button>
      {!valid && address.length > 0 && (
        <p className="text-xs text-kite-destructive font-mono">
          Doesn't look like a valid 0x… address.
        </p>
      )}
    </form>
  );
}
