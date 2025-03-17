import { Hex, hexToBigInt } from "viem";

// sec256r1の位数nとn/2
const curveN = hexToBigInt(
  "0xffffffff00000000ffffffffffffffffbce6faada7179e84f3b9cac2fc632551"
);
const curveNdiv2 = curveN >> BigInt(1);

const sliceToBig = (hex: string, start: number, len: number): bigint => {
  const s = hex.slice(start * 2, start * 2 + len * 2);
  return hexToBigInt(`0x${s}`);
};

/**
 * signatureからr,sを取得する
 */
export const getSignatureRS = (
  signature: string | Hex
): { r: bigint; s: bigint } => {
  // signatureのバイトフォーマット
  // 1バイト: 固定値(0x30)
  // 2バイト: 全体の長さ
  // 3バイト: 固定値(0x02)
  // 4バイト: rの長さ
  // 5バイト~r長: r
  // rの次の1バイト : sの長さ
  // sの次のs長: s
  if (signature.slice(0, 2) === "0x") {
    signature = signature.slice(2);
  }

  let offset = 3;

  const rLen = sliceToBig(signature, offset, 1);
  const r = sliceToBig(signature, offset + 1, Number(rLen));
  offset += 2 + Number(rLen);

  const sLen = sliceToBig(signature, offset, 1);
  let s = sliceToBig(signature, offset + 1, Number(sLen));
  if (s > curveNdiv2) {
    s = curveN - s;
  }

  return { r, s };
};
