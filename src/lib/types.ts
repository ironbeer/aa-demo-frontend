import type {
  AuthenticatorTransportFuture,
  CredentialDeviceType,
  Base64URLString,
} from "@simplewebauthn/server";
import type {
  PublicKeyCredentialCreationOptionsJSON,
  RegistrationResponseJSON,
} from "@simplewebauthn/browser";

/**
 * It is strongly advised that credentials get their own DB
 * table, ideally with a foreign key somewhere connecting it
 * to a specific UserModel.
 *
 * "SQL" tags below are suggestions for column data types and
 * how best to store data received during registration for use
 * in subsequent authentications.
 */
export type Passkey = {
  // SQL: Store as `TEXT`. Index this column
  id: Base64URLString;
  // SQL: Store raw bytes as `BYTEA`/`BLOB`/etc...
  //      Caution: Node ORM's may map this to a Buffer on retrieval,
  //      convert to Uint8Array as necessary
  publicKey: number[];
  // SQL: Store as `TEXT`. Index this column. A UNIQUE constraint on
  //      (webAuthnUserID + user) also achieves maximum user privacy
  webAuthnUserID: Base64URLString;
  // SQL: Consider `BIGINT` since some authenticators return atomic timestamps as counters
  counter: number;
  // SQL: `VARCHAR(32)` or similar, longest possible value is currently 12 characters
  // Ex: 'singleDevice' | 'multiDevice'
  deviceType: CredentialDeviceType;
  // SQL: `BOOL` or whatever similar type is supported
  backedUp: boolean;
  // SQL: `VARCHAR(255)` and store string array as a CSV string
  // Ex: ['ble' | 'cable' | 'hybrid' | 'internal' | 'nfc' | 'smart-card' | 'usb']
  transports?: AuthenticatorTransportFuture[];
};

/**
 * API呼び出しエラー
 */
export type APIError = { detail: string };

/**
 * パスキー登録用Options取得APIのリクエスト型
 */
export type GenerateRegistrationOptionsRequest = {
  // パスキーの名前
  key_name?: string;
};

/**
 * パスキー登録用Options取得APIのレスポンス型
 */
export type GenerateRegistrationOptionsResponse =
  PublicKeyCredentialCreationOptionsJSON;

/**
 * パスキー登録デバイス認証結果検証APIのリクエスト型
 */
export type VerifyRegistrationRequest = RegistrationResponseJSON;

/**
 * パスキー登録デバイス認証結果検証APIのレスポンス型
 */
export type VerifiedRegistrationResponse = {
  verified: boolean;
  registrationInfo: unknown;
};
