import { generateAPIRoute } from "@/app/api/utils";
import { paymasterContract, rpID, supportedChains } from "@/envs/server";
import {
  computeWalletAddress,
  encodeForCreateAccount,
  getEntryPoint,
  getPublicClient,
} from "@/lib/blockchain";
import { datastore } from "@/lib/datastore";
import {
  GenerateUserOperationHashOptionsRequest,
  GenerateUserOperationHashOptionsResponse,
} from "@/lib/types";
import { generateAuthenticationOptions } from "@simplewebauthn/server";
import { NextRequest } from "next/server";
import { encodePacked, Hex, hexToBytes, isAddressEqual } from "viem";

export const POST = generateAPIRoute<GenerateUserOperationHashOptionsResponse>(
  async (request: NextRequest) => {
    const { passkeyID, chainID, userOp, walletNonce, usePaymaster } =
      (await request.json()) as GenerateUserOperationHashOptionsRequest;
    const chain = supportedChains[chainID];

    // 指定IDのパスキーが存在するか確認
    const passkey = await datastore.getPasskey(passkeyID);
    if (!passkey) {
      return { status: 404, json: { detail: "Passkey not found" } };
    }

    // userOp.initCodeにCoinbaseSmartWalletFactoryの呼び出しコードを追加
    const client = getPublicClient(chain.rpc);
    try {
      const code = await client.getCode({ address: userOp.sender });
      if (!code || code.length === 0) {
        const { address: expectedSender, owners } = await computeWalletAddress(
          client,
          Uint8Array.from(passkey.publicKey),
          walletNonce
        );
        if (!isAddressEqual(expectedSender, userOp.sender)) {
          return { status: 400, json: { detail: "Invalid sender address" } };
        }
        userOp.initCode = encodeForCreateAccount(owners, walletNonce);
      }
    } catch (error) {
      console.error(error);
      return { status: 500, json: { detail: String(error) } };
    }

    // paymasterDataを追加
    if (usePaymaster) {
      userOp.paymasterAndData = encodePacked(
        ["address", "bytes"],
        [paymasterContract, "0x"]
      );
    }

    // signature以外の全フィールドが埋まったのでEntryPointのgetUserOpHashを呼び出してWebAuthn用のchallengeを生成
    let userOpHash: Hex;
    let challenge: Uint8Array;
    try {
      const contract = getEntryPoint({ client: client });
      userOpHash = (await contract.read.getUserOpHash([userOp])) as Hex;
      challenge = hexToBytes(userOpHash);
    } catch (error) {
      console.error(error);
      return { status: 500, json: { detail: String(error) } };
    }

    // 認証用Optionsを生成してDBに保存
    const options = await generateAuthenticationOptions({
      rpID,
      challenge,
      allowCredentials: [
        {
          id: passkeyID,
          transports: passkey.transports,
        },
      ],
    });
    await datastore.storeAuthenticationOptions(options);
    return { status: 200, json: { options, userOp, userOpHash } };
  }
);
