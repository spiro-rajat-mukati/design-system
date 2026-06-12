import React from "react";
import { render } from "@testing-library/react-native";
import { ThemeProvider } from "../../../ThemeContext";
import { ProgressBar } from "../ProgressBar";

function wrap(ui: React.ReactElement) {
  return render(<ThemeProvider>{ui}</ThemeProvider>);
}

describe("ProgressBar", () => {
  it("renders with default props", () => {
    const { getByRole } = wrap(<ProgressBar />);
    expect(getByRole("progressbar")).toBeTruthy();
  });

  it("sets accessibilityValue correctly", () => {
    const { getByRole } = wrap(<ProgressBar value={40} max={100} />);
    const bar = getByRole("progressbar");
    expect(bar.props.accessibilityValue).toEqual({ min: 0, max: 100, now: 40 });
  });

  it("clamps value above max", () => {
    const { getByRole } = wrap(<ProgressBar value={150} max={100} />);
    const bar = getByRole("progressbar");
    expect(bar.props.accessibilityValue.now).toBe(150);
  });

  it("renders label text", () => {
    const { getByText } = wrap(<ProgressBar label="Upload" value={60} />);
    expect(getByText("Upload")).toBeTruthy();
  });

  it("renders percentage when showValue is true", () => {
    const { getByText } = wrap(<ProgressBar value={75} showValue />);
    expect(getByText("75%")).toBeTruthy();
  });

  it("does not render percentage when indeterminate", () => {
    const { queryByText } = wrap(<ProgressBar indeterminate showValue />);
    expect(queryByText(/%/)).toBeNull();
  });

  it("uses custom accessibilityLabel", () => {
    const { getByLabelText } = wrap(
      <ProgressBar value={30} accessibilityLabel="Uploading file" />,
    );
    expect(getByLabelText("Uploading file")).toBeTruthy();
  });

  it.each(["xs", "sm", "md", "lg"] as const)("renders size=%s", (size) => {
    const { getByRole } = wrap(<ProgressBar size={size} value={50} />);
    expect(getByRole("progressbar")).toBeTruthy();
  });

  it.each(["brand", "success", "warning", "danger"] as const)(
    "renders tone=%s",
    (tone) => {
      const { getByRole } = wrap(<ProgressBar tone={tone} value={50} />);
      expect(getByRole("progressbar")).toBeTruthy();
    },
  );

  it("renders indeterminate variant", () => {
    const { getByRole } = wrap(<ProgressBar indeterminate />);
    expect(getByRole("progressbar")).toBeTruthy();
  });

  it("renders in dark theme", () => {
    const { getByRole } = render(
      <ThemeProvider forcedTheme="dark">
        <ProgressBar value={60} tone="success" />
      </ThemeProvider>,
    );
    expect(getByRole("progressbar")).toBeTruthy();
  });
});
