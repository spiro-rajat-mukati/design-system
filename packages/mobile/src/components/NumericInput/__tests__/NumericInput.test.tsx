import React, { useState } from "react";
import { render, fireEvent } from "@testing-library/react-native";
import { ThemeProvider } from "../../../ThemeContext";
import { NumericInput } from "../NumericInput";

function wrap(ui: React.ReactElement) {
  return render(<ThemeProvider>{ui}</ThemeProvider>);
}

describe("NumericInput", () => {
  it("renders with default value", () => {
    const { getByDisplayValue } = wrap(<NumericInput defaultValue={5} />);
    expect(getByDisplayValue("5")).toBeTruthy();
  });

  it("calls onChange with incremented value", () => {
    const onChange = jest.fn();
    const { getByLabelText } = wrap(
      <NumericInput defaultValue={3} onChange={onChange} />,
    );
    fireEvent.press(getByLabelText("Increase"));
    expect(onChange).toHaveBeenCalledWith(4);
  });

  it("calls onChange with decremented value", () => {
    const onChange = jest.fn();
    const { getByLabelText } = wrap(
      <NumericInput defaultValue={3} onChange={onChange} />,
    );
    fireEvent.press(getByLabelText("Decrease"));
    expect(onChange).toHaveBeenCalledWith(2);
  });

  it("respects step prop", () => {
    const onChange = jest.fn();
    const { getByLabelText } = wrap(
      <NumericInput defaultValue={0} step={5} onChange={onChange} />,
    );
    fireEvent.press(getByLabelText("Increase"));
    expect(onChange).toHaveBeenCalledWith(5);
  });

  it("does not call onChange when already at max", () => {
    const onChange = jest.fn();
    const { getByLabelText } = wrap(
      <NumericInput defaultValue={10} max={10} onChange={onChange} />,
    );
    fireEvent.press(getByLabelText("Increase"));
    expect(onChange).not.toHaveBeenCalled();
  });

  it("does not call onChange when already at min", () => {
    const onChange = jest.fn();
    const { getByLabelText } = wrap(
      <NumericInput defaultValue={0} min={0} onChange={onChange} />,
    );
    fireEvent.press(getByLabelText("Decrease"));
    expect(onChange).not.toHaveBeenCalled();
  });

  it("clamps value to max when incremented from below max", () => {
    const onChange = jest.fn();
    const { getByLabelText } = wrap(
      <NumericInput defaultValue={9} max={10} step={5} onChange={onChange} />,
    );
    fireEvent.press(getByLabelText("Increase"));
    expect(onChange).toHaveBeenCalledWith(10);
  });

  it("does not call increment/decrement when disabled", () => {
    const onChange = jest.fn();
    const { getByLabelText } = wrap(
      <NumericInput defaultValue={5} disabled onChange={onChange} />,
    );
    fireEvent.press(getByLabelText("Increase"));
    fireEvent.press(getByLabelText("Decrease"));
    expect(onChange).not.toHaveBeenCalled();
  });

  it("handles direct text input", () => {
    const onChange = jest.fn();
    const { getByDisplayValue } = wrap(
      <NumericInput defaultValue={0} onChange={onChange} />,
    );
    fireEvent.changeText(getByDisplayValue("0"), "42");
    expect(onChange).toHaveBeenCalledWith(42);
  });

  it("renders in controlled mode", () => {
    const { getByDisplayValue } = wrap(<NumericInput value={7} />);
    expect(getByDisplayValue("7")).toBeTruthy();
  });

  it.each(["sm", "md", "lg"] as const)("renders size=%s", (size) => {
    const { getByDisplayValue } = wrap(<NumericInput defaultValue={1} size={size} />);
    expect(getByDisplayValue("1")).toBeTruthy();
  });

  it("renders in dark theme", () => {
    const { getByDisplayValue } = render(
      <ThemeProvider forcedTheme="dark">
        <NumericInput defaultValue={3} />
      </ThemeProvider>,
    );
    expect(getByDisplayValue("3")).toBeTruthy();
  });
});
