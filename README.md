# KiteFaucet

Testnet faucet for Kite devs — drip native KITE + Test USDT in one click. No captcha, sane rate limits.

Live: https://kitefaucet.vercel.app

## Architecture

```
packages/
  api/   Hono + SQLite + viem  (rate limits + drip transactions)
  web/   Vite + React + Tailwind  (the single-page UI)
```

## Quick start

```bash
pnpm install

# api
cp packages/api/.env.example packages/api/.env
# put a *funded testnet* private key in packages/api/.env

pnpm --filter api dev   # → http://localhost:8787
pnpm --filter web dev   # → http://localhost:3000 (proxies /api → api)
```

## Deployment

- **Production:** https://kitefaucet.vercel.app
- **Host:** Vercel project `kitefaucet`
- **Status:** Web UI build verified on 2026-05-23. Real drips require the Hono API on a persistent backend with a funded testnet wallet and server-side private key.
- **API config:** deploy `packages/api` to Railway or another server host, then set `VITE_FAUCET_API` in the Vercel web project to the API base URL.

## Limits

| Tier | Daily KITE | Daily Test USDT | 7-day cap |
|------|------------|-----------------|-----------|
| Anonymous (IP+address) | 5 | 10 | 100 KITE / address |
| GitHub auth (v0.2)     | 25 | 100 | 100 KITE / address |

`Test USDT` is the ERC-20 at `0x0fF5393387ad2f9f691FD6Fd28e07E3969e27e63` (18 decimals).

## API

| Method | Path | Notes |
|--------|------|-------|
| POST | `/drip` | body `{ address }` — drips both tokens, records rate-limit row |
| GET | `/status` | faucet balance + active limits |
| GET | `/status/limits?address=0x…` | remaining daily quota for that address/IP |

## Anti-abuse

- Per-IP + per-address daily budgets (combined OR), summed from SQLite
- 7-day hard cap per address regardless of auth
- Env `FAUCET_BLOCKLIST="0x...,0x..."` blocks known scam destinations
- Funding key is **server-side only** — never shipped to the browser

## Roadmap

- v0.2 GitHub OAuth for higher quotas, programmatic API keys, Slack low-balance alerts
- v0.3 Multi-token (any ERC-20 you whitelist), webhook on drip
- Mainnet faucet — **never.** Mainnet KITE is real.

## License

MIT
