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
          {logs.map((log, index) => (
            <TableRow
              key={index}
              sx={{
                verticalAlign: "top",
                color: log.level === "error" ? "error.main" : "",
              }}
            >
              <TableCell sx={{ color: "inherit", textWrap: "nowrap" }}>
                {log.date} <br /> {log.tag}
              </TableCell>
              <TableCell
                sx={{
                  color: "inherit",
                  lineBreak: "anywhere",
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
