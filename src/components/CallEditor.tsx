import { CoinbaseSmartWallet_Call } from "@/lib/types";
import DeleteIcon from "@mui/icons-material/Delete";
import {
  Button,
  Grid2,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
} from "@mui/material";
import { useState } from "react";
import { Address, Hex, isAddress, isHex } from "viem";

export type CallEditorProps = {
  sender: Address;
  initCalls: CoinbaseSmartWallet_Call[];
  onSubmit: (calls: CoinbaseSmartWallet_Call[]) => void;
};

type Form = {
  target: string;
  value: string;
  data: string;
};

type FormError = {
  target: string;
  value: string;
  data: string;
};

export const CallEditor: React.FC<CallEditorProps> = ({
  initCalls,
  onSubmit,
}) => {
  const [calls, setCalls] = useState<Form[]>(
    initCalls.map((x) => ({
      target: x.target,
      value: String(x.value),
      data: x.data,
    }))
  );
  const [errors, setErrors] = useState<{ [i: number]: FormError }>([]);

  const updateCall = (i: number, call: Form) => {
    updateErrors(i, validation(call));
    setCalls((prev) => {
      const newCalls = [...prev];
      newCalls[i] = call;
      return newCalls;
    });
  };

  const dropCall = (i: number) => {
    setCalls((prev) => {
      const newCalls = [...prev];
      newCalls.splice(i, 1);
      return newCalls;
    });
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[i];
      return newErrors;
    });
  };

  const validation = (call: Form): FormError => {
    return {
      target: isAddress(call.target) ? "" : "Invalid address",
      value: /^[0-9]+$/g.test(call.value) ? "" : "Invalid number",
      data: isHex(call.data) ? "" : "Invalid data",
    };
  };

  const updateErrors = (i: number, err: FormError) => {
    setErrors((prev) => {
      const newErrors = { ...prev };
      newErrors[i] = err;
      return newErrors;
    });
  };

  const onClickAdd = () =>
    setCalls([...calls, { target: "", value: "0", data: "0x" }]);

  const onClickDone = () => {
    const validCalls = calls.filter((form, i) => {
      const err = validation(form);
      updateErrors(i, err);
      return !err.target && !err.value && !err.data;
    });

    if (calls.length === validCalls.length) {
      onSubmit(
        calls.map((call) => ({
          target: call.target as Address,
          value: call.value,
          data: call.data as Hex,
        }))
      );
      setCalls([]);
      setErrors({});
    }
  };

  // const onClickAddPaymasterMintCall = () => {
  //   const target = paymasterToken;
  //   const value = "0";
  //   const data = encodeFunctionData({
  //     abi: tokenPaymasterABI,
  //     functionName: "mintTokens",
  //     args: [sender, parseEther("1")],
  //   });

  //   // 最初にPaymasterトークンを受け取らないとガス代が払えないので先頭に挿入
  //   setCalls([{ target, value, data }, ...calls]);
  // };

  return (
    <Grid2 onSubmit={(e) => e.preventDefault()} container spacing={2}>
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>To</TableCell>
              <TableCell>Value</TableCell>
              <TableCell>Data</TableCell>
              <TableCell></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {calls.map((_, i) => (
              <TableRow key={i}>
                <TableCell
                  sx={{ border: "none", verticalAlign: "top", width: 500 }}
                >
                  <TextField
                    value={calls[i].target}
                    error={Boolean(errors[i]?.target)}
                    helperText={errors[i]?.target}
                    onChange={(e) =>
                      updateCall(i, { ...calls[i], target: e.target.value })
                    }
                    required
                    fullWidth
                    size="small"
                    placeholder="0x"
                  />
                </TableCell>
                <TableCell
                  sx={{ border: "none", verticalAlign: "top", width: 200 }}
                >
                  <TextField
                    value={calls[i].value}
                    error={Boolean(errors[i]?.value)}
                    helperText={errors[i]?.value}
                    onChange={(e) =>
                      updateCall(i, {
                        ...calls[i],
                        value: e.target.value,
                      })
                    }
                    required
                    fullWidth
                    size="small"
                    placeholder="0"
                    sx={{ verticalAlign: "top" }}
                  />
                </TableCell>
                <TableCell sx={{ border: "none", verticalAlign: "top" }}>
                  <TextField
                    value={calls[i].data}
                    error={Boolean(errors[i]?.data)}
                    helperText={errors[i]?.data}
                    onChange={(e) =>
                      updateCall(i, {
                        ...calls[i],
                        data: e.target.value,
                      })
                    }
                    required
                    fullWidth
                    size="small"
                    placeholder="0x"
                    sx={{ verticalAlign: "top" }}
                  />
                </TableCell>
                <TableCell sx={{ border: "none", p: 0 }}>
                  <IconButton onClick={() => dropCall(i)} size="small">
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Grid2 container spacing={2} size={12} justifyContent="flex-end">
        {/* <Grid2>
          <Button
            onClick={onClickAddPaymasterMintCall}
            variant="contained"
            sx={{ textTransform: "none" }}
          >
            Add Paymaster Mint Call
          </Button>
        </Grid2> */}
        <Grid2>
          <Button
            onClick={onClickAdd}
            variant="contained"
            sx={{ textTransform: "none" }}
          >
            Add
          </Button>
        </Grid2>
        <Grid2>
          <Button
            onClick={onClickDone}
            variant="outlined"
            sx={{ textTransform: "none" }}
          >
            Done
          </Button>
        </Grid2>
      </Grid2>
    </Grid2>
  );
};
