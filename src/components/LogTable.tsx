import { LogEntry } from "@/store";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";
import React from "react";

export type LogTableProps = {
  logs: LogEntry[];
};

export const LogTable: React.FC<LogTableProps> = ({ logs }) => {
  return (
    <TableContainer>
      <Table size="small">
        <TableHead sx={{ bgcolor: "grey.300" }}>
          <TableRow>
            <TableCell>Date / Tag</TableCell>
            <TableCell>Message</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {logs.map((log, index) => {
            const color = log.level === "error" ? "error.main" : "";
            return (
              <TableRow key={index} sx={{ color, verticalAlign: "top" }}>
                <TableCell sx={{ color, textWrap: "nowrap" }}>
                  {log.date} <br /> {log.tag}
                </TableCell>
                <TableCell sx={{ color, lineBreak: "anywhere" }}>
                  {log.message}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
};
