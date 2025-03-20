import { activeChains } from "@/envs/public";
import { ChainConfig } from "@/lib/types";
import { Menu, MenuItem } from "@mui/material";

export type ChainSelectProps = {
  anchorEl: null | HTMLElement;
  onSelect: (chain: ChainConfig) => void;
  onClose: () => void;
};

export const ChainSelect: React.FC<ChainSelectProps> = ({
  anchorEl,
  onSelect,
  onClose,
}) => {
  return (
    <Menu anchorEl={anchorEl} open={!!anchorEl} onClose={onClose}>
      {activeChains.map((chain) => (
        <MenuItem key={chain.name + chain.rpc} onClick={() => onSelect(chain)}>
          {chain.name}
        </MenuItem>
      ))}
    </Menu>
  );
};
