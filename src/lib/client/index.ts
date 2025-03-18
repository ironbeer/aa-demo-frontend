"use client";

import {
  ComputeWalletAddressRequest,
  ComputeWalletAddressResponse,
  ExecuteUserOperationRequest,
  ExecuteUserOperationResponse,
  GenerateAuthenticationOptionsResponse,
  GenerateRegistrationOptionsRequest,
  GenerateRegistrationOptionsResponse,
  GenerateUserOperationHashOptionsRequest,
  GenerateUserOperationHashOptionsResponse,
  VerifiedRegistrationResponse,
} from "@/lib/types";
import {
  AuthenticationResponseJSON,
  RegistrationResponseJSON,
  WebAuthnError,
  startAuthentication as startAuthenticationBrowser,
  startRegistration as startRegistrationBrowser,
} from "@simplewebauthn/browser";

// APIルートのURL一覧
const endpoints = {
  generateRegistrationOptions: "/api/generate-registration-options",
  verifyRegistration: "/api/verify-registration",
  generateAuthenticationOptions: "/api/generate-authentication-options",
  computeWalletAddress: "/api/compute-wallet-address",
  generateUserOpHashOptions: "/api/generate-user-operation-hash-options",
  executeUserOperation: "/api/execute-user-operation",
} as const;

const wrapfetch = async <T>(url: string, options?: RequestInit): Promise<T> => {
  const response = await fetch(url, options);

  // ステータスコードが2xx以外である or レスポンスがJSONではない
  const status = response.status;
  const isJson = response.headers.get("content-type") === "application/json";

  if (status < 200 || status >= 300 || !isJson) {
    let body: string;
    if (isJson) {
      const json: { detail?: string | object } = await response.json();
      if (typeof json.detail === "object") {
        body = JSON.stringify(json.detail);
      } else {
        body = json.detail || JSON.stringify(json);
      }
    } else {
      body = await response.text();
    }
    console.log({ isJson, body });
    throw new Error(`API error: url=${url} status=${status} body=${body}`);
  }

  return await response.json();
};

// APIからパスキー登録用のOptionsを取得する
export const generateRegistrationOptions = (
  params: GenerateRegistrationOptionsRequest
): Promise<GenerateRegistrationOptionsResponse> => {
  return wrapfetch(endpoints.generateRegistrationOptions, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
};

// APIから取得したパスキー登録用Optionsを使用してデバイス認証を行う
export const startRegistration = async (
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
export const verifyRegistration = (
  resp: RegistrationResponseJSON
): Promise<VerifiedRegistrationResponse> => {
  return wrapfetch(endpoints.verifyRegistration, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(resp),
  });
};

// APIからパスキー認証用のOptionsを取得する
export const generateAuthenticationOptions =
  (): Promise<GenerateAuthenticationOptionsResponse> => {
    return wrapfetch(endpoints.generateAuthenticationOptions);
  };

// APIから取得したパスキー認証用Optionsを使用してデバイス認証を行う
export const startAuthentication = (
  optionsJSON: GenerateAuthenticationOptionsResponse
): Promise<AuthenticationResponseJSON> => {
  return startAuthenticationBrowser({ optionsJSON });
};

// デバイス認証の結果を利用してウォレットアドレスを取得
export const computeWalletAddress = (
  resp: ComputeWalletAddressRequest
): Promise<ComputeWalletAddressResponse> => {
  return wrapfetch(endpoints.computeWalletAddress, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(resp),
  });
};

// APIからUserOperation署名用Optionsを取得する
export const generateUserOpHashOptions = (
  params: GenerateUserOperationHashOptionsRequest
): Promise<GenerateUserOperationHashOptionsResponse> => {
  return wrapfetch(endpoints.generateUserOpHashOptions, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
};

// UserOperation実行APIを呼び出す
export const executeUserOperation = (
  params: ExecuteUserOperationRequest
): Promise<ExecuteUserOperationResponse> => {
  return wrapfetch(endpoints.executeUserOperation, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
};
