import {
  createPublicClient,
  createWalletClient,
  defineChain,
  http,
  parseEther,
  parseUnits,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
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

function getAccount() {
  if (!PRIVATE_KEY || !PRIVATE_KEY.startsWith("0x")) {
    throw new Error("FAUCET_PRIVATE_KEY env var is required (testnet wallet)");
  }
  return privateKeyToAccount(PRIVATE_KEY);
}

export function getWalletClient() {
  const account = getAccount();
  return createWalletClient({ account, chain: kiteTestnet, transport: http() });
}

export async function dripNativeKite(to: `0x${string}`, amount: number): Promise<`0x${string}`> {
  return getWalletClient().sendTransaction({
    to,
    value: parseEther(String(amount)),
  });
}

export async function dripTestUsdt(to: `0x${string}`, amount: number): Promise<`0x${string}`> {
  return getWalletClient().writeContract({
    address: TEST_USDT,
    abi: ERC20_ABI,
    functionName: "transfer",
    args: [to, parseUnits(String(amount), 18)],
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
