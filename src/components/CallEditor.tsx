import { CoinbaseSmartWallet_Call } from "@/lib/types";
import AddCircleIcon from "@mui/icons-material/AddCircle";
import DeleteIcon from "@mui/icons-material/DeleteForever";
import {
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  debounce,
} from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import { Address, Hex, isAddress, isHex } from "viem";

export type CallEditorProps = {
  sender: Address;
  initCalls: CoinbaseSmartWallet_Call[];
  onChange: (calls: CoinbaseSmartWallet_Call[], isValid: boolean) => void;
  maxHeight?: number;
};

type Errors = {
  target?: string;
  value?: string;
  data?: string;
};

type Row = {
  values: CoinbaseSmartWallet_Call;
  errors?: Errors;
};

const defaultValues = {
  target: "" as Address,
  value: "0",
  data: "0x",
} as const;

export const CallEditor: React.FC<CallEditorProps> = ({
  initCalls,
  onChange,
  maxHeight = 250,
}) => {
  const [rows, setRows] = useState<Row[]>(
    initCalls.length
      ? initCalls.map((call) => ({ values: { ...call } }))
      : [{ values: { ...defaultValues } }]
  );

  const addRow = () => setRows([...rows, { values: { ...defaultValues } }]);

  const dropRow = (rowIdx: number) =>
    setRows((prev) => prev.filter((_, i) => i !== rowIdx));

  const updateValues = (rowIdx: number, values: CoinbaseSmartWallet_Call) =>
    setRows((prev) => {
      const newRows = [...prev];
      newRows[rowIdx] = { values, errors: validation(values) };
      return newRows;
    });

  const validation = (values: CoinbaseSmartWallet_Call) => {
    const errors: [keyof Errors, string][] = [];
    if (!isAddress(values.target)) {
      errors.push(["target", "Invalid address"]);
    }
    if (!/^[0-9]+$/g.test(values.value)) {
      errors.push(["value", "Invalid number"]);
    }
    if (!isHex(values.data)) {
      errors.push(["data", "Invalid data"]);
    }
    return errors.length ? Object.fromEntries(errors) : undefined;
  };

  const debouncedOnChange = useMemo(() => debounce(onChange, 100), []);
  useEffect(() => {
    const calls = rows.map((row) => row.values);
    const isValid = !rows.some((row) => validation(row.values));
    debouncedOnChange(calls, isValid);
    return () => debouncedOnChange.clear();
  }, [rows, debouncedOnChange]);

  return (
    <TableContainer sx={{ maxHeight, overflowY: "scroll" }}>
      <Table size="small" stickyHeader>
        <TableHead>
          <TableRow>
            <TableCell>To</TableCell>
            <TableCell>Value</TableCell>
            <TableCell>Data</TableCell>
            <TableCell></TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map(({ values, errors }, i) => (
            <TableRow key={i} sx={{ verticalAlign: "top" }}>
              <TableCell sx={{ border: "none", width: 490 }}>
                <TextField
                  value={values.target}
                  error={!!errors?.target}
                  helperText={errors?.target}
                  onChange={(e) =>
                    updateValues(i, {
                      ...values,
                      target: e.target.value as Address,
                    })
                  }
                  required
                  fullWidth
                  size="small"
                  placeholder="0x"
                />
              </TableCell>
              <TableCell sx={{ border: "none", width: 200 }}>
                <TextField
                  value={values.value}
                  error={!!errors?.value}
                  helperText={errors?.value}
                  onChange={(e) =>
                    updateValues(i, {
                      ...values,
                      value: e.target.value,
                    })
                  }
                  required
                  fullWidth
                  size="small"
                  placeholder="0"
                />
              </TableCell>
              <TableCell sx={{ border: "none" }}>
                <TextField
                  value={values.data}
                  error={!!errors?.data}
                  helperText={errors?.data}
                  onChange={(e) =>
                    updateValues(i, {
                      ...values,
                      data: e.target.value as Hex,
                    })
                  }
                  required
                  fullWidth
                  size="small"
                  placeholder="0x"
                />
              </TableCell>
              <TableCell sx={{ border: "none", pr: 0, pl: 0 }}>
                {rows.length > 1 && (
                  <IconButton onClick={() => dropRow(i)} size="small">
                    <DeleteIcon />
                  </IconButton>
                )}
                {i === rows.length - 1 && (
                  <IconButton onClick={addRow} size="small">
                    <AddCircleIcon />
                  </IconButton>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};
