import { generateAPIRoute } from "@/app/api/utils";
import { rpID, rpOrigin } from "@/envs/server";
import { computeWalletAddress } from "@/lib/blockchain";
import { datastore } from "@/lib/datastore";
import {
  Passkey,
  VerifiedRegistrationResponse,
  VerifyRegistrationRequest,
} from "@/lib/types";
import {
  VerifiedRegistrationResponse as VerifiedRegistrationResponseServer,
  verifyRegistrationResponse,
} from "@simplewebauthn/server";
import { decodeClientDataJSON } from "@simplewebauthn/server/helpers";
import { NextRequest } from "next/server";
import { Address } from "viem";

export const POST = generateAPIRoute<VerifiedRegistrationResponse>(
  async (request: NextRequest) => {
    // リクエストが正しいか確認
    const body = (await request.json()) as VerifyRegistrationRequest;
    if (!body.id) {
      return { status: 400, json: { detail: "Missing required fields" } };
    }

    // challengeをデコードしてDBから登録開始用Optionsを取得
    const clientDataJSON = decodeClientDataJSON(body.response.clientDataJSON);
    const currentOptions = await datastore.getRegistrationOptions(
      clientDataJSON.challenge
    );
    if (!currentOptions) {
      return { status: 400, json: { detail: "Invalid challenge" } };
    }

    // デバイス認証の結果を検証
    let verification: VerifiedRegistrationResponseServer;
    try {
      verification = await verifyRegistrationResponse({
        response: body,
        expectedChallenge: currentOptions.challenge,
        expectedOrigin: rpOrigin,
        expectedRPID: rpID,
      });
      if (!verification.verified || !verification.registrationInfo) {
        return { status: 400, json: { detail: "Verification failed" } };
      }
    } catch (error) {
      console.error(error);
      return { status: 400, json: { detail: String(error) } };
    }

    // パスキーをDBに保存
    const { registrationInfo } = verification;
    const { credential, credentialDeviceType, credentialBackedUp } =
      registrationInfo;
    const newPassKey: Passkey = {
      // A unique identifier for the credential
      id: credential.id,
      // The public key bytes, used for subsequent authentication signature verification
      publicKey: Array.from(credential.publicKey),
      // Created by `generateRegistrationOptions()` in Step 1
      webAuthnUserID: currentOptions.user.id,
      // The number of times the authenticator has been used on this site so far
      counter: credential.counter,
      // How the browser can talk with this credential's authenticator
      transports: credential.transports,
      // Whether the passkey is single-device or multi-device
      deviceType: credentialDeviceType,
      // Whether the passkey has been backed up in some way
      backedUp: credentialBackedUp,
    };

    // 保存済みの場合はエラー
    if (await datastore.getPasskey(newPassKey.id)) {
      return { status: 400, json: { detail: "Passkey already exists" } };
    }
    await datastore.storePasskey(newPassKey);

    // ウォレットアドレスを計算
    let address: Address;
    try {
      const { address: computed } = await computeWalletAddress(
        Uint8Array.from(newPassKey.publicKey),
        0
      );
      address = computed;
    } catch (error) {
      console.error(error);
      return { status: 400, json: { detail: String(error) } };
    }

    return {
      status: 200,
      json: { passkeyID: newPassKey.id, nonce: 0, address },
    };
  }
);
