import type {
  PublicKeyCredentialCreationOptionsJSON,
  PublicKeyCredentialRequestOptionsJSON,
} from "@simplewebauthn/server";
import { typedClient } from "@/lib/server/redis";
import { Passkey } from "@/lib/types";

// optionsの有効期限を5分とする
const optionsExpire = 5 * 60 * 1000;

/**
 * Passkeyデータベース
 */
const Passkeys = typedClient<Passkey>("Passkeys");

const storePasskey = (passkey: Passkey): Promise<void> => {
  return Passkeys.setValue(passkey.id, passkey);
};

const getPasskey = (id: string): Promise<null | Passkey> => {
  return Passkeys.getValue(id);
};

/**
 * パスキー登録用ptionsデータベース
 */
const RegistrationOptions = typedClient<PublicKeyCredentialCreationOptionsJSON>(
  "RegistrationOptions",
  optionsExpire
);

const storeRegistrationOptions = (
  options: PublicKeyCredentialCreationOptionsJSON
): Promise<void> => {
  return RegistrationOptions.setValue(options.challenge, options);
};

const getRegistrationOptions = (
  challenge: string
): Promise<null | PublicKeyCredentialCreationOptionsJSON> => {
  return RegistrationOptions.getValue(challenge);
};

/**
 * パスキー認証用Optionsデータベース
 */
const AuthenticationOptions =
  typedClient<PublicKeyCredentialRequestOptionsJSON>(
    "AuthenticationOptions",
    optionsExpire
  );

const storeAuthenticationOptions = (
  options: PublicKeyCredentialRequestOptionsJSON
): Promise<void> => {
  return AuthenticationOptions.setValue(options.challenge, options);
};

const getAuthenticationOptions = (
  challenge: string
): Promise<null | PublicKeyCredentialRequestOptionsJSON> => {
  return AuthenticationOptions.getValue(challenge);
};

export const datastore = {
  storePasskey,
  getPasskey,
  storeRegistrationOptions,
  getRegistrationOptions,
  storeAuthenticationOptions,
  getAuthenticationOptions,
};
