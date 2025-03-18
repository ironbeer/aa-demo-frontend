/**
 * サーバーサイド限定の環境変数
 */

import type { Hex } from "viem";
export * from "./public";

const $ = process.env;

// トランザクション送信に使用するアカウント
export const bundlerPrivateKey = $.BUNDLER_PRIVATE_KEY as Hex;
