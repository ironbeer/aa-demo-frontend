import { createTheme } from "@mui/material";

const theme = createTheme({
  typography: {
    fontFamily: [
      "Roboto Mono",
      "Source Code Pro",
      "Consolas",
      "Monaco",
      "Menlo",
      "Courier New",
      "monospace",
    ].join(","),
  },
});

export default theme;
