/**
 * NEXT_PUBLICで始まる秘匿情報を含まない環境変数
 */

import { ChainConfig, ChainID } from "@/lib/types";
import type { Address } from "viem";

// Human-readable title for your website
export const rpName =
  process.env.NEXT_PUBLIC_RP_NAME || "AccountAbstraction demo with WebAuthn";

// A unique identifier for your website. 'localhost' is okay for local dev
export const rpID = process.env.NEXT_PUBLIC_WEBAUTHN_RP_ID || "localhost";

// The URL at which registrations and authentications should occur.
// 'http://localhost' and 'http://localhost:PORT' are also valid.
// Do NOT include any trailing /
export const rpOrigin =
  process.env.NEXT_PUBLIC_WEBAUTHN_ORIGIN || "http://localhost:3000";

// EntryPointコントラクトのアドレス
export const entryPointAddress = process.env
  .NEXT_PUBLIC_AA_ENTRY_POINT as Address;

// CoinbaseSmartWalletFactoryのアドレス
export const coinbaseSmartWalletFactoryAddress = process.env
  .NEXT_PUBLIC_COINBASE_SMART_WALLET_FACTORY as Address;

// Paymasterトークンアドレス
export const paymasterContract = process.env
  .NEXT_PUBLIC_PAYMASTER_CONTRACT as Address;

// トランザクション送信に使用するアカウント
export const bundlerAddress = process.env
  .NEXT_PUBLIC_BUNDLER_ADDRESS as Address;

// サポートするチェーン
export const supportedChains: { [id in ChainID]: ChainConfig } = {
  localhost: {
    id: "localhost",
    name: "Localhost",
    rpc: process.env.NEXT_PUBLIC_LOCAL_RPC || "http://localhost:8545",
    explorer: process.env.NEXT_PUBLIC_LOCAL_EXPLORER || "http://localhost:4000",
  },
  oasys_testnet: {
    id: "oasys_testnet",
    name: "Oasys Testnet",
    rpc: "https://rpc.testnet.oasys.games",
    explorer: "https://explorer.testnet.oasys.games",
  },
  oasys_sandverse: {
    id: "oasys_sandverse",
    name: "Oasys Sandverse",
    rpc: "https://rpc.sandverse.oasys.games",
    explorer: "https://explorer.sandverse.oasys.games",
  },
};

// ユーザが利用可能なチェーン
export const activeChains = (
  process.env.NEXT_PUBLIC_SUPPORTED_CHAINS ||
  "localhost,oasys_testnet,oasys_sandverse"
)
  .split(",")
  .map((id) => id as ChainID)
  .filter((id) => supportedChains[id])
  .map((id) => supportedChains[id]);
