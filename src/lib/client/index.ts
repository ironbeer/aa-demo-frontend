import {
  PublicKeyCredentialRequestOptionsJSON,
  RegistrationResponseJSON,
  AuthenticationResponseJSON,
  WebAuthnError,
  startRegistration as startRegistrationBrowser,
  startAuthentication as startAuthenticationBrowser,
} from "@simplewebauthn/browser";
import {
  GenerateRegistrationOptionsRequest,
  GenerateRegistrationOptionsResponse,
  VerifiedRegistrationResponse,
} from "@/lib/types";

// API側での検証レスポンス
type VerifiedAuthenticationResponse = {
  verified: boolean;
  authenticationInfo: unknown;
};

// API呼び出しエラー
class APIError extends Error {
  constructor(public detail: string) {
    super(detail);
  }
}

// APIルートのURL一覧
const endpoints = {
  generateRegistrationOptions:
    "/api/registration/generate-registration-options",
  verifyRegistration: "/api/registration/verify-registration",
  generateAuthenticationOptions: "/api/03-generate-authentication-options",
  verifyAuthentication: "/api/04-verify-authentication",
} as const;

// API呼び出し結果からJSONを取り出す、JSONで無い場合は例外を投げる
const getJsonRseponse = async <T>(res: Response): Promise<APIError | T> => {
  if (res.headers.get("content-type") !== "application/json") {
    throw new Error(`API error: ${res.status} ${res.statusText}`);
  }
  // ステータスコードが2xx以外の場合はAPIエラーとして扱う
  const json = await res.json();
  if (!res.ok) {
    return new APIError(json.detail);
  }
  return json;
};

// APIからパスキー登録用のOptionsを取得する
const generateRegistrationOptions = async (
  params: GenerateRegistrationOptionsRequest
) => {
  const res = await fetch(endpoints.generateRegistrationOptions, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
  return await getJsonRseponse<GenerateRegistrationOptionsResponse>(res);
};

// APIから取得したパスキー登録用Optionsを使用してデバイス認証を行う
const startRegistration = async (
  optionsJSON: GenerateRegistrationOptionsResponse
): Promise<RegistrationResponseJSON> => {
  try {
    // Pass the options to the authenticator and wait for a response
    return await startRegistrationBrowser({ optionsJSON });
  } catch (e) {
    // Some basic error handling
    if (e instanceof WebAuthnError && e.name === "InvalidStateError") {
      throw new Error(
        "Error: Authenticator was probably already registered by user"
      );
    }
    throw e;
  }
};

// パスキー登録のデバイス認証の結果をAPIに送信
const verifyRegistration = async (resp: RegistrationResponseJSON) => {
  const res = await fetch(endpoints.verifyRegistration, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(resp),
  });
  return await getJsonRseponse<VerifiedRegistrationResponse>(res);
};

// APIからパスキー認証用のOptionsを取得する
const generateAuthenticationOptions = async () => {
  const res = await fetch(endpoints.generateAuthenticationOptions);
  return await getJsonRseponse<PublicKeyCredentialRequestOptionsJSON>(res);
};

// APIから取得したパスキー認証用Optionsを使用してデバイス認証を行う
const startAuthentication = async (
  optionsJSON: PublicKeyCredentialRequestOptionsJSON
): Promise<AuthenticationResponseJSON> => {
  return await startAuthenticationBrowser({ optionsJSON });
};

// パスキー認証のデバイス認証の結果をAPIに送信
const verifyAuthentication = async (resp: AuthenticationResponseJSON) => {
  const res = await fetch(endpoints.verifyAuthentication, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(resp),
  });
  return await getJsonRseponse<VerifiedAuthenticationResponse>(res);
};

const registration = {
  generateRegistrationOptions,
  startRegistration,
  verifyRegistration,
};

const authentication = {
  generateAuthenticationOptions,
  startAuthentication,
  verifyAuthentication,
};

export { APIError, endpoints, registration, authentication };
