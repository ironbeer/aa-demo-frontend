import { Transactions, useChainStore } from "@/store";
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
import React from "react";

export type TransactionTableProps = {
  transactions: Transactions;
};

export const TransactionTable: React.FC<TransactionTableProps> = ({
  transactions,
}) => {
  const { getChainName, getExplorerLink } = useChainStore();

  const statusLabel = (
    callStatus: boolean,
    receiptStatus: "success" | "reverted"
  ) => {
    if (receiptStatus === "reverted") return "Reverted"; // TX自体がRevert
    if (!callStatus) return "Failed"; // TXは成功したがCallが失敗
    return "Success";
  };

  return (
    <TableContainer>
      <Table size="small" sx={{ textWrap: "nowrap" }}>
        <TableHead sx={{ bgcolor: "grey.300" }}>
          <TableRow>
            <TableCell>Date</TableCell>
            <TableCell>Chain</TableCell>
            <TableCell>Wallet address</TableCell>
            <TableCell>Transaction hash</TableCell>
            <TableCell>Status</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {transactions.map(({ date, chainID, sender, tx }) => (
            <TableRow key={tx.receipt.transaction}>
              <TableCell>{date}</TableCell>
              <TableCell>{getChainName(chainID)}</TableCell>
              <TableCell>
                {sender}
                <a
                  href={getExplorerLink(sender, chainID)}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <IconButton size="small">
                    <LaunchIcon fontSize="small" />
                  </IconButton>
                </a>
              </TableCell>
              <TableCell>
                {tx.receipt.transaction}
                <a
                  href={getExplorerLink(tx.receipt.transaction, chainID)}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <IconButton size="small">
                    <LaunchIcon fontSize="small" />
                  </IconButton>
                </a>
              </TableCell>
              <TableCell>
                {statusLabel(tx.success, tx.receipt.status)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};
