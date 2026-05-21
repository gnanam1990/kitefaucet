import { db } from "./db";

export interface DripCheck {
  allowed: boolean;
  reason?: string;
  daily_kite_remaining: number;
  daily_usdt_remaining: number;
  weekly_kite_used: number;
}

const ANON_DAILY_KITE = Number(process.env.DAILY_KITE_ANON ?? 5);
const ANON_DAILY_USDT = Number(process.env.DAILY_USDT_ANON ?? 10);
const AUTH_DAILY_KITE = Number(process.env.DAILY_KITE_AUTH ?? 25);
const AUTH_DAILY_USDT = Number(process.env.DAILY_USDT_AUTH ?? 100);
const WEEKLY_HARD_CAP_KITE = Number(process.env.WEEKLY_CAP_KITE ?? 100);

export function checkRateLimit(opts: {
  address: string;
  ip: string;
  githubId?: number;
}): DripCheck {
  const now = Date.now();
  const dayAgo = now - 24 * 60 * 60 * 1000;
  const weekAgo = now - 7 * 24 * 60 * 60 * 1000;

  const dayLimit = opts.githubId ? AUTH_DAILY_KITE : ANON_DAILY_KITE;
  const dayUsdtLimit = opts.githubId ? AUTH_DAILY_USDT : ANON_DAILY_USDT;

  const weekly = db
    .prepare(
      `SELECT COALESCE(SUM(kite_amount), 0) AS total FROM drips
       WHERE address = ? AND created_at > ?`
    )
    .get(opts.address.toLowerCase(), weekAgo) as { total: number };

  if (weekly.total >= WEEKLY_HARD_CAP_KITE) {
    return {
      allowed: false,
      reason: "7-day hard cap reached for this address",
      daily_kite_remaining: 0,
      daily_usdt_remaining: 0,
      weekly_kite_used: weekly.total,
    };
  }

  const todayRow = opts.githubId
    ? (db
        .prepare(
          `SELECT COALESCE(SUM(kite_amount), 0) AS kite, COALESCE(SUM(usdt_amount), 0) AS usdt
           FROM drips WHERE github_id = ? AND created_at > ?`
        )
        .get(opts.githubId, dayAgo) as { kite: number; usdt: number })
    : (db
        .prepare(
          `SELECT COALESCE(SUM(kite_amount), 0) AS kite, COALESCE(SUM(usdt_amount), 0) AS usdt
           FROM drips WHERE (address = ? OR ip = ?) AND created_at > ?`
        )
        .get(opts.address.toLowerCase(), opts.ip, dayAgo) as { kite: number; usdt: number });

  const remaining_kite = Math.max(0, dayLimit - todayRow.kite);
  const remaining_usdt = Math.max(0, dayUsdtLimit - todayRow.usdt);

  if (remaining_kite <= 0 || remaining_usdt <= 0) {
    return {
      allowed: false,
      reason: opts.githubId
        ? "Daily limit reached. Try again in 24h."
        : "Daily limit reached. Try again in 24h or sign in with GitHub for higher limits.",
      daily_kite_remaining: remaining_kite,
      daily_usdt_remaining: remaining_usdt,
      weekly_kite_used: weekly.total,
    };
  }

  return {
    allowed: true,
    daily_kite_remaining: remaining_kite,
    daily_usdt_remaining: remaining_usdt,
    weekly_kite_used: weekly.total,
  };
}

export function recordDrip(opts: {
  address: string;
  ip: string;
  githubId?: number;
  kiteAmount: number;
  usdtAmount: number;
  kiteTx: string;
  usdtTx: string;
}) {
  db.prepare(
    `INSERT INTO drips (address, ip, github_id, kite_amount, usdt_amount, kite_tx, usdt_tx)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).run(
    opts.address.toLowerCase(),
    opts.ip,
    opts.githubId ?? null,
    opts.kiteAmount,
    opts.usdtAmount,
    opts.kiteTx,
    opts.usdtTx
  );
}

export function recentDripsForAddress(address: string, limit = 5) {
  return db
    .prepare(
      `SELECT address, kite_amount, usdt_amount, kite_tx, usdt_tx, created_at
       FROM drips WHERE address = ?
       ORDER BY created_at DESC LIMIT ?`
    )
    .all(address.toLowerCase(), limit);
}

export const LIMITS = {
  ANON_DAILY_KITE,
  ANON_DAILY_USDT,
  AUTH_DAILY_KITE,
  AUTH_DAILY_USDT,
  WEEKLY_HARD_CAP_KITE,
};
