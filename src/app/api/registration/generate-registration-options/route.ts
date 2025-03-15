import { NextRequest } from "next/server";
import { generateRegistrationOptions } from "@simplewebauthn/server";
import { rpName, rpID, datastore } from "@/lib/server";
import {
  GenerateRegistrationOptionsRequest,
  GenerateRegistrationOptionsResponse,
} from "@/lib/types";
import { generateAPIRoute } from "@/app/api/utils";

export const POST = generateAPIRoute<GenerateRegistrationOptionsResponse>(
  async (request: NextRequest) => {
    const body = (await request.json()) as GenerateRegistrationOptionsRequest;
    if (!body.key_name) {
      return { status: 400, json: { detail: "key_name is required" } };
    }

    // 登録開始用Optionsを生成してDBに保存
    const options = await generateRegistrationOptions({
      rpName,
      rpID,
      userName: body.key_name,
      // Don't prompt users for additional information about the authenticator
      // (Recommended for smoother UX)
      attestationType: "none",
      // See "Guiding use of authenticators via authenticatorSelection" below
      authenticatorSelection: {
        // Defaults
        residentKey: "preferred",
        userVerification: "preferred",
        // Optional
        authenticatorAttachment: "platform",
      },
    });

    await datastore.storeRegistrationOptions(options);
    return { status: 200, json: options };
  }
);
