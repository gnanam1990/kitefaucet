import { Hono } from "hono";
import { checkRateLimit, recordDrip, LIMITS } from "../lib/rate-limit";
import { acquireClaimLock } from "../lib/claim-lock";
import { dripNativeKite, dripTestUsdt } from "../lib/wallet";

const drip = new Hono();

const BLOCKLIST = new Set<string>(
  (process.env.FAUCET_BLOCKLIST ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean)
);

drip.post("/", async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const address = String(body.address ?? "").trim();
  const ip =
    c.req.header("cf-connecting-ip") ??
    c.req.header("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown";

  if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
    return c.json({ error: "Invalid address format" }, 400);
  }
  if (BLOCKLIST.has(address.toLowerCase())) {
    return c.json({ error: "Address blocked" }, 403);
  }

  // GitHub OAuth would attach c.set("githubUser", ...) before this handler. v0.1 omits it.
  const githubId: number | undefined = undefined;

  // Hold an in-process lock across check -> drip -> record so concurrent
  // claims for the same address/IP cannot both pass the rate-limit check
  // before either records its drip (double-claim race).
  const release = acquireClaimLock([address, ip]);
  if (!release) {
    return c.json(
      { error: "A claim for this address is already in progress." },
      429
    );
  }

  try {
    const check = checkRateLimit({ address, ip, githubId });
    if (!check.allowed) {
      return c.json({ error: check.reason, ...check }, 429);
    }

    const kiteAmount = githubId ? LIMITS.AUTH_DAILY_KITE : LIMITS.ANON_DAILY_KITE;
    const usdtAmount = githubId ? LIMITS.AUTH_DAILY_USDT : LIMITS.ANON_DAILY_USDT;

    const kiteTx = await dripNativeKite(address as `0x${string}`, kiteAmount);
    const usdtTx = await dripTestUsdt(address as `0x${string}`, usdtAmount);

    recordDrip({
      address,
      ip,
      githubId,
      kiteAmount,
      usdtAmount,
      kiteTx,
      usdtTx,
    });

    return c.json({
      ok: true,
      kite_amount: kiteAmount,
      usdt_amount: usdtAmount,
      kite_tx: kiteTx,
      usdt_tx: usdtTx,
      explorer: `https://testnet.kitescan.ai/address/${address}`,
    });
  } catch (e) {
    return c.json(
      { error: "Faucet error", message: (e as Error).message },
      500
    );
  } finally {
    release();
  }
});

export default drip;
