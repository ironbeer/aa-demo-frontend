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
        <TableHead>
          <TableRow>
            <TableCell>Date</TableCell>
            <TableCell>Level</TableCell>
            <TableCell>Action</TableCell>
            <TableCell>Message</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {logs.map((log, index) => (
            <TableRow key={index}>
              <TableCell sx={{ textWrap: "nowrap" }}>{log.date}</TableCell>
              <TableCell>{log.level}</TableCell>
              <TableCell>{log.action}</TableCell>
              <TableCell
                sx={{
                  lineBreak: "anywhere",
                  color: log.level === "error" ? "error.main" : "",
                }}
              >
                {log.message}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};
