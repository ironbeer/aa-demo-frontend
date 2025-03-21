import {
  coinbaseSmartWalletFactoryAddress,
  entryPointAddress,
} from "@/envs/public";
import {
  CoinbaseSmartWallet_Call,
  CoinbaseSmartWallet_SignatureWrapper,
  CoinbaseSmartWallet_WebAuthnAuth,
} from "@/lib/types";
import {
  AuthenticatorAssertionResponseJSON,
  Base64URLString,
} from "@simplewebauthn/server";
import {
  cose,
  decodeCredentialPublicKey,
  isoBase64URL,
} from "@simplewebauthn/server/helpers";
import {
  Abi,
  Address,
  createPublicClient,
  createWalletClient,
  encodeAbiParameters,
  encodeFunctionData,
  encodePacked,
  getContract,
  Hex,
  http,
  parseAbiParameters,
  PublicClient,
  WalletClient,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { getSignatureRS } from "../crypto";
import coinbaseSmartWalletABI from "./abis/CoinbaseSmartWallet.json";
import coinbaseSmartWalletFactoryABI from "./abis/CoinbaseSmartWalletFactory.json";
import entryPointABI from "./abis/IEntryPoint.json";
import tokenPaymasterABI from "./abis/TokenPaymaster.json";

type GetContractParams = {
  client: PublicClient;
  address?: Address;
  abi?: Abi;
};

type GetWritableContractParams = {
  client: {
    public: PublicClient;
    wallet: WalletClient;
  };
  address?: Address;
  abi?: Abi;
};

// ブラウザ向けのシングルトンRPCクライアント
let browserClient: PublicClient;

/**
 * RPCクライアント取得
 */
export const getPublicClient = (url: string): PublicClient => {
  // ブラウザにはシングルトンを返す
  if (typeof window !== "undefined") {
    if (!browserClient) {
      browserClient = createPublicClient({ transport: http(url) });
    }
    return browserClient;
  }

  // サーバーには都度返す
  return createPublicClient({ transport: http(url) });
};

/**
 * トランザクション可能なRPCクライアント取得
 */
export const getWritableClient = (
  url: string,
  privateKey: Hex
): WalletClient => {
  const account = privateKeyToAccount(privateKey);
  return createWalletClient({ transport: http(url), account });
};

/**
 * EntryPointのインスタンスを取得
 */
export const getEntryPoint = ({
  client,
  address = entryPointAddress,
  abi = entryPointABI as Abi,
}: GetContractParams) => {
  return getContract({ client, address, abi });
};
export const getWritableEntryPoint = ({
  client,
  address = entryPointAddress,
  abi = entryPointABI as Abi,
}: GetWritableContractParams) => {
  return getContract({ client, address, abi });
};

/**
 * CoinbaseSmartWalletFactoryのインスタンスを取得
 */
export const getCoinbaseSmartWalletFactory = ({
  client,
  address = coinbaseSmartWalletFactoryAddress,
  abi = coinbaseSmartWalletFactoryABI as Abi,
}: GetContractParams) => {
  return getContract({ client, address, abi });
};

/**
 * Uint8Arrayを16進数文字列に変換
 */
export const uint8ArrToHex = (arr: Uint8Array): Hex => {
  return ("0x" +
    [...arr].map((x) => x.toString(16).padStart(2, "0")).join("")) as Hex;
};

/**
 * Base64URLを16進数文字列に変換
 */
export const base64urlToHex = (base64url: Base64URLString): Hex => {
  const buf = isoBase64URL.toBuffer(base64url);
  return uint8ArrToHex(buf);
};

/**
 * 16進数文字列が等しいか判定
 */
export const isHexEqual = (a: Hex, b: Hex) => {
  return a.toLowerCase() === b.toLowerCase();
};

/**
 * CoinbaseSmartWalletFactoryを利用してウォレットアドレスを計算
 */
export const computeWalletAddress = async (
  client: PublicClient,
  publicKey: Uint8Array,
  nonce: number
): Promise<{ address: Address; owners: Hex[] }> => {
  // 公開鍵からx,y座標を取得
  const coseKey = decodeCredentialPublicKey(publicKey);
  if (!cose.isCOSEPublicKeyEC2(coseKey)) {
    throw new Error("Invalid public key");
  }
  const x = coseKey.get(cose.COSEKEYS.x);
  const y = coseKey.get(cose.COSEKEYS.y);
  if (!x || !y) {
    throw new Error("Invalid public key");
  }

  // x,yを連結したbytesがウォレットの所有者になる
  const owners = [uint8ArrToHex(Uint8Array.from([...x, ...y]))];
  const contract = getCoinbaseSmartWalletFactory({ client });
  const address = await contract.read.createAccount([owners, nonce]);
  return { address: address as Address, owners: owners as Hex[] };
};

/**
 * CoinbaseSmartWallet.executeBatch向けにabi.encodeWithSelector()
 */
export const encodeCallsForExecuteBatch = (
  calls: CoinbaseSmartWallet_Call[]
): Hex => {
  return encodeFunctionData({
    abi: coinbaseSmartWalletABI,
    functionName: "executeBatch",
    args: [calls.map(({ target, value, data }) => ({ target, value, data }))],
  });
};

/**
 * CoinbaseSmartWalletFactory.createAccount向けにabi.encodePacked()
 */
export const encodeForCreateAccount = (owners: Hex[], nonce: number) => {
  return encodePacked(
    ["address", "bytes"],
    [
      coinbaseSmartWalletFactoryAddress,
      encodeFunctionData({
        abi: coinbaseSmartWalletFactoryABI,
        functionName: "createAccount",
        args: [owners, nonce],
      }),
    ]
  );
};

/**
 * CoinbaseSmartWallet_WebAuthnAuthをを返す
 */
export const getWebAuthnAuth = (
  data: AuthenticatorAssertionResponseJSON
): CoinbaseSmartWallet_WebAuthnAuth => {
  const clientDataJSON = isoBase64URL.toUTF8String(data.clientDataJSON);
  const challengeIndex = BigInt(clientDataJSON.search(/"challenge"/));
  const typeIndex = BigInt(clientDataJSON.search(/"type"/));
  if (challengeIndex < 0 || typeIndex < 0) {
    throw new Error("Invalid clientDataJSON");
  }

  const signature = uint8ArrToHex(isoBase64URL.toBuffer(data.signature));
  const { r, s } = getSignatureRS(signature);

  return {
    authenticatorData: base64urlToHex(data.authenticatorData),
    clientDataJSON: clientDataJSON,
    challengeIndex,
    typeIndex,
    r,
    s,
  };
};

/**
 * CoinbaseSmartWallet_SignatureWrapperを返す
 */
export const getSignatureWrapper = (
  ownerIndex: number,
  webAuthnAuth: CoinbaseSmartWallet_WebAuthnAuth
): CoinbaseSmartWallet_SignatureWrapper => {
  return {
    ownerIndex,
    signatureData: encodeWebAuthnAuth(webAuthnAuth),
  };
};

/**
 * CoinbaseSmartWallet_WebAuthnAuthをabi.encode()
 */
export const encodeWebAuthnAuth = (
  data: CoinbaseSmartWallet_WebAuthnAuth
): Hex => {
  return encodeAbiParameters(
    parseAbiParameters("(bytes,string,uint256,uint256,uint256,uint256)"),
    [
      [
        data.authenticatorData as Hex,
        data.clientDataJSON,
        data.challengeIndex,
        data.typeIndex,
        data.r,
        data.s,
      ],
    ]
  );
};

/**
 * CoinbaseSmartWallet_SignatureWrapperをabi.encode()
 */
export const encodeSignatureWrapper = (
  data: CoinbaseSmartWallet_SignatureWrapper
): Hex => {
  return encodeAbiParameters(parseAbiParameters("(uint256,bytes)"), [
    [BigInt(data.ownerIndex), data.signatureData],
  ]);
};

/**
 * UserOperation.signatureを作成
 */
export const getUserOpSignature = (
  ownerIndex: number,
  data: AuthenticatorAssertionResponseJSON
): Hex => {
  const webAuthnAuth = getWebAuthnAuth(data);
  const signatureWrapper = getSignatureWrapper(ownerIndex, webAuthnAuth);
  return encodeSignatureWrapper(signatureWrapper);
};

export {
  coinbaseSmartWalletABI,
  coinbaseSmartWalletFactoryABI,
  entryPointABI,
  tokenPaymasterABI,
};
