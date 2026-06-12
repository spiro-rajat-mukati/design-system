import React, { createContext, useContext, useMemo } from "react";
import { useColorScheme } from "react-native";
import { themes, type ThemeName } from "@kijani/tokens";

type Theme = (typeof themes)[ThemeName];

export interface ThemeContextValue {
  theme: Theme;
  themeName: ThemeName;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

interface ThemeProviderProps {
  children: React.ReactNode;
  /** Force a specific theme instead of following the system. */
  forcedTheme?: ThemeName;
}

export function ThemeProvider({ children, forcedTheme }: ThemeProviderProps) {
  const systemScheme = useColorScheme();
  const themeName: ThemeName =
    forcedTheme ?? (systemScheme === "dark" ? "dark" : "light");
  const value = useMemo<ThemeContextValue>(
    () => ({ theme: themes[themeName], themeName }),
    [themeName],
  );
  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (ctx === null) {
    throw new Error("useTheme must be used inside <ThemeProvider>");
  }
  return ctx;
}
