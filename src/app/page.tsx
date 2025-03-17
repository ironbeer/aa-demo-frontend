"use client";

import {
  CallForm,
  CreateWalletDialog,
  LogTable,
  WalletTable,
} from "@/components";
import {
  encodeCallsForExecuteBatch,
  getEntryPoint,
  getPublicClient,
} from "@/lib/blockchain";
import { authentication } from "@/lib/client";
import {
  CoinbaseSmartWallet_Call,
  EntryPoint_UserOperation,
} from "@/lib/types";
import { Wallet, useLoggerStore, useWalletStore } from "@/store";
import { Box, Button, Grid2, Modal } from "@mui/material";
import { useState } from "react";
import { Address } from "viem";

export default function Home() {
  const { logs, getLogger } = useLoggerStore();
  const logger = getLogger();

  const {
    wallets,
    calls: walletCalls,
    saveWallet,
    replaceCalls,
  } = useWalletStore();
  const filterCalls = (sender: Address) => walletCalls[sender] ?? [];

  // ウォレット作成ダイアログの表示フラグ
  const [showWalletDialog, setShowWalletDialog] = useState(false);

  // 現在開いているCallFormと関連付けられているウォレット
  const [activeCallFormWallet, setActiveCallFormWallet] =
    useState<null | Wallet>(null);

  // ウォレット作成フォームの送信処理
  const onSubmitCreateWalletForm = (wallet: Wallet) => {
    saveWallet(wallet);
    onCloseCreateWalletForm();
  };

  // ウォレット作成フォームのクローズ処理
  const onCloseCreateWalletForm = () => setShowWalletDialog(false);

  // CallFormの送信処理
  const onSubmitCallForm = (
    wallet: Wallet,
    calls: CoinbaseSmartWallet_Call[]
  ) => {
    replaceCalls(wallet.address, calls);
    onCloseCallForm();
  };

  // CallFormのクローズ処理
  const onCloseCallForm = () => setActiveCallFormWallet(null);

  // トランザクション送信
  const onClickSendTransaction = async (
    wallet: Wallet,
    usePaymaster: boolean
  ) => {
    const calls = filterCalls(wallet.address);
    if (!calls.length) return;

    const rpc = getPublicClient();
    const entryPoint = getEntryPoint({ rpc });

    // ナンス値はEntryPoint.getNonce(address sender, uint192 key)で取得する
    const nonceKey = Math.round(Math.random() * 1e9);
    logger.info("EntryPoint.getNonce.request", {
      sender: wallet.address,
      key: nonceKey,
    });
    const nonce = await entryPoint.read.getNonce([wallet.address, nonceKey]);
    if (typeof nonce !== "bigint") {
      logger.error("EntryPoint.getNonce.error", String(nonce));
      return;
    }
    logger.info("EntryPoint.getNonce.response", { nonce: nonce.toString() });

    // basefeeを取得
    const block = await getPublicClient().getBlock();
    const basefee = Number(block.baseFeePerGas!);

    let verificationGasLimit = 450_000 * calls.length;
    const walletCode = await rpc.getCode({ address: wallet.address });
    if (!walletCode || walletCode.length === 0) {
      // 初回TX時はウォレットコントラクトのデプロイ処理が入るのでガスを多めにする
      verificationGasLimit += 200_000;
    }

    // UserOperationを作成
    let userOp: EntryPoint_UserOperation = {
      sender: wallet.address,
      nonce: nonce.toString(),
      callData: encodeCallsForExecuteBatch(calls),
      callGasLimit: 21_000 * calls.length,
      verificationGasLimit,
      preVerificationGas: 390_000 * calls.length,
      maxFeePerGas: basefee,
      maxPriorityFeePerGas: basefee,
      // 以下はAPIサーバ側で追加される
      initCode: "0x",
      paymasterAndData: "0x",
      signature: "0x",
    };

    // APIサーバに認証用OptionsJSONの生成とinitCodeの追加を依頼
    const ophashReq = {
      userOp,
      passkeyID: wallet.passkeyID,
      walletNonce: wallet.nonce,
      usePaymaster,
    };
    logger.info("generateUserOpHashOptions.request", ophashReq);
    const ophashRes = await authentication.generateUserOpHashOptions(ophashReq);
    if (ophashRes instanceof Error) {
      logger.error("generateUserOpHashOptions.error", ophashRes.message);
      return;
    }
    logger.info("generateUserOpHashOptions.response", ophashRes);

    // 初めてウォレットを利用する場合はinitCodeが追加されているのでuserOpを入れ替える
    userOp = ophashRes.userOp;

    // デバイス認証を開始
    const response = await authentication.startAuthentication(
      ophashRes.options
    );
    logger.info("startAuthentication.response", response);

    // APIサーバに認証結果を送信してsignature追加とトランザクション実行を依頼
    const executeReq = { response, userOp };
    logger.info("executeUserOperation.request", executeReq);
    const executeRes = await authentication.executeUserOperation(executeReq);
    if (executeRes instanceof Error) {
      logger.error("executeUserOperation.error", executeRes.message);
      return;
    }
    logger.info("executeUserOperation.response", executeRes);

    if (executeRes.success) {
      window.alert("Transaction succeeded");
      replaceCalls(wallet.address, []);
    } else {
      window.alert("Transaction failed");
    }
  };

  return (
    <>
      <Grid2 container spacing={4} justifyContent="center" sx={{ mt: 4 }}>
        <Grid2 size={10}>
          <header className="row-start-1 flex justify-end w-full">
            {/* ウォレット作成ボタン */}
            <Button
              onClick={() => setShowWalletDialog(true)}
              variant="contained"
              size="large"
              color="success"
              sx={{ textTransform: "none", borderRadius: 6 }}
            >
              Create a smart wallet
            </Button>
          </header>
        </Grid2>

        <Grid2 size={10}>
          <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start">
            <Grid2 container spacing={2} sx={{ mt: 4 }} size={12}>
              <WalletTable
                wallets={wallets}
                renderActions={({ wallet }) => (
                  <Grid2 container spacing={2} justifyContent={"flex-end"}>
                    {/* CallFormを開くボタン */}
                    <Button
                      onClick={() => setActiveCallFormWallet(wallet)}
                      variant="outlined"
                      sx={{ textTransform: "none" }}
                    >
                      Edit Calls ({filterCalls(wallet.address).length})
                    </Button>
                    {/* トランザクション送信実行 */}
                    <Button
                      onClick={() => onClickSendTransaction(wallet, false)}
                      disabled={filterCalls(wallet.address).length === 0}
                      variant="contained"
                      sx={{ textTransform: "none" }}
                    >
                      Send TX
                    </Button>
                    {/* Paymasterを使用したトランザクション送信実行ボタン */}
                    <Button
                      onClick={() => onClickSendTransaction(wallet, true)}
                      disabled={filterCalls(wallet.address).length === 0}
                      variant="contained"
                      sx={{ textTransform: "none" }}
                    >
                      Send TX with Paymaster
                    </Button>
                  </Grid2>
                )}
              />
              <Grid2
                container
                size={12}
                justifyContent="flex-end"
                sx={{ mr: 2 }}
              >
                <Grid2>
                  <Button variant="contained" sx={{ textTransform: "none" }}>
                    Batch Send Transaction
                  </Button>
                </Grid2>
              </Grid2>
            </Grid2>

            <Box sx={{ mt: 4 }}>
              <LogTable logs={logs} />
            </Box>
          </main>
        </Grid2>
      </Grid2>

      {/* ウォレット作成モーダル */}
      <Modal open={showWalletDialog} onClose={onCloseCreateWalletForm}>
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: 600,
            bgcolor: "background.paper",
            boxShadow: 24,
            p: 4,
            borderRadius: 2,
          }}
        >
          <CreateWalletDialog onCreated={onSubmitCreateWalletForm} />
        </Box>
      </Modal>

      {/* Call編集モーダル */}
      <Modal open={!!activeCallFormWallet} onClose={onCloseCallForm}>
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: "60%",
            bgcolor: "background.paper",
            boxShadow: 24,
            p: 4,
            borderRadius: 2,
          }}
        >
          {activeCallFormWallet && (
            <CallForm
              sender={activeCallFormWallet.address}
              initCalls={filterCalls(activeCallFormWallet.address)}
              onSubmit={(calls) =>
                onSubmitCallForm(activeCallFormWallet!, calls)
              }
            />
          )}
        </Box>
      </Modal>
    </>
  );
}
