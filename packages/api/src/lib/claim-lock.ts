// In-process guard against concurrent claims for the same address or IP.
//
// The rate-limit check (read) and recordDrip (write) are separated by the
// awaited on-chain drip, which opens a time-of-check/time-of-use window: two
// concurrent /drip requests for the same address can both pass checkRateLimit
// before either records a row, letting the faucet pay out twice (or N times).
//
// The faucet runs as a single process sharing one wallet client and nonce
// queue (see README "Nonce safety"), so an in-process set of in-flight keys is
// sufficient to serialize claim eligibility: while a drip is in flight for a
// given address/IP, any other claim touching that address or IP is rejected,
// guaranteeing it only re-checks rate limits after the first drip is recorded.

const inFlight = new Set<string>();

/**
 * Try to acquire the claim lock for every supplied key (address, IP, …).
 * Returns a release function on success, or null if any key is already locked.
 */
export function acquireClaimLock(keys: string[]): (() => void) | null {
  const normalized = keys
    .map((k) => k.trim().toLowerCase())
    .filter(Boolean);

  for (const key of normalized) {
    if (inFlight.has(key)) return null;
  }

  for (const key of normalized) {
    inFlight.add(key);
  }

  let released = false;
  return () => {
    if (released) return;
    released = true;
    for (const key of normalized) {
      inFlight.delete(key);
    }
  };
}
