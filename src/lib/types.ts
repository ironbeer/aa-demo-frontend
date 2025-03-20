import type {
  AuthenticationResponseJSON,
  PublicKeyCredentialCreationOptionsJSON,
  PublicKeyCredentialRequestOptionsJSON,
  RegistrationResponseJSON,
} from "@simplewebauthn/browser";
import type {
  AuthenticatorTransportFuture,
  Base64URLString,
  CredentialDeviceType,
} from "@simplewebauthn/server";
import { Address, Hex } from "viem";

/**
 * It is strongly advised that credentials get their own DB
 * table, ideally with a foreign key somewhere connecting it
 * to a specific UserModel.
 *
 * "SQL" tags below are suggestions for column data types and
 * how best to store data received during registration for use
 * in subsequent authentications.
 */
export type Passkey = {
  // SQL: Store as `TEXT`. Index this column
  id: Base64URLString;
  // SQL: Store raw bytes as `BYTEA`/`BLOB`/etc...
  //      Caution: Node ORM's may map this to a Buffer on retrieval,
  //      convert to Uint8Array as necessary
  publicKey: number[];
  // SQL: Store as `TEXT`. Index this column. A UNIQUE constraint on
  //      (webAuthnUserID + user) also achieves maximum user privacy
  webAuthnUserID: Base64URLString;
  // SQL: Consider `BIGINT` since some authenticators return atomic timestamps as counters
  counter: number;
  // SQL: `VARCHAR(32)` or similar, longest possible value is currently 12 characters
  // Ex: 'singleDevice' | 'multiDevice'
  deviceType: CredentialDeviceType;
  // SQL: `BOOL` or whatever similar type is supported
  backedUp: boolean;
  // SQL: `VARCHAR(255)` and store string array as a CSV string
  // Ex: ['ble' | 'cable' | 'hybrid' | 'internal' | 'nfc' | 'smart-card' | 'usb']
  transports?: AuthenticatorTransportFuture[];
};

/**
 * API呼び出しエラー
 */
export type APIError = { detail: string | object };

/**
 * パスキー登録用Options取得APIのリクエスト型
 */
export type GenerateRegistrationOptionsRequest = {
  // パスキーの名前
  keyName: string;
};

/**
 * パスキー登録用Options取得APIのレスポンス型
 */
export type GenerateRegistrationOptionsResponse =
  PublicKeyCredentialCreationOptionsJSON;

/**
 * パスキー登録デバイス認証結果検証APIのリクエスト型
 */
export type VerifyRegistrationRequest = {
  response: RegistrationResponseJSON;
  chainID: ChainID;
};

/**
 * パスキー登録デバイス認証結果検証APIのレスポンス型
 */
export type VerifiedRegistrationResponse = {
  passkeyID: string;
  nonce: 0;
  address: Address; // 公開鍵とnonce=0から計算されたウォレットアドレス
};

/**
 * パスキー認証用Options取得APIのレスポンス型
 */
export type GenerateAuthenticationOptionsResponse =
  PublicKeyCredentialRequestOptionsJSON;

/**
 * ウォレットアドレス取得APIのリクエスト型
 */
export type ComputeWalletAddressRequest = {
  response: AuthenticationResponseJSON;
  chainID: ChainID;
  nonce: number; // ナンス値、ウォレットアドレス計算に使用される
};

/**
 * ウォレットアドレス取得APIのレスポンス型
 */
export type ComputeWalletAddressResponse = {
  passkeyID: string;
  address: Address;
};

/**
 * AccountAbstractionで定義されているUserOperation型
 */
export type EntryPoint_UserOperation = {
  sender: Address;
  nonce: string;
  initCode: Hex;
  callData: Hex;
  callGasLimit: number;
  verificationGasLimit: number;
  preVerificationGas: number;
  maxFeePerGas: number;
  maxPriorityFeePerGas: number;
  paymasterAndData: Hex;
  signature: Hex;
};

/**
 * CoinbaseSmartWalletで定義されているCall型
 */
export type CoinbaseSmartWallet_Call = {
  target: Address;
  value: string;
  data: Hex;
};

/**
 * CoinbaseSmartWalletで定義されているWebAuthnAuth型
 */
export type CoinbaseSmartWallet_WebAuthnAuth = {
  authenticatorData: Hex;
  clientDataJSON: string;
  challengeIndex: bigint;
  typeIndex: bigint;
  r: bigint;
  s: bigint;
};

/**
 * CoinbaseSmartWalletで定義されているSignatureWrapper型
 */
export type CoinbaseSmartWallet_SignatureWrapper = {
  ownerIndex: number;
  signatureData: Hex; // should be `abi.encode(WebAuthnAuth)`
};

/**
 * UserOperation署名用Options取得APIのリクエスト型
 */
export type GenerateUserOperationHashOptionsRequest = {
  passkeyID: Base64URLString;
  chainID: ChainID;
  userOp: EntryPoint_UserOperation;
  walletNonce: number;
  usePaymaster: boolean;
};

/**
 * UserOperation署名用Options取得APIのレスポンス型
 */
export type GenerateUserOperationHashOptionsResponse = {
  options: PublicKeyCredentialRequestOptionsJSON;
  userOp: EntryPoint_UserOperation; // initCode等が追加されている
  userOpHash: Hex;
};

/**
 * UserOperation実行APIのリクエスト型
 */
export type ExecuteUserOperationRequest = {
  response: AuthenticationResponseJSON;
  chainID: ChainID;
  userOp: EntryPoint_UserOperation;
};

/**
 * UserOperation実行APIのレスポンス型
 */
export type ExecuteUserOperationResponse = {
  success: boolean;
  receipt: {
    transaction: Hex;
    gasUsed: number;
    status: "success" | "reverted";
  };
};

/**
 * チェーン情報
 */
export type ChainID = "localhost" | "oasys_testnet" | "oasys_sandverse";
export type ChainConfig = {
  id: ChainID;
  name: string;
  rpc: string;
  explorer: string;
};
