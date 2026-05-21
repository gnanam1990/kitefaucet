import { Hono } from "hono";
import { getFaucetBalance } from "../lib/wallet";
import { checkRateLimit, LIMITS } from "../lib/rate-limit";

const status = new Hono();

status.get("/", async (c) => {
  try {
    const bal = await getFaucetBalance();
    return c.json({
      ok: true,
      faucet_address: bal.address,
      kite_balance_wei: bal.kite,
      usdt_balance_wei: bal.usdt,
      limits: LIMITS,
    });
  } catch (e) {
    return c.json({ ok: false, error: (e as Error).message }, 500);
  }
});

status.get("/limits", (c) => {
  const address = c.req.query("address");
  const ip =
    c.req.header("cf-connecting-ip") ??
    c.req.header("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown";
  if (!address || !/^0x[a-fA-F0-9]{40}$/.test(address)) {
    return c.json({ error: "address query param required" }, 400);
  }
  return c.json(checkRateLimit({ address, ip }));
});

export default status;
