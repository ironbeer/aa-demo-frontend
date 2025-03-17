import { generateAuthenticationOptions } from "@simplewebauthn/server";
import { rpID, datastore } from "@/lib/server";
import { GenerateAuthenticationOptionsResponse } from "@/lib/types";
import { generateAPIRoute } from "@/app/api/utils";

export const GET = generateAPIRoute<GenerateAuthenticationOptionsResponse>(
  async () => {
    // 認証用Optionsを生成してDBに保存
    const options = await generateAuthenticationOptions({ rpID });
    await datastore.storeAuthenticationOptions(options);
    return { status: 200, json: options };
  }
);
