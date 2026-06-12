import React from "react";
import { render, screen, fireEvent } from "@testing-library/react-native";
import { ThemeProvider } from "../../../ThemeContext";
import { Radio } from "../Radio";
import { RadioGroup } from "../RadioGroup";

function wrap(ui: React.ReactElement) {
  return render(<ThemeProvider>{ui}</ThemeProvider>);
}

describe("Radio", () => {
  it("renders label", () => {
    wrap(<Radio label="Option A" value="a" />);
    expect(screen.getByText("Option A")).toBeTruthy();
  });

  it("calls onChange when pressed", () => {
    const onChange = jest.fn();
    wrap(<Radio label="Option A" value="a" onChange={onChange} />);
    fireEvent.press(screen.getByRole("radio"));
    expect(onChange).toHaveBeenCalledWith("a");
  });

  it("does not call onChange when disabled", () => {
    const onChange = jest.fn();
    wrap(<Radio label="Option A" value="a" disabled onChange={onChange} />);
    fireEvent.press(screen.getByRole("radio"));
    expect(onChange).not.toHaveBeenCalled();
  });

  it("reflects checked state", () => {
    wrap(<Radio label="Option A" value="a" checked />);
    expect(screen.getByRole("radio").props.accessibilityState.checked).toBe(true);
  });

  it("renders description", () => {
    wrap(<Radio label="A" value="a" description="Good choice" />);
    expect(screen.getByText("Good choice")).toBeTruthy();
  });
});

describe("RadioGroup", () => {
  const OPTIONS = [
    { value: "a", label: "Apple" },
    { value: "b", label: "Banana" },
    { value: "c", label: "Cherry" },
  ];

  it("renders all options", () => {
    wrap(<RadioGroup options={OPTIONS} />);
    expect(screen.getByText("Apple")).toBeTruthy();
    expect(screen.getByText("Banana")).toBeTruthy();
    expect(screen.getByText("Cherry")).toBeTruthy();
  });

  it("calls onChange when an option is selected", () => {
    const onChange = jest.fn();
    wrap(
      <RadioGroup options={OPTIONS} value="a" onChange={onChange} />,
    );
    fireEvent.press(screen.getByText("Banana"));
    expect(onChange).toHaveBeenCalledWith("b");
  });

  it("only one option checked at a time (controlled)", () => {
    wrap(<RadioGroup options={OPTIONS} value="b" />);
    const radios = screen.getAllByRole("radio");
    const checked = radios.filter(
      (r) => r.props.accessibilityState.checked === true,
    );
    expect(checked).toHaveLength(1);
  });
});
