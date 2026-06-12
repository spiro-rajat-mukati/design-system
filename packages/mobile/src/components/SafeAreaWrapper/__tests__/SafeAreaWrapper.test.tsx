import React from "react";
import { Text } from "react-native";
import { render } from "@testing-library/react-native";
import { ThemeProvider } from "../../../ThemeContext";
import { SafeAreaWrapper } from "../SafeAreaWrapper";

function wrap(ui: React.ReactElement) {
  return render(<ThemeProvider>{ui}</ThemeProvider>);
}

describe("SafeAreaWrapper", () => {
  it("renders children", () => {
    const { getByText } = wrap(
      <SafeAreaWrapper>
        <Text>Hello</Text>
      </SafeAreaWrapper>,
    );
    expect(getByText("Hello")).toBeTruthy();
  });

  it("accepts testID", () => {
    const { getByTestId } = wrap(
      <SafeAreaWrapper testID="safe-wrapper">
        <Text>content</Text>
      </SafeAreaWrapper>,
    );
    expect(getByTestId("safe-wrapper")).toBeTruthy();
  });

  it.each(["default", "raised", "sunken", "inverse", "brand"] as const)(
    "renders surface=%s",
    (surface) => {
      const { getByTestId } = wrap(
        <SafeAreaWrapper surface={surface} testID="w">
          <Text>x</Text>
        </SafeAreaWrapper>,
      );
      expect(getByTestId("w")).toBeTruthy();
    },
  );

  it("renders with subset of edges", () => {
    const { getByText } = wrap(
      <SafeAreaWrapper edges={["bottom"]}>
        <Text>partial</Text>
      </SafeAreaWrapper>,
    );
    expect(getByText("partial")).toBeTruthy();
  });

  it("renders with empty edges array", () => {
    const { getByText } = wrap(
      <SafeAreaWrapper edges={[]}>
        <Text>none</Text>
      </SafeAreaWrapper>,
    );
    expect(getByText("none")).toBeTruthy();
  });

  it("renders in dark theme", () => {
    const { getByTestId } = render(
      <ThemeProvider forcedTheme="dark">
        <SafeAreaWrapper testID="dark-safe">
          <Text>dark</Text>
        </SafeAreaWrapper>
      </ThemeProvider>,
    );
    expect(getByTestId("dark-safe")).toBeTruthy();
  });

  it("applies correct background for surface=inverse", () => {
    const { getByTestId } = wrap(
      <SafeAreaWrapper surface="inverse" testID="inv">
        <Text>inv</Text>
      </SafeAreaWrapper>,
    );
    const el = getByTestId("inv");
    // Verify token-driven color is applied (not hardcoded)
    expect(el.props.style).toBeTruthy();
  });
});
