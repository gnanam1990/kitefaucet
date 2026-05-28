import {
  createPublicClient,
  createWalletClient,
  defineChain,
  http,
  parseEther,
  parseUnits,
} from "viem";
import { privateKeyToAccount, type PrivateKeyAccount } from "viem/accounts";
import { ERC20_ABI } from "./erc20-abi";

export const kiteTestnet = defineChain({
  id: 2368,
  name: "Kite Testnet",
  nativeCurrency: { name: "KITE", symbol: "KITE", decimals: 18 },
  rpcUrls: { default: { http: ["https://rpc-testnet.gokite.ai"] } },
  blockExplorers: { default: { name: "KiteScan Testnet", url: "https://testnet.kitescan.ai" } },
});

export const TEST_USDT = "0x0fF5393387ad2f9f691FD6Fd28e07E3969e27e63" as const;

const PRIVATE_KEY = process.env.FAUCET_PRIVATE_KEY as `0x${string}` | undefined;

export const publicClient = createPublicClient({ chain: kiteTestnet, transport: http() });

let account: PrivateKeyAccount | null = null;
let walletClient: ReturnType<typeof createWalletClient> | null = null;
let txQueue: Promise<unknown> = Promise.resolve();
let nextNonce: number | null = null;

function getAccount() {
  if (!PRIVATE_KEY || !PRIVATE_KEY.startsWith("0x")) {
    throw new Error("FAUCET_PRIVATE_KEY env var is required (testnet wallet)");
  }
  account ??= privateKeyToAccount(PRIVATE_KEY);
  return account;
}

export function getWalletClient() {
  const account = getAccount();
  walletClient ??= createWalletClient({ account, chain: kiteTestnet, transport: http() });
  return walletClient;
}

function enqueueTx<T>(send: (nonce: number) => Promise<T>): Promise<T> {
  const run = txQueue.then(async () => {
    const account = getAccount();
    if (nextNonce === null) {
      nextNonce = await publicClient.getTransactionCount({
        address: account.address,
        blockTag: "pending",
      });
    }
    const nonce = nextNonce;
    nextNonce += 1;
    try {
      return await send(nonce);
    } catch (error) {
      nextNonce = null;
      throw error;
    }
  });
  txQueue = run.catch(() => undefined);
  return run;
}

export async function dripNativeKite(to: `0x${string}`, amount: number): Promise<`0x${string}`> {
  return enqueueTx((nonce) => {
    return getWalletClient().sendTransaction({
      account: getAccount(),
      chain: kiteTestnet,
      to,
      value: parseEther(String(amount)),
      nonce,
    });
  });
}

export async function dripTestUsdt(to: `0x${string}`, amount: number): Promise<`0x${string}`> {
  return enqueueTx((nonce) => {
    return getWalletClient().writeContract({
      account: getAccount(),
      chain: kiteTestnet,
      address: TEST_USDT,
      abi: ERC20_ABI,
      functionName: "transfer",
      args: [to, parseUnits(String(amount), 18)],
      nonce,
    });
  });
}

export async function getFaucetBalance() {
  const account = getAccount();
  const [native, usdt] = await Promise.all([
    publicClient.getBalance({ address: account.address }),
    publicClient.readContract({
      address: TEST_USDT,
      abi: ERC20_ABI,
      functionName: "balanceOf",
      args: [account.address],
    }),
  ]);
  return { kite: native.toString(), usdt: usdt.toString(), address: account.address };
}
