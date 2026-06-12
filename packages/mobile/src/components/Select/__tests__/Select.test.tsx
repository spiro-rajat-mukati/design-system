import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import { ThemeProvider } from "../../../ThemeContext";
import { Select } from "../Select";

const opts = [
  { value: "a", label: "Apple" },
  { value: "b", label: "Banana" },
  { value: "c", label: "Cherry", disabled: true },
];

function wrap(ui: React.ReactElement) {
  return render(<ThemeProvider>{ui}</ThemeProvider>);
}

describe("Select", () => {
  it("renders placeholder when no value selected", () => {
    const { getByText } = wrap(<Select options={opts} placeholder="Pick one" />);
    expect(getByText("Pick one")).toBeTruthy();
  });

  it("renders selected label in controlled mode", () => {
    const { getByText } = wrap(<Select options={opts} value="b" />);
    expect(getByText("Banana")).toBeTruthy();
  });

  it("renders selected label in uncontrolled mode with defaultValue", () => {
    const { getByText } = wrap(
      <Select options={opts} defaultValue="a" />,
    );
    expect(getByText("Apple")).toBeTruthy();
  });

  it("trigger is accessible with role=button", () => {
    const { getByRole } = wrap(<Select options={opts} />);
    expect(getByRole("button")).toBeTruthy();
  });

  it("trigger disabled state set correctly", () => {
    const { getByRole } = wrap(<Select options={opts} disabled />);
    expect(getByRole("button").props.accessibilityState.disabled).toBe(true);
  });

  it("does not open picker when disabled", () => {
    const { getByRole, queryByText } = wrap(
      <Select options={opts} disabled />,
    );
    fireEvent.press(getByRole("button"));
    // Modal or ActionSheet should not appear with Android option list
    expect(queryByText("Apple")).toBeNull();
  });

  it("renders all sizes", () => {
    const sizes = ["sm", "md", "lg"] as const;
    sizes.forEach((size) => {
      const { getByTestId } = wrap(
        <Select options={opts} size={size} testID={`sel-${size}`} />,
      );
      expect(getByTestId(`sel-${size}`)).toBeTruthy();
    });
  });

  it("renders in dark theme", () => {
    const { getByRole } = render(
      <ThemeProvider forcedTheme="dark">
        <Select options={opts} />
      </ThemeProvider>,
    );
    expect(getByRole("button")).toBeTruthy();
  });
});
