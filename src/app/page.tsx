"use client";

import {
  CallEditor,
  ChainSelect,
  CreateWalletDialog,
  LogTable,
  SendTransactionDialog,
  TransactionTable,
  WalletTable,
} from "@/components";
import {
  ChainConfig,
  CoinbaseSmartWallet_Call,
  ExecuteUserOperationResponse,
} from "@/lib/types";
import { Wallet, useChainStore, useLoggerStore, useWalletStore } from "@/store";
import theme from "@/styles/theme";
import {
  Alert,
  Box,
  Button,
  Grid2,
  Modal,
  Snackbar,
  ThemeProvider,
  Typography,
} from "@mui/material";
import { useState } from "react";
import { Address } from "viem";

export default function Home() {
  const { logs } = useLoggerStore();
  const { selected: selectedChain, onSelect: onSelectChain } = useChainStore();

  const {
    wallets,
    calls: walletCalls,
    transactions: sentTransactions,
    saveWallet,
    replaceCalls,
    saveTransaction,
  } = useWalletStore();
  const filterCalls = (sender: Address) => walletCalls[sender] ?? [];

  // チェーン選択ボタンのアンカー
  const [chainSelectAnchorEl, setChainSelectAnchorEl] =
    useState<null | HTMLElement>(null);

  // ウォレット作成ダイアログの表示フラグ
  const [showWalletDialog, setShowWalletDialog] = useState(false);

  // 現在開いているCallFormと関連付けられているウォレット
  const [activeCallFormWallet, setActiveCallFormWallet] =
    useState<null | Wallet>(null);

  // 現在開いているトランザクション送信モーダルと関連付けられているウォレット
  const [activeSendTransactionWallet, setActiveSendTransactionWallet] =
    useState<null | Wallet>(null);

  // トランザクション送信結果の通知バーの表示フラグ
  const [txAlert, setTxAlert] = useState<{
    show: boolean;
    mode?: "success" | "reverted" | "error";
  }>({ show: false });
  const closeTxAlert = () =>
    setTimeout(() => setTxAlert((prev) => ({ ...prev, show: false })), 3000);

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

  // トランザクション送信フォームのクローズ処理
  const onCloseSendTransaction = () => setActiveSendTransactionWallet(null);

  // トランザクション送信後のコールバック
  const onSentTransaction = (
    chain: ChainConfig,
    wallet: Wallet,
    response: ExecuteUserOperationResponse
  ) => {
    saveTransaction(chain.id, wallet.address, response);

    // TXが成功した場合はCallsをクリア
    if (response.success) {
      replaceCalls(activeSendTransactionWallet!.address, []);
    }

    onCloseSendTransaction();
    setTxAlert({ show: true, mode: response.success ? "success" : "reverted" });
    closeTxAlert();
  };

  // トランザクション送信エラー時のコールバック
  const onErrorSendTransaction = () => {
    onCloseSendTransaction();
    setTxAlert({ show: true, mode: "error" });
    closeTxAlert();
  };

  return (
    <ThemeProvider theme={theme}>
      <Grid2
        container
        justifyContent="center"
        spacing={4}
        sx={{ width: "80%", mt: 4, mr: "auto", mb: 4, ml: "auto" }}
      >
        <Grid2
          container
          component="header"
          size={12}
          spacing={2}
          justifyContent="flex-end"
        >
          {/* チェーン選択ボタン */}
          <Button
            onClick={(e) => setChainSelectAnchorEl(e.currentTarget)}
            size="large"
            variant="outlined"
            sx={{ textTransform: "none", borderRadius: 6 }}
          >
            Network: {selectedChain.name}
          </Button>
          <ChainSelect
            anchorEl={chainSelectAnchorEl}
            onSelect={(chain) => {
              onSelectChain(chain);
              setChainSelectAnchorEl(null);
            }}
            onClose={() => setChainSelectAnchorEl(null)}
          />

          {/* ウォレット作成ボタン */}
          <Button
            onClick={() => setShowWalletDialog(true)}
            size="large"
            variant="outlined"
            color="secondary"
            sx={{ textTransform: "none", borderRadius: 6 }}
          >
            Create a smart wallet
          </Button>
        </Grid2>

        <Grid2 container component="main" size={12} rowSpacing={10}>
          {/* ウォレットテーブル */}
          <Grid2 container spacing={2} size={12}>
            <Typography variant="h5" color="text.secondary">
              Wallets
            </Typography>
            <WalletTable
              wallets={wallets}
              renderActions={({ wallet }) => (
                <Grid2
                  container
                  spacing={2}
                  justifyContent={"flex-end"}
                  sx={{ mr: 0 }}
                >
                  {/* CallFormモーダルを開くボタン */}
                  <Button
                    onClick={() => setActiveCallFormWallet(wallet)}
                    variant="outlined"
                    sx={{ textTransform: "none" }}
                  >
                    Edit Calls ({filterCalls(wallet.address).length})
                  </Button>
                  {/* トランザクション送信モーダル */}
                  <Button
                    onClick={() => setActiveSendTransactionWallet(wallet)}
                    disabled={filterCalls(wallet.address).length === 0}
                    variant="outlined"
                    sx={{ textTransform: "none" }}
                  >
                    Send Transaction
                  </Button>
                </Grid2>
              )}
            />
          </Grid2>

          {/* トランザクションテーブル */}
          <Grid2 container spacing={2} size={12}>
            <Typography variant="h5" color="text.secondary">
              Sent Transactions
            </Typography>
            <TransactionTable transactions={sentTransactions} />
          </Grid2>

          {/* ログテーブル */}
          <Grid2 container spacing={2} size={12}>
            <Typography variant="h5" color="text.secondary">
              Logs
            </Typography>
            <LogTable logs={logs} />
          </Grid2>
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
            width: 500,
            bgcolor: "background.paper",
            boxShadow: 24,
            p: 4,
            borderRadius: 2,
          }}
        >
          <CreateWalletDialog
            chain={selectedChain}
            onCreate={onSubmitCreateWalletForm}
          />
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
            width: "70%",
            bgcolor: "background.paper",
            boxShadow: 24,
            p: 4,
            borderRadius: 2,
          }}
        >
          {activeCallFormWallet && (
            <CallEditor
              sender={activeCallFormWallet.address}
              initCalls={filterCalls(activeCallFormWallet.address)}
              onSubmit={(calls) =>
                onSubmitCallForm(activeCallFormWallet!, calls)
              }
            />
          )}
        </Box>
      </Modal>

      {/* トランザクション送信モーダル */}
      <Modal
        open={!!activeSendTransactionWallet}
        onClose={onCloseSendTransaction}
      >
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: 500,
            bgcolor: "background.paper",
            boxShadow: 24,
            p: 4,
            borderRadius: 2,
          }}
        >
          {activeSendTransactionWallet && (
            <SendTransactionDialog
              chain={selectedChain}
              wallet={activeSendTransactionWallet}
              calls={filterCalls(activeSendTransactionWallet.address)}
              onSent={onSentTransaction}
              onError={onErrorSendTransaction}
            />
          )}
        </Box>
      </Modal>

      {/* トランザクション送信結果の通知バー */}
      <Snackbar
        open={txAlert.show}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          severity={txAlert.mode === "success" ? "success" : "error"}
          variant="filled"
        >
          {txAlert.mode === "success"
            ? "Transaction succeeded"
            : txAlert.mode === "reverted"
            ? "Transaction reverted"
            : "Transaction failed"}
        </Alert>
      </Snackbar>
    </ThemeProvider>
  );
}
