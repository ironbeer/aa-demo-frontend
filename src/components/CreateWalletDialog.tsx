import {
  computeWalletAddress,
  generateAuthenticationOptions,
  generateRegistrationOptions,
  startAuthentication,
  startRegistration,
  verifyRegistration,
} from "@/lib/client";
import { ChainConfig, LoadingHandler } from "@/lib/types";
import { Wallet, useLoggerStore, useWalletStore } from "@/store";
import {
  Box,
  Card,
  CardActionArea,
  CardContent,
  Grid2,
  Typography,
} from "@mui/material";

export type CreateWalletDialogProps = {
  chain: ChainConfig;
  onLoading: LoadingHandler;
  onError: () => void;
  onCreate: (wallet: Wallet) => void;
};

export const CreateWalletDialog: React.FC<CreateWalletDialogProps> = ({
  chain,
  onLoading,
  onError,
  onCreate,
}) => {
  const { getLogger } = useLoggerStore();
  const { nextNonce } = useWalletStore();
  const logger = getLogger("CreateWallet");

  // 新しいパスキーをでバイスに登録した上でウォレットを作成する
  const useNewPasskey = async () => {
    const log = logger.child("NewPasskey");

    // キー名を入力してもらう
    const keyName = prompt("Enter a key name");
    if (!keyName) return;

    // パスキー登録用のOptionsをAPIから取得
    const options = await log.calllog(
      "generateRegistrationOptions",
      generateRegistrationOptions,
      { keyName }
    );

    // デバイス認証を開始
    const registResp = await log.calllog(
      "startRegistration",
      startRegistration,
      options
    );

    // デバイス認証の結果をAPIに送信してパスキー登録を完了する
    const verifyResp = await log.calllog(
      "verifyRegistration",
      verifyRegistration,
      { response: registResp, chainID: chain.id }
    );

    onCreate({ ...verifyResp, nonce: 0 });
  };

  // デバイス登録済みのパスキーを使用してウォレットを作成する
  const useRegisteredPasskey = async () => {
    const log = logger.child("RegisteredPasskey");

    // パスキー認証用のOptionsをAPIから取得
    const options = await log.calllog(
      "generateAuthenticationOptions",
      generateAuthenticationOptions
    );

    // デバイス認証を開始
    const authRes = await log.calllog(
      "startAuthentication",
      startAuthentication,
      options
    );
    const passkeyID = authRes.id;

    // デバイス認証の結果を利用してウォレットアドレスを取得
    const nonce = nextNonce(passkeyID);
    const computeRes = await log.calllog(
      "computeWalletAddress",
      computeWalletAddress,
      { response: authRes, chainID: chain.id, nonce }
    );

    onCreate({ ...computeRes, nonce });
  };

  const onClick = (fn: () => Promise<void>) => async () => {
    const done = onLoading();
    try {
      await fn();
    } catch (error) {
      onError();
      throw error;
    } finally {
      done();
    }
  };

  return (
    <Box>
      <Grid2 spacing={6} container flexDirection="column">
        {/* 新しいパスキーを使用する */}
        <Card>
          <CardActionArea onClick={onClick(useNewPasskey)}>
            <CardContent>
              <Typography variant="h5" component="div">
                Use new passkey
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                Create a new smart wallet using a new passkey.
              </Typography>
            </CardContent>
          </CardActionArea>
        </Card>

        {/* デバイスに登録済みのパスキーを利用する */}
        <Card>
          <CardActionArea onClick={onClick(useRegisteredPasskey)}>
            <CardContent>
              <Typography variant="h5" component="div">
                Use a registered passkey
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                Create a new smart wallet using the passkey registered on your
                device.
              </Typography>
            </CardContent>
          </CardActionArea>
        </Card>
      </Grid2>
    </Box>
  );
};
