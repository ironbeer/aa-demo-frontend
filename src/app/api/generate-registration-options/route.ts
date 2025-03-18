import { generateAPIRoute } from "@/app/api/utils";
import { rpID, rpName } from "@/envs/server";
import { datastore } from "@/lib/datastore";
import {
  GenerateRegistrationOptionsRequest,
  GenerateRegistrationOptionsResponse,
} from "@/lib/types";
import { generateRegistrationOptions } from "@simplewebauthn/server";
import { NextRequest } from "next/server";

export const POST = generateAPIRoute<GenerateRegistrationOptionsResponse>(
  async (request: NextRequest) => {
    const body = (await request.json()) as GenerateRegistrationOptionsRequest;
    if (!body.keyName) {
      return { status: 400, json: { detail: "key_name is required" } };
    }

    // 登録用Optionsを生成してDBに保存
    const options = await generateRegistrationOptions({
      rpName,
      rpID,
      userName: body.keyName,
      // Don't prompt users for additional information about the authenticator
      // (Recommended for smoother UX)
      attestationType: "none",
      // See "Guiding use of authenticators via authenticatorSelection" below
      authenticatorSelection: {
        // Defaults
        residentKey: "preferred",
        userVerification: "preferred",
        // Optional
        authenticatorAttachment: "cross-platform",
      },
    });

    await datastore.storeRegistrationOptions(options);
    return { status: 200, json: options };
  }
);
