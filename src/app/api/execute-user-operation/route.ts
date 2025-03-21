import { generateAPIRoute } from "@/app/api/utils";
import {
  bundlerPrivateKey,
  rpID,
  rpOrigin,
  supportedChains,
} from "@/envs/server";
import {
  getPublicClient,
  getUserOpSignature,
  getWritableClient,
  getWritableEntryPoint,
  isHexEqual,
  uint8ArrToHex,
} from "@/lib/blockchain";
import { datastore } from "@/lib/datastore";
import {
  ExecuteUserOperationRequest,
  ExecuteUserOperationResponse,
} from "@/lib/types";
import {
  VerifiedAuthenticationResponse,
  verifyAuthenticationResponse,
} from "@simplewebauthn/server";
import {
  decodeClientDataJSON,
  isoBase64URL,
} from "@simplewebauthn/server/helpers";
import { NextRequest } from "next/server";
import {
  Address,
  ContractFunctionExecutionError,
  Hex,
  TransactionReceipt,
  isAddressEqual,
  parseEventLogs,
} from "viem";

export const maxDuration = 30;

export const POST = generateAPIRoute<ExecuteUserOperationResponse>(
  async (request: NextRequest) => {
    const { response, chainID, userOp } =
      (await request.json()) as ExecuteUserOperationRequest;
    const chain = supportedChains[chainID];

    // 指定IDのパスキーが存在するか確認
    const passkey = await datastore.getPasskey(response.id);
    if (!passkey) {
      return { status: 404, json: { detail: "Passkey not found" } };
    }

    // challengeをデコードしてDBから認証用Optionsを取得
    const clientDataJSON = decodeClientDataJSON(
      response.response.clientDataJSON
    );
    const currentOptions = await datastore.getAuthenticationOptions(
      clientDataJSON.challenge
    );
    if (!currentOptions) {
      return { status: 404, json: { detail: "Options not found" } };
    }

    // デバイス認証の結果を検証
    let verification: VerifiedAuthenticationResponse;
    try {
      verification = await verifyAuthenticationResponse({
        response: response,
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

    // challengeからuserOpHashを復元
    const userOpHash = uint8ArrToHex(
      isoBase64URL.toBuffer(currentOptions.challenge)
    );

    // UserOperation.signatureをセット
    userOp.signature = getUserOpSignature(0, response.response);

    // EntryPoint.handleOpsを呼び出す
    let receipt: TransactionReceipt;
    let success: boolean;
    try {
      const client = {
        public: getPublicClient(chain.rpc),
        wallet: getWritableClient(chain.rpc, bundlerPrivateKey),
      };
      const entryPoint = getWritableEntryPoint({ client });
      const hash = await entryPoint.write.handleOps([
        [userOp],
        client.wallet.account!.address, // beneficiary
      ]);

      receipt = await client.public.waitForTransactionReceipt({
        hash,
        confirmations: 1,
      });

      // Receiptが成功でも内部callが失敗している可能性があるのでイベントログを確認
      success = parseEventLogs({
        abi: entryPoint.abi,
        logs: receipt.logs,
      })
        .filter((x) => isAddressEqual(x.address, entryPoint.address))
        .every((x) => {
          console.log(x);

          // これがある場合は失敗
          if (x.eventName === "UserOperationRevertReason") {
            return false;
          }
          // 無関係なイベントなので無視
          if (x.eventName !== "UserOperationEvent") {
            return true;
          }
          const args = x.args as {
            sender: Address;
            userOpHash: Hex;
            success: boolean;
          };
          return (
            isAddressEqual(args.sender, userOp.sender) &&
            isHexEqual(args.userOpHash, userOpHash) &&
            args.success
          );
        });
    } catch (error) {
      console.error(error);
      if (error instanceof ContractFunctionExecutionError) {
        return { status: 400, json: { detail: error.message } };
      }
      return { status: 500, json: { detail: String(error) } };
    }

    return {
      status: 200,
      json: {
        success,
        receipt: {
          transaction: receipt.transactionHash,
          gasUsed: Number(receipt.gasUsed),
          status: receipt.status,
        },
      },
    };
  }
);
