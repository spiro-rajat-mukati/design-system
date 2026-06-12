import React from "react";
import { renderHook } from "@testing-library/react-native";
import { ThemeProvider, useTheme } from "../ThemeContext";
import { themes } from "@kijani/tokens";

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <ThemeProvider forcedTheme="light">{children}</ThemeProvider>
);

describe("useTheme", () => {
  it("returns the light theme when forced light", () => {
    const { result } = renderHook(() => useTheme(), { wrapper });
    expect(result.current.themeName).toBe("light");
    expect(result.current.theme).toBe(themes.light);
  });

  it("returns the dark theme when forcedTheme=dark", () => {
    const darkWrapper = ({ children }: { children: React.ReactNode }) => (
      <ThemeProvider forcedTheme="dark">{children}</ThemeProvider>
    );
    const { result } = renderHook(() => useTheme(), { wrapper: darkWrapper });
    expect(result.current.themeName).toBe("dark");
    expect(result.current.theme).toBe(themes.dark);
  });

  it("throws when used outside ThemeProvider", () => {
    expect(() => renderHook(() => useTheme())).toThrow(
      "useTheme must be used inside <ThemeProvider>",
    );
  });
});
