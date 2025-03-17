import { Wallet, Wallets } from "@/store";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";
import React, { ReactNode } from "react";

export type ActionsProps = {
  wallet: Wallet;
};

export type WalletTableProps = {
  wallets: Wallets;
  renderActions: (props: ActionsProps) => ReactNode;
};

export const WalletTable: React.FC<WalletTableProps> = ({
  wallets,
  renderActions,
}) => {
  return (
    <TableContainer>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>PasskeyID (nonce)</TableCell>
            <TableCell>Address</TableCell>
            {/* <TableCell>Nonce</TableCell> */}
            <TableCell></TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {Object.entries(wallets).map(([passkeyID, wallets]) =>
            wallets.map((wallet, i) => (
              <TableRow key={`${passkeyID}-${i}`}>
                <TableCell>
                  {passkeyID} ({wallet.nonce})
                </TableCell>
                <TableCell>{wallet.address}</TableCell>
                {/* <TableCell>{wallet.nonce}</TableCell> */}
                <TableCell>{renderActions({ wallet })}</TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
};
