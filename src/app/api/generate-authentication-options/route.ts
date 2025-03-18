import { generateAPIRoute } from "@/app/api/utils";
import { rpID } from "@/envs/server";
import { datastore } from "@/lib/datastore";
import { GenerateAuthenticationOptionsResponse } from "@/lib/types";
import { generateAuthenticationOptions } from "@simplewebauthn/server";

export const GET = generateAPIRoute<GenerateAuthenticationOptionsResponse>(
  async () => {
    // 認証用Optionsを生成してDBに保存
    const options = await generateAuthenticationOptions({ rpID });
    await datastore.storeAuthenticationOptions(options);
    return { status: 200, json: options };
  }
);
