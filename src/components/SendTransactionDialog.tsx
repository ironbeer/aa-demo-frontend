import { bundlerAddress, paymasterContract } from "@/envs/public";
import {
  encodeCallsForExecuteBatch,
  getEntryPoint,
  getPublicClient,
} from "@/lib/blockchain";
import {
  executeUserOperation,
  generateUserOpHashOptions,
  startAuthentication,
} from "@/lib/client";
import {
  ChainConfig,
  CoinbaseSmartWallet_Call,
  EntryPoint_UserOperation,
  ExecuteUserOperationResponse,
  LoadingHandler,
} from "@/lib/types";
import { Wallet, useChainStore, useLoggerStore, useWalletStore } from "@/store";
import {
  Box,
  Button,
  Divider,
  Grid2,
  Tooltip,
  Typography,
} from "@mui/material";
import { useRef, useState } from "react";
import { CallEditor } from "./CallEditor";

export type SendTransactionDialogProps = {
  chain: ChainConfig;
  wallet: Wallet;
  onLoading: LoadingHandler;
  onError: () => void;
  onSent: (
    chain: ChainConfig,
    wallet: Wallet,
    response: ExecuteUserOperationResponse
  ) => void;
};

export const SendTransactionDialog: React.FC<SendTransactionDialogProps> = ({
  chain,
  wallet,
  onLoading,
  onSent,
  onError,
}) => {
  const { getExplorerLink } = useChainStore();
  const { replaceCalls } = useWalletStore();
  const { getLogger } = useLoggerStore();
  const logger = getLogger("SendTransaction");

  // CallEditorの初期値をStorageから取得
  const initCalls = useRef(
    useWalletStore.getState().calls[wallet.address] || []
  );
  const [calls, setCalls] = useState(initCalls.current);
  const [isValid, setIsValid] = useState(false);

  // CallEditor内の変更をStorageに保存
  const onChangeCalls = (
    newCalls: CoinbaseSmartWallet_Call[],
    isValid: boolean
  ) => {
    setCalls(newCalls);
    setIsValid(isValid);
    replaceCalls(wallet.address, newCalls);
  };

  // トランザクション送信処理
  const execute = async (usePaymaster: boolean) => {
    if (!isValid) return;

    const client = getPublicClient(chain.rpc);
    const entryPoint = getEntryPoint({ client });

    // ナンス値はEntryPoint.getNonce(address sender, uint192 key)で取得する
    const nonceKey = Math.round(Math.random() * 1e9);
    const nonce = await logger.calllog(
      "entryPoint.getNonce",
      entryPoint.read.getNonce,
      [wallet.address, nonceKey]
    );
    if (typeof nonce !== "bigint") {
      throw new Error("Failed to get nonce");
    }

    // basefeeを取得
    const block = await client.getBlock();
    const basefee = Number(block.baseFeePerGas!);

    // 初回TX時はウォレットコントラクトのデプロイ処理が入るのでガスが多めに必要
    let verificationGasLimitExtra = 0;
    const walletCode = await client.getCode({ address: wallet.address });
    if (!walletCode || walletCode.length === 0) {
      verificationGasLimitExtra = 200_000;
    }

    // UserOperationを作成
    let userOp: EntryPoint_UserOperation = {
      sender: wallet.address,
      nonce: nonce.toString(),
      callData: encodeCallsForExecuteBatch(calls),
      maxFeePerGas: basefee,
      maxPriorityFeePerGas: basefee,
      // TODO: ガスリミットの計算方法が分からないので適当な値を入れている
      callGasLimit: calls.reduce((acc, call) => acc + call.gasLimit, 0),
      verificationGasLimit: 600_000 * calls.length + verificationGasLimitExtra,
      preVerificationGas: 600_000 * calls.length,
      // 以下はAPIサーバ側で追加される
      initCode: "0x",
      paymasterAndData: "0x",
      signature: "0x",
    };

    // APIサーバに認証用OptionsJSONの生成とinitCodeの追加を依頼
    const ophashRes = await logger.calllog(
      "generateUserOpHashOptions",
      generateUserOpHashOptions,
      {
        userOp,
        usePaymaster,
        passkeyID: wallet.passkeyID,
        chainID: chain.id,
        walletNonce: wallet.nonce,
      }
    );

    // 初めてウォレットを利用する場合はinitCodeが追加されているのでuserOpを入れ替える
    userOp = ophashRes.userOp;

    // デバイス認証を開始
    const authRes = await logger.calllog(
      "startAuthentication",
      startAuthentication,
      ophashRes.options
    );

    // APIサーバに認証結果を送信してsignature追加とトランザクション実行を依頼
    const executeRes = await logger.calllog(
      "executeUserOperation",
      executeUserOperation,
      { userOp, response: authRes, chainID: chain.id }
    );

    onSent(chain, wallet, executeRes);
  };

  // ローディングスピナーを表示しつつトランザクション送信処理を実行
  const executeWrap = async (usePaymaster: boolean) => {
    const done = onLoading();
    try {
      await execute(usePaymaster);
    } catch (error) {
      onError();
      throw error;
    } finally {
      done();
    }
  };

  return (
    <Grid2 container direction="column" rowSpacing={2}>
      <Grid2>
        <CallEditor
          sender={wallet.address}
          initCalls={initCalls.current}
          onChange={onChangeCalls}
          maxHeight={300}
        />
      </Grid2>

      <Divider />

      <Grid2 container spacing={2} justifyContent="flex-end">
        {/* 手数料を自己負担でトランザクションを送信 */}
        <Tooltip
          title="The fees to the Bundler will be paid from your wallet, so you'll need to have sufficient funds available."
          arrow
        >
          <Button
            onClick={() => executeWrap(false)}
            disabled={!isValid}
            variant="outlined"
            size="large"
            sx={{ textTransform: "none" }}
          >
            Send with self-paid fees
          </Button>
        </Tooltip>

        {/* 手数料をPaymaster負担でトランザクションを送信 */}
        <Tooltip
          title="The fees to the Bundler are paid by the Paymaster contract, so you don't need any balance in your wallet."
          arrow
        >
          <Button
            onClick={() => executeWrap(true)}
            disabled={!isValid}
            variant="outlined"
            size="large"
            sx={{ textTransform: "none" }}
          >
            Send with sponsored fees
          </Button>
        </Tooltip>
      </Grid2>

      {/* エクスプローラリンク */}
      <Grid2 container justifyContent="flex-end" color="text.secondary">
        <Box>
          <Typography variant="body1">Explorer links:</Typography>
          <Box component="ul" sx={{ ml: 2 }}>
            <Typography component="li" variant="body2">
              <a
                href={getExplorerLink(bundlerAddress, chain.id)}
                target="_blank"
                rel="noopener noreferrer"
              >
                - Bundler account
              </a>
            </Typography>
            <Typography component="li" variant="body2">
              <a
                href={getExplorerLink(paymasterContract, chain.id)}
                target="_blank"
                rel="noopener noreferrer"
              >
                - Paymaster contract
              </a>
            </Typography>
          </Box>
        </Box>
      </Grid2>
    </Grid2>
  );
};
