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
} from "@/lib/types";
import { Wallet, useChainStore, useLoggerStore } from "@/store";
import {
  Backdrop,
  Box,
  Card,
  CardActionArea,
  CardContent,
  CircularProgress,
  Grid2,
  Typography,
} from "@mui/material";
import { useState } from "react";

export type SendTransactionDialogProps = {
  chain: ChainConfig;
  wallet: Wallet;
  calls: CoinbaseSmartWallet_Call[];
  // トランザクション送信後のコールバック(レシートステータスが失敗でも呼ばれる)
  onSent: (
    chain: ChainConfig,
    wallet: Wallet,
    response: ExecuteUserOperationResponse
  ) => void;
  onError: () => void;
};

export const SendTransactionDialog: React.FC<SendTransactionDialogProps> = ({
  chain,
  wallet,
  calls,
  onSent,
  onError,
}) => {
  const { getExplorerLink } = useChainStore();
  const { getLogger } = useLoggerStore();
  const logger = getLogger("SendTransaction");
  const [onLoading, setOnLoading] = useState(false);

  const executeOnLoading = async (usePaymaster: boolean) => {
    setOnLoading(true);
    try {
      await execute(usePaymaster);
    } catch (error) {
      onError();
      throw error;
    } finally {
      setOnLoading(false);
    }
  };

  const execute = async (usePaymaster: boolean) => {
    const client = getPublicClient(chain.rpc);

    // ナンス値はEntryPoint.getNonce(address sender, uint192 key)で取得する
    const entryPoint = getEntryPoint({ client });
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
      callGasLimit: 21_000 * calls.length,
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

  return (
    <>
      {/* ローディングスピナー */}
      <Backdrop
        sx={(theme) => ({ color: "#fff", zIndex: theme.zIndex.drawer + 1 })}
        open={onLoading}
      >
        <CircularProgress color="inherit" />
      </Backdrop>

      <Box>
        <Grid2 rowSpacing={4} container flexDirection="column">
          {/* 手数料を自己負担でトランザクションを送信 */}
          <Card>
            <CardActionArea onClick={() => executeOnLoading(false)}>
              <CardContent>
                <Typography variant="h5" component="div">
                  Self-Paid fees
                </Typography>
                <Typography
                  variant="body1"
                  color="text.secondary"
                  sx={{ mt: 2 }}
                >
                  The fees to the Bundler will be paid from your wallet, so
                  you&apos;ll need to have sufficient funds available.
                </Typography>
              </CardContent>
            </CardActionArea>
          </Card>

          {/* 手数料をPaymaster負担でトランザクションを送信 */}
          <Card>
            <CardActionArea onClick={() => executeOnLoading(true)}>
              <CardContent>
                <Typography variant="h5" component="div">
                  Sponsored fees
                </Typography>
                <Typography
                  variant="body1"
                  color="text.secondary"
                  sx={{ mt: 2 }}
                >
                  The fees to the Bundler are paid by the Paymaster contract, so
                  you don&apos;t need any balance in your wallet.
                </Typography>
              </CardContent>
            </CardActionArea>
          </Card>

          {/* エクスプローラリンク */}
          <Box color="text.secondary">
            <Typography variant="body1">Explorer links:</Typography>
            <Box component="ul" sx={{ ml: 1 }}>
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
      </Box>
    </>
  );
};
