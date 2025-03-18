import { explorerURL } from "@/envs/public";
import { Transactions } from "@/store";
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
  return (
    <TableContainer>
      <Table size="small">
        <TableHead sx={{ bgcolor: "grey.300" }}>
          <TableRow>
            <TableCell>Date</TableCell>
            <TableCell>Wallet address</TableCell>
            <TableCell>Transaction hash</TableCell>
            <TableCell>Receipt status</TableCell>
            <TableCell>Call status</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {transactions.map(({ date, sender, tx }) => (
            <TableRow key={tx.receipt.transaction}>
              <TableCell sx={{ textWrap: "nowrap" }}>{date}</TableCell>
              <TableCell>{sender}</TableCell>
              <TableCell>
                {tx.receipt.transaction}
                <a
                  href={`${explorerURL}/tx/${tx.receipt.transaction}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <IconButton size="small">
                    <LaunchIcon fontSize="small" />
                  </IconButton>
                </a>
              </TableCell>
              <TableCell>{tx.receipt.status}</TableCell>
              <TableCell>{tx.success ? "success" : "failed"}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};
