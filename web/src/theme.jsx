import React from "react";
import { createTheme, ThemeProvider, CssBaseline } from "@mui/material";
import { CacheProvider } from "@emotion/react";
import createCache from "@emotion/cache";
import stylisRTLPlugin from "stylis-plugin-rtl";

const rtlCache = createCache({ key: "mui-rtl", stylisPlugins: [stylisRTLPlugin] });

export const ColorModeContext = React.createContext({ mode: "light", toggle: () => {} });

function getInitialMode() {
  try {
    const saved = localStorage.getItem("theme");
    if (saved === "light" || saved === "dark") return saved;
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  } catch {
    return "light";
  }
}

export default function ThemeProviderRTL({ children }) {
  const [mode, setMode] = React.useState(getInitialMode);

  const colorMode = React.useMemo(
    () => ({
      mode,
      toggle: () => setMode((m) => (m === "light" ? "dark" : "light")),
    }),
    [mode]
  );
  React.useEffect(() => {
    try {
      localStorage.setItem("theme", mode);
    } catch {}
    const isDark = mode === "dark";
    const root = document.documentElement;
    root.classList.toggle("dark", isDark);
    root.style.colorScheme = isDark ? "dark" : "light";
  }, [mode]);

  const theme = React.useMemo(
    () =>
      createTheme({
        direction: "rtl",
        palette: {
          mode, 
          primary: { main: mode === "light" ? "#0ea5e9" : "#38bdf8" },
          background: { default: mode === "light" ? "#f8fafc" : "#0b1220" },
        },
        typography: {
          fontFamily: `"Tajawal","Noto Kufi Arabic","Segoe UI",Arial,sans-serif`,
        },
        shape: { borderRadius: 14 },
        components: {
          MuiCard: { styleOverrides: { root: { borderRadius: 16 } } },
          MuiButton: { styleOverrides: { root: { textTransform: "none", borderRadius: 12 } } },
        },
      }),
    [mode]
  );

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
