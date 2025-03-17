import { generateAPIRoute } from "@/app/api/utils";
import { computeWalletAddress } from "@/lib/blockchain";
import { datastore, rpID, rpOrigin } from "@/lib/server";
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
    const body = (await request.json()) as ComputeWalletAddressRequest;
    if (!body.response || body.nonce === undefined) {
      return { status: 400, json: { detail: "Missing required fields" } };
    }
    // nonceは0以上でなければならない
    if (body.nonce < 0) {
      return { status: 400, json: { detail: "Nonce must be non-negative" } };
    }

    // challengeをデコードしてDBから認証用Optionsを取得
    const clientDataJSON = decodeClientDataJSON(
      body.response.response.clientDataJSON
    );
    const currentOptions = await datastore.getAuthenticationOptions(
      clientDataJSON.challenge
    );
    if (!currentOptions) {
      return { status: 400, json: { detail: "Invalid challenge" } };
    }

    // 指定IDに一致するパスキーを探す
    const passkey = await datastore.getPasskey(body.response.id);
    if (!passkey) {
      return { status: 404, json: { detail: "Passkey not found" } };
    }

    // デバイス認証の結果を検証
    let verification: VerifiedAuthenticationResponse;
    try {
      verification = await verifyAuthenticationResponse({
        response: body.response,
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
        Uint8Array.from(passkey.publicKey),
        body.nonce
      );
      address = computed;
    } catch (error) {
      console.error(error);
      return { status: 400, json: { detail: String(error) } };
    }

    return {
      status: 200,
      json: { passkeyID: passkey.id, nonce: body.nonce, address },
    };
  }
);
