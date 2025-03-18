import { explorerURL } from "@/envs/public";
import { Wallet, Wallets } from "@/store";
import LaunchIcon from "@mui/icons-material/Launch";
import {
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";
import React, { ReactNode } from "react";

export type WalletTableProps = {
  wallets: Wallets;
  renderActions: (props: { wallet: Wallet }) => ReactNode;
};

export const WalletTable: React.FC<WalletTableProps> = ({
  wallets,
  renderActions,
}) => {
  return (
    <TableContainer>
      <Table size="small">
        <TableHead sx={{ bgcolor: "grey.300" }}>
          <TableRow>
            <TableCell>Wallet address</TableCell>
            <TableCell>Assigned passkey (nonce)</TableCell>
            <TableCell></TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {Object.entries(wallets).map(([passkeyID, wallets]) =>
            wallets.map((wallet, i) => (
              <TableRow key={`${passkeyID}-${i}`}>
                <TableCell>
                  {wallet.address}
                  <a
                    href={`${explorerURL}/address/${wallet.address}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <IconButton size="small">
                      <LaunchIcon fontSize="small" />
                    </IconButton>
                  </a>
                </TableCell>
                <TableCell>
                  {passkeyID} ({wallet.nonce})
                </TableCell>
                <TableCell>{renderActions({ wallet })}</TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
};
