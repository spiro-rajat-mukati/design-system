import React from "react";
import { renderHook, act } from "@testing-library/react-hooks";
import { ThemeProvider, useTheme } from "../ThemeContext";
import { themes } from "@kijani/tokens";

jest.mock("react-native", () => ({
  useColorScheme: jest.fn(() => "light"),
}));

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <ThemeProvider>{children}</ThemeProvider>
);

describe("useTheme", () => {
  it("returns the light theme when system is light", () => {
    const { result } = renderHook(() => useTheme(), { wrapper });
    expect(result.current.themeName).toBe("light");
    expect(result.current.theme).toBe(themes.light);
  });

  it("returns the forced dark theme when forcedTheme=dark", () => {
    const darkWrapper = ({ children }: { children: React.ReactNode }) => (
      <ThemeProvider forcedTheme="dark">{children}</ThemeProvider>
    );
    const { result } = renderHook(() => useTheme(), { wrapper: darkWrapper });
    expect(result.current.themeName).toBe("dark");
    expect(result.current.theme).toBe(themes.dark);
  });

  it("throws when used outside ThemeProvider", () => {
    const consoleError = jest.spyOn(console, "error").mockImplementation();
    expect(() => renderHook(() => useTheme())).toThrow(
      "useTheme must be used inside <ThemeProvider>",
    );
    consoleError.mockRestore();
  });
});
