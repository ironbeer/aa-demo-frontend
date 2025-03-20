"use client";

import {
  ChainSelect,
  CreateWalletDialog,
  LogTable,
  SendTransactionDialog,
  TransactionTable,
  WalletTable,
} from "@/components";
import { ChainConfig, ExecuteUserOperationResponse } from "@/lib/types";
import { Wallet, useChainStore, useLoggerStore, useWalletStore } from "@/store";
import theme from "@/styles/theme";
import {
  Alert,
  Backdrop,
  Box,
  Button,
  CircularProgress,
  Grid2,
  Modal,
  Snackbar,
  ThemeProvider,
  Typography,
} from "@mui/material";
import { useState } from "react";

export default function Home() {
  const { logs } = useLoggerStore();
  const { selected: selectedChain, onSelect: onSelectChain } = useChainStore();
  const {
    wallets,
    transactions: sentTransactions,
    saveWallet,
    replaceCalls,
    saveTransaction,
  } = useWalletStore();

  // チェーン選択ボタンのアンカー
  const [chainSelectAnchorEl, setChainSelectAnchorEl] =
    useState<null | HTMLElement>(null);

  // ウォレット作成ダイアログの表示フラグ
  const [showWalletDialog, setShowWalletDialog] = useState(false);
  const closeWalletDialog = () => setShowWalletDialog(false);

  // 現在開いているトランザクション送信モーダルと関連付けられているウォレット
  const [transactingWallet, setTransactingWallet] = useState<null | Wallet>(
    null
  );
  const closeTransactionDialog = () => setTransactingWallet(null);

  // ローディングスピナー
  const [showLoading, setLoading] = useState(false);
  const onLoading = () => {
    setLoading(true);
    return () => setLoading(false);
  };

  // 通知バー
  const [alert, setAlert] = useState<{
    show: boolean;
    severity?: "success" | "error";
    text?: string;
  }>({ show: false });
  const showAlert = (severity: "success" | "error", text: string) => {
    setAlert({ show: true, severity, text });
    setTimeout(() => setAlert((prev) => ({ ...prev, show: false })), 3000);
  };

  // ウォレット作成成功コールバック
  const onWalletCreated = (wallet: Wallet) => {
    saveWallet(wallet);
    closeWalletDialog();
    showAlert("success", "Wallet created");
  };

  // ウォレット作成エラーコールバック
  const onErrorCreateWallet = () => {
    closeWalletDialog();
    showAlert("error", "Wallet creation failed");
  };

  // トランザクション送信成功コールバック
  const onSentTransaction = (
    chain: ChainConfig,
    wallet: Wallet,
    response: ExecuteUserOperationResponse
  ) => {
    saveTransaction(chain.id, wallet.address, response);
    if (response.success) {
      replaceCalls(transactingWallet!.address, []);
    }

    closeTransactionDialog();
    showAlert(
      response.success ? "success" : "error",
      response.success ? "Transaction succeeded" : "Transaction reverted"
    );
  };

  // トランザクション送信エラーコールバック
  const onErrorSendTransaction = () => {
    closeTransactionDialog();
    showAlert("error", "Transaction failed");
  };

  return (
    <ThemeProvider theme={theme}>
      <Grid2
        container
        justifyContent="center"
        spacing={4}
        sx={{
          width: "95%",
          maxWidth: 1500,
          mt: 4,
          mr: "auto",
          mb: 4,
          ml: "auto",
        }}
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
            sx={{ textTransform: "none", borderRadius: 6 }}
          >
            Create a smart wallet
          </Button>
        </Grid2>

        <Grid2 container component="main" size={12} rowSpacing={6}>
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
                  {/* トランザクション送信ボタン */}
                  <Button
                    onClick={() => setTransactingWallet(wallet)}
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
              Transactions
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
      <Modal open={showWalletDialog} onClose={closeWalletDialog}>
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
            onLoading={onLoading}
            onError={onErrorCreateWallet}
            onCreate={onWalletCreated}
          />
        </Box>
      </Modal>

      {/* トランザクション送信モーダル */}
      <Modal open={!!transactingWallet} onClose={closeTransactionDialog}>
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: "95%",
            maxWidth: 1200,
            bgcolor: "background.paper",
            boxShadow: 24,
            p: 4,
            borderRadius: 2,
          }}
        >
          {transactingWallet && (
            <SendTransactionDialog
              chain={selectedChain}
              wallet={transactingWallet}
              onLoading={onLoading}
              onError={onErrorSendTransaction}
              onSent={onSentTransaction}
            />
          )}
        </Box>
      </Modal>

      {/* 通知バー */}
      <Snackbar
        open={alert.show}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert severity={alert.severity} variant="filled">
          {" "}
          {alert.text}{" "}
        </Alert>
      </Snackbar>

      {/* ローディングスピナー */}
      <Backdrop
        open={showLoading}
        sx={(theme) => ({ color: "#fff", zIndex: theme.zIndex.modal + 1 })}
      >
        <CircularProgress color="inherit" />
      </Backdrop>
    </ThemeProvider>
  );
}
