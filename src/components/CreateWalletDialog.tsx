import { authentication, registration } from "@/lib/client";
import { Wallet, useLoggerStore, useWalletStore } from "@/store";
import {
  Box,
  Card,
  CardActionArea,
  CardContent,
  Grid2,
  Typography,
} from "@mui/material";
import {
  AuthenticationResponseJSON,
  RegistrationResponseJSON,
} from "@simplewebauthn/browser";

export type CreateWalletDialogProps = {
  onCreated: (wallet: Wallet) => void;
};

export const CreateWalletDialog: React.FC<CreateWalletDialogProps> = ({
  onCreated,
}) => {
  const { getLogger } = useLoggerStore();
  const { nextNonce } = useWalletStore();
  const logger = getLogger();

  // 新しいパスキーをでバイスに登録した上でウォレットを作成する
  const onClickUseNewPasskey = async () => {
    // キー名を入力してもらう
    const keyName = prompt("Enter a key name");
    if (!keyName) return;

    // パスキー登録用のOptionsをAPIから取得
    logger.info("generateRegistrationOptions.request", { keyName });
    const options = await registration.generateRegistrationOptions({ keyName });
    if (options instanceof Error) {
      logger.error("generateRegistrationOptions.error", options.message);
      return;
    }
    logger.info("generateRegistrationOptions.response", options);

    // デバイス認証を開始
    let registResp: RegistrationResponseJSON;
    try {
      registResp = await registration.startRegistration(options);
    } catch (error) {
      logger.error("startRegistration.error", String(error));
      return;
    }

    // デバイス認証の結果をAPIに送信してパスキー登録を完了する
    logger.info("verifyRegistration.request", registResp);
    const verifyResp = await registration.verifyRegistration(registResp);
    if (verifyResp instanceof Error) {
      logger.error("verifyRegistration.error", verifyResp.message);
      return;
    }
    logger.info("verifyRegistration.response", verifyResp);

    onCreated(verifyResp);
  };

  // デバイス登録済みのパスキーを使用してウォレットを作成する
  const onClickUseRegisteredPasskey = async () => {
    // パスキー認証用のOptionsをAPIから取得
    const options = await authentication.generateAuthenticationOptions();
    if (options instanceof Error) {
      logger.error("generateAuthenticationOptions.error", options.message);
      return;
    }
    logger.info("generateAuthenticationOptions.response", options);

    // デバイス認証を開始
    let authRes: AuthenticationResponseJSON;
    try {
      authRes = await authentication.startAuthentication(options);
    } catch (error) {
      logger.error("startAuthentication.error", String(error));
      return;
    }
    const passkeyID = authRes.id;

    // デバイス認証の結果を利用してウォレットアドレスを取得
    const computeReq = { response: authRes, nonce: nextNonce(passkeyID) };
    logger.info("computeWalletAddress.request", computeReq);
    const computeRes = await authentication.computeWalletAddress(computeReq);
    if (computeRes instanceof Error) {
      logger.error("computeWalletAddress.error", computeRes.message);
      return;
    }
    logger.info("computeWalletAddress.response", computeRes);

    onCreated(computeRes);
  };

  return (
    <Box>
      <Grid2 spacing={6} container flexDirection="column">
        {/* 新しいパスキーを使用する */}
        <Card>
          <CardActionArea onClick={onClickUseNewPasskey}>
            <CardContent>
              <Typography variant="h5" component="div">
                Use new passkey
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mt: 2 }}>
                Create a new smart wallet using a new passkey.
              </Typography>
            </CardContent>
          </CardActionArea>
        </Card>

        {/* デバイスに登録済みのパスキーを利用する */}
        <Card>
          <CardActionArea onClick={onClickUseRegisteredPasskey}>
            <CardContent>
              <Typography variant="h5" component="div">
                Use a registered passkey
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mt: 2 }}>
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
