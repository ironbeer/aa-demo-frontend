import { supportedChains, activeChains } from "@/envs/public";
import { ChainConfig, ChainID } from "@/lib/types";
import { Address, Hex, isAddress } from "viem";
import { create } from "zustand";

export type ChainStore = {
  selected: ChainConfig;
  onSelect: (chain: ChainConfig) => void;
  getChainName: (chainID?: ChainID) => string;
  getExplorerLink: (addressOrTx: Address | Hex, chainID?: ChainID) => string;
};

export const useChainStore = create<ChainStore>()((set, get) => ({
  selected: activeChains[0],
  onSelect: (selected) => set({ selected }),
  getChainName: (chainID) => {
    const chain = chainID ? supportedChains[chainID] : get().selected;
    return chain.name;
  },
  getExplorerLink: (s, chainID) => {
    const chain = chainID ? supportedChains[chainID] : get().selected;
    if (isAddress(s)) {
      return `${chain.explorer}/address/${s}`;
    }
    return `${chain.explorer}/tx/${s}`;
  },
}));
