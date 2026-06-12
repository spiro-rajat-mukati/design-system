import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import { ThemeProvider } from "../../../ThemeContext";
import { SegmentedControl } from "../SegmentedControl";

const opts = [
  { value: "a", label: "All" },
  { value: "b", label: "Active" },
  { value: "c", label: "Done" },
];

function wrap(ui: React.ReactElement) {
  return render(<ThemeProvider>{ui}</ThemeProvider>);
}

describe("SegmentedControl", () => {
  it("renders all options", () => {
    const { getByText } = wrap(<SegmentedControl options={opts} />);
    expect(getByText("All")).toBeTruthy();
    expect(getByText("Active")).toBeTruthy();
    expect(getByText("Done")).toBeTruthy();
  });

  it("first option selected state is true by default", () => {
    const { getByLabelText } = wrap(<SegmentedControl options={opts} />);
    const first = getByLabelText("All");
    expect(first.props.accessibilityState.selected).toBe(true);
  });

  it("calls onChange when option is pressed", () => {
    const onChange = jest.fn();
    const { getByText } = wrap(
      <SegmentedControl options={opts} onChange={onChange} />,
    );
    fireEvent.press(getByText("Active"));
    expect(onChange).toHaveBeenCalledWith("b");
  });

  it("does not call onChange for disabled option", () => {
    const onChange = jest.fn();
    const disabledOpts = [
      { value: "a", label: "All" },
      { value: "b", label: "Blocked", disabled: true },
    ];
    const { getByText } = wrap(
      <SegmentedControl options={disabledOpts} onChange={onChange} />,
    );
    fireEvent.press(getByText("Blocked"));
    expect(onChange).not.toHaveBeenCalled();
  });

  it("does not call onChange when all disabled", () => {
    const onChange = jest.fn();
    const { getByText } = wrap(
      <SegmentedControl options={opts} disabled onChange={onChange} />,
    );
    fireEvent.press(getByText("Active"));
    expect(onChange).not.toHaveBeenCalled();
  });

  it("reflects controlled value", () => {
    const { getByLabelText } = wrap(
      <SegmentedControl options={opts} value="c" />,
    );
    const done = getByLabelText("Done");
    expect(done.props.accessibilityState.selected).toBe(true);
  });

  it.each(["sm", "md", "lg"] as const)("renders size=%s", (size) => {
    const { getByTestId } = wrap(
      <SegmentedControl options={opts} size={size} testID={`seg-${size}`} />,
    );
    expect(getByTestId(`seg-${size}`)).toBeTruthy();
  });

  it("renders in dark theme", () => {
    const { getByTestId } = render(
      <ThemeProvider forcedTheme="dark">
        <SegmentedControl options={opts} testID="seg-dark" />
      </ThemeProvider>,
    );
    expect(getByTestId("seg-dark")).toBeTruthy();
  });
});
