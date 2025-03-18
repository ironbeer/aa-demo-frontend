import {
  CoinbaseSmartWallet_Call,
  ExecuteUserOperationResponse,
} from "@/lib/types";
import { Address, isAddressEqual } from "viem";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

const maxTransactionHistory = 10;

export type Wallet = {
  passkeyID: string;
  nonce: number;
  address: Address; // 公開鍵のx,y座標とnonce値でウォレットアドレスが決まる
};

export type Wallets = { [passkeyID: string]: Wallet[] };

export type Calls = { [sender: Address]: CoinbaseSmartWallet_Call[] };

export type Transactions = {
  date: string;
  sender: Address;
  tx: ExecuteUserOperationResponse;
}[];

export type WalletStoreState = {
  wallets: Wallets;
  calls: Calls;
  transactions: Transactions;
  saveWallet: (wallet: Wallet) => void;
  nextNonce: (passkeyID: string) => number;
  replaceCalls: (sender: Address, calls: CoinbaseSmartWallet_Call[]) => void;
  saveTransaction: (sender: Address, tx: ExecuteUserOperationResponse) => void;
};

export const useWalletStore = create<WalletStoreState>()(
  persist(
    (set, get) => ({
      wallets: {},
      calls: {},
      transactions: [],
      saveWallet: (wallet) => {
        const wallets = get().wallets;
        const byKeyID = wallets[wallet.passkeyID] || [];
        if (byKeyID.some((w) => isAddressEqual(w.address, wallet.address))) {
          return;
        }
        wallets[wallet.passkeyID] = [...byKeyID, wallet];
        set({ wallets });
      },
      nextNonce: (passkeyID) => {
        return get().wallets[passkeyID]?.length ?? 0;
      },
      replaceCalls: (sender, newCalls) => {
        const calls = get().calls;
        calls[sender] = newCalls;
        set({ calls });
      },
      saveTransaction: (sender, tx) => {
        let txs = get().transactions;
        const date = new Date().toLocaleString("ja-JP");
        txs = [{ date, sender, tx }, ...txs].slice(0, maxTransactionHistory);
        set({ transactions: txs });
      },
    }),
    {
      name: "wallets",
      storage: createJSONStorage(() => localStorage),
    }
  )
);
