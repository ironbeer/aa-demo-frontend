/**
 * NEXT_PUBLICで始まる秘匿情報を含まない環境変数
 */

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

// ブロックチェーンのRPCエンドポイント
export const rpcURL =
  process.env.NEXT_PUBLIC_RPC_ENDPOINT || "http://localhost:8545";

// EntryPointコントラクトのアドレス
export const entryPointAddress = process.env
  .NEXT_PUBLIC_AA_ENTRY_POINT as Address;

// CoinbaseSmartWalletFactoryのアドレス
export const coinbaseSmartWalletFactoryAddress = process.env
  .NEXT_PUBLIC_COINBASE_SMART_WALLET_FACTORY as Address;

// Paymasterトークンアドレス
export const paymasterAddress = process.env.NEXT_PUBLIC_PAYMASTER as Address;

// トランザクション送信に使用するアカウント
export const bundlerAddress = process.env
  .NEXT_PUBLIC_BUNDLER_ADDRESS as Address;

// エクスプローラURL
export const explorerURL = process.env.NEXT_PUBLIC_EXPLORER_URL as string;

// PaymasterのエクスプローラURL
export const paymasterURL = `${explorerURL}/address/${paymasterAddress}`;

// BunderのエクスプローラURL
export const bundlerURL = `${explorerURL}/address/${bundlerAddress}`;
