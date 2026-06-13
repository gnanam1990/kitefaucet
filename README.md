# KiteFaucet

> One-click testnet faucet for Kite developers — drips native KITE and Test USDT to an address, with IP/address rate limits and no captcha.

![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)
![Language: TypeScript](https://img.shields.io/badge/Language-TypeScript-3178c6.svg)

## Overview

KiteFaucet is a small TypeScript monorepo that hands out Kite Testnet funds to developers. A Hono API signs and broadcasts two transfers per request — native KITE and an ERC-20 Test USDT — from a server-side funding wallet, while a React single-page UI provides the claim form. Drips are throttled per IP and per address using a local SQLite ledger, and an in-process lock prevents the same claimer from double-spending the faucet during the on-chain settlement window. It is intended for people building and testing against the Kite Testnet (chain `2368`).

## Features

- One request drips both native **KITE** and **Test USDT** (ERC-20) to a supplied address.
- Per-IP and per-address daily quotas (combined with OR), summed from a SQLite ledger.
- 7-day hard cap on KITE per address, independent of the daily quota.
- In-process per-claim lock so concurrent requests for the same address/IP cannot both pass the rate-limit check before either records a drip.
- Single shared wallet client with a serialized pending-nonce queue, so concurrent drips do not race the funding wallet's nonce.
- Optional address blocklist via an env var.
- Funding key is read server-side only and is never exposed to the browser.
- `GET /status` reports live faucet balances and active limits; `GET /status/limits` reports remaining quota for an address.
- No captcha.

## Tech stack

- **Language:** TypeScript
- **Package manager:** pnpm workspaces (monorepo)
- **API:** Hono, `@hono/node-server`, better-sqlite3, viem; run with `tsx`
- **Web:** Vite, React 19, Tailwind CSS v4, viem

## Architecture

```
packages/
  api/   Hono + better-sqlite3 + viem — rate limits, claim lock, nonce queue, drip transactions
  web/   Vite + React + Tailwind — single-page claim UI (proxies /api to the API in dev)
```

- `packages/api` — the faucet backend. Validates the address, enforces blocklist and rate limits, acquires a per-claim lock, sends the KITE and Test USDT transfers via a shared viem wallet client, and records the drip in SQLite.
- `packages/web` — the front end. Renders the claim form and result, polls `GET /status` for the faucet balance, and calls the API through the `VITE_FAUCET_API` base URL (or the Vite dev proxy locally).

## Getting started

### Prerequisites

- Node.js 18+ (better-sqlite3 ships native bindings; a current LTS is recommended)
- pnpm 9 (the repo pins `pnpm@9.12.0`)
- A **funded testnet** wallet private key for the API to sign drips

### Installation

```bash
pnpm install
```

### Configuration

The API reads the following environment variables (see `packages/api/.env.example`). List shows names and purpose only — never commit real secret values.

| Variable | Package | Purpose |
|----------|---------|---------|
| `FAUCET_PRIVATE_KEY` | api | Private key of the funding wallet that signs drips. **Testnet only.** Required. |
| `PORT` | api | Port the API listens on (default `8787`). |
| `DAILY_KITE_ANON` | api | Daily KITE quota for anonymous claimers (default `5`). |
| `DAILY_USDT_ANON` | api | Daily Test USDT quota for anonymous claimers (default `10`). |
| `DAILY_KITE_AUTH` | api | Daily KITE quota for authenticated claimers (default `25`; auth not yet wired — see Status). |
| `DAILY_USDT_AUTH` | api | Daily Test USDT quota for authenticated claimers (default `100`; see Status). |
| `WEEKLY_CAP_KITE` | api | 7-day hard cap of KITE per address (default `100`). |
| `FAUCET_BLOCKLIST` | api | Comma-separated list of addresses to reject. |
| `FAUCET_DB` | api | Path to the SQLite file (defaults to `packages/api/faucet.db`). |
| `VITE_FAUCET_API` | web | Base URL of the deployed API. If unset, the web app reports the API as not configured. |

To set up the API env file:

```bash
cp packages/api/.env.example packages/api/.env
# then put a *funded testnet* private key in packages/api/.env
```

### Running

From the repo root:

```bash
pnpm dev:api    # API at http://localhost:8787
pnpm dev:web    # Web at http://localhost:3000 (dev proxy forwards /api -> :8787)
```

Or per package:

```bash
pnpm --filter api dev      # tsx watch
pnpm --filter web dev      # vite dev server
```

Build / type-check:

```bash
pnpm build      # build all packages
pnpm lint       # tsc --noEmit across all packages
```

## Usage

The API exposes the following routes:

| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | Health check; returns service name and version. |
| POST | `/drip` | Body `{ "address": "0x..." }`. Drips KITE + Test USDT, records the drip, and returns the transaction hashes and an explorer link. |
| GET | `/status` | Faucet wallet address, current KITE and Test USDT balances (wei), and active limits. |
| GET | `/status/limits?address=0x...` | Remaining daily KITE/USDT quota and weekly KITE used for that address (combined with the caller's IP). |

Example claim:

```bash
curl -X POST http://localhost:8787/drip \
  -H 'Content-Type: application/json' \
  -d '{"address":"0xYourTestnetAddress"}'
```

A successful response includes `kite_tx`, `usdt_tx`, the drip amounts, and an `explorer` URL on KiteScan Testnet.

### Network details

- **Chain:** Kite Testnet (`id 2368`), RPC `https://rpc-testnet.gokite.ai`, explorer `https://testnet.kitescan.ai`.
- **Test USDT:** ERC-20 at `0x0fF5393387ad2f9f691FD6Fd28e07E3969e27e63` (18 decimals).

## Project structure

```
.
├── package.json            # root scripts (dev:api, dev:web, build, lint)
├── pnpm-workspace.yaml
└── packages/
    ├── api/
    │   └── src/
    │       ├── index.ts            # Hono app + routes + server
    │       ├── routes/             # drip, status
    │       └── lib/                # wallet (viem), rate-limit, claim-lock, db, erc20-abi
    └── web/
        └── src/                    # React app, components, api-client, chain config
```

## Status

Preview / MVP.

- **Implemented and real:** the Hono API (drip, status, limits), per-IP/per-address rate limiting backed by SQLite, the 7-day per-address KITE cap, the per-claim in-process lock, the serialized nonce queue, the address blocklist, and the React UI.
- **Not yet implemented:** authenticated (higher-quota) claims. The auth code path and `DAILY_*_AUTH` limits exist, but no sign-in is wired in — every request is treated as anonymous. The UI labels GitHub sign-in as a `v0.2` item.
- **Operational requirement:** real drips only work when the API is running on a persistent host with a funded testnet wallet configured via `FAUCET_PRIVATE_KEY`. With only the web app deployed (and `VITE_FAUCET_API` unset), the UI shows an "API not connected" notice.
- **Tests:** none in the repo. `pnpm lint` runs TypeScript type-checking only.
- **Mainnet:** intentionally unsupported.

## License

MIT — see [LICENSE](LICENSE).
