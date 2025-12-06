import React from "react";
import { createTheme, ThemeProvider, CssBaseline } from "@mui/material";
import { CacheProvider } from "@emotion/react";
import createCache from "@emotion/cache";
import stylisRTLPlugin from "stylis-plugin-rtl";

const rtlCache = createCache({ key: "mui-rtl", stylisPlugins: [stylisRTLPlugin] });

export const ColorModeContext = React.createContext({ toggle: () => {} });

export default function ThemeProviderRTL({ children }) {
  const [mode, setMode] = React.useState("light");
  const colorMode = React.useMemo(() => ({ toggle: () => setMode((m) => (m === "light" ? "dark" : "light")) }), []);
  const theme = React.useMemo(() => createTheme({
    direction: "rtl",
    palette: {
      mode,
      primary: { main: mode === "light" ? "#0ea5e9" : "#38bdf8" },
      background: { default: mode === "light" ? "#f8fafc" : "#0b1220" }
    },
    typography: {
      fontFamily: `"Tajawal", "Noto Kufi Arabic", "Segoe UI", Arial, sans-serif`,
    },
    shape: { borderRadius: 14 },
    components: {
      MuiCard: { styleOverrides: { root: { borderRadius: 16 } } },
      MuiButton: { styleOverrides: { root: { textTransform: "none", borderRadius: 12 } } },
    }
  }), [mode]);

  return (
    <CacheProvider value={rtlCache}>
      <ColorModeContext.Provider value={colorMode}>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <div dir="rtl">{children}</div>
        </ThemeProvider>
      </ColorModeContext.Provider>
    </CacheProvider>
  );
}

