import { generateAPIRoute } from "@/app/api/utils";
import { rpID, rpOrigin, supportedChains } from "@/envs/server";
import { computeWalletAddress, getPublicClient } from "@/lib/blockchain";
import { datastore } from "@/lib/datastore";
import {
  ComputeWalletAddressRequest,
  ComputeWalletAddressResponse,
} from "@/lib/types";
import {
  VerifiedAuthenticationResponse,
  verifyAuthenticationResponse,
} from "@simplewebauthn/server";
import { decodeClientDataJSON } from "@simplewebauthn/server/helpers";
import { NextRequest } from "next/server";
import { Address } from "viem";

export const POST = generateAPIRoute<ComputeWalletAddressResponse>(
  async (request: NextRequest) => {
    // リクエストが正しいか確認
    const { response, chainID, nonce } =
      (await request.json()) as ComputeWalletAddressRequest;
    const chain = supportedChains[chainID];

    // nonceは0以上でなければならない
    if (nonce < 0) {
      return { status: 400, json: { detail: "Nonce must be non-negative" } };
    }

    // challengeをデコードしてDBから認証用Optionsを取得
    const clientDataJSON = decodeClientDataJSON(
      response.response.clientDataJSON
    );
    const currentOptions = await datastore.getAuthenticationOptions(
      clientDataJSON.challenge
    );
    if (!currentOptions) {
      return { status: 400, json: { detail: "Invalid challenge" } };
    }

    // 指定IDに一致するパスキーを探す
    const passkey = await datastore.getPasskey(response.id);
    if (!passkey) {
      return { status: 404, json: { detail: "Passkey not found" } };
    }

    // デバイス認証の結果を検証
    let verification: VerifiedAuthenticationResponse;
    try {
      verification = await verifyAuthenticationResponse({
        response,
        expectedChallenge: currentOptions.challenge,
        expectedOrigin: rpOrigin,
        expectedRPID: rpID,
        credential: {
          id: passkey.id,
          publicKey: Uint8Array.from(passkey.publicKey),
          counter: passkey.counter,
          transports: passkey.transports,
        },
      });
      if (!verification.verified) {
        return { status: 400, json: { detail: "Verification failed" } };
      }
    } catch (error) {
      console.error(error);
      return { status: 400, json: { detail: String(error) } };
    }

    // 認証カウンターを更新する
    passkey.counter = verification.authenticationInfo.newCounter;
    await datastore.storePasskey(passkey);

    // ウォレットアドレスを計算
    let address: Address;
    try {
      const { address: computed } = await computeWalletAddress(
        getPublicClient(chain.rpc),
        Uint8Array.from(passkey.publicKey),
        nonce
      );
      address = computed;
    } catch (error) {
      console.error(error);
      return { status: 400, json: { detail: String(error) } };
    }

    return { status: 200, json: { passkeyID: passkey.id, address } };
  }
);
