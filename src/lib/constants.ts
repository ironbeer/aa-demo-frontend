import type { Address, Hex } from "viem";

/**
 * Human-readable title for your website
 */
export const rpName = "AccountAbstraction demo with WebAuthn";

/**
 * A unique identifier for your website. 'localhost' is okay for
 * local dev
 */
export const rpID = process.env.WEBAUTHN_RP_ID || "localhost";

/**
 * The URL at which registrations and authentications should occur.
 * 'http://localhost' and 'http://localhost:PORT' are also valid.
 * Do NOT include any trailing /
 */
export const rpOrigin = process.env.WEBAUTHN_ORIGIN || "http://localhost:3000";

/**
 * ブロックチェーンのRPCエンドポイント
 */
export const rpcURL = process.env.RPC_ENDPOINT || "http://localhost:8545";

/**
 * EntryPointコントラクトのアドレス
 */
export const entryPointAddress =
  (process.env.NEXT_PUBLIC_AA_ENTRY_POINT as Address) ||
  "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789"; // CoinbaseSmartWalletにハードコードされているアドレス

/**
 * CoinbaseSmartWalletFactoryのアドレス
 */
export const coinbaseSmartWalletFactoryAddress =
  (process.env.NEXT_PUBLIC_COINBASE_SMART_WALLET_FACTORY as Address) || "0x";

/**
 * Paymasterトークンアドレス
 */
export const paymasterToken =
  (process.env.NEXT_PUBLIC_PAYMASTER as Address) || "0x";

/**
 * トランザクション送信に使用するアカウント
 */
export const bundlerAccount: {
  address: Address;
  privateKey: Hex;
} = {
  address: (process.env.BUNDLER_ADDRESS as Address) || "0x",
  privateKey: (process.env.BUNDLER_PRIVATE_KEY as Hex) || "0x",
};
