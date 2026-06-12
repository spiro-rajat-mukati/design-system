import React from "react";
import { render, screen, fireEvent } from "@testing-library/react-native";
import { ThemeProvider } from "../../../ThemeContext";
import { Checkbox } from "../Checkbox";
import { CheckboxGroup } from "../CheckboxGroup";

function wrap(ui: React.ReactElement) {
  return render(<ThemeProvider>{ui}</ThemeProvider>);
}

describe("Checkbox", () => {
  it("renders label", () => {
    wrap(<Checkbox label="Accept terms" />);
    expect(screen.getByText("Accept terms")).toBeTruthy();
  });

  it("calls onChange when pressed", () => {
    const onChange = jest.fn();
    wrap(<Checkbox label="Accept" onChange={onChange} />);
    fireEvent.press(screen.getByRole("checkbox"));
    expect(onChange).toHaveBeenCalledWith(true);
  });

  it("does not call onChange when disabled", () => {
    const onChange = jest.fn();
    wrap(<Checkbox label="Accept" disabled onChange={onChange} />);
    fireEvent.press(screen.getByRole("checkbox"));
    expect(onChange).not.toHaveBeenCalled();
  });

  it("toggles unchecked → checked", () => {
    wrap(<Checkbox label="Accept" defaultChecked={false} />);
    const cb = screen.getByRole("checkbox");
    expect(cb.props.accessibilityState.checked).toBe(false);
    fireEvent.press(cb);
    expect(screen.getByRole("checkbox").props.accessibilityState.checked).toBe(true);
  });

  it("shows indeterminate state", () => {
    wrap(<Checkbox label="All" indeterminate />);
    expect(screen.getByRole("checkbox").props.accessibilityState.checked).toBe("mixed");
  });

  it("renders description", () => {
    wrap(<Checkbox label="Accept" description="You agree to the terms." />);
    expect(screen.getByText("You agree to the terms.")).toBeTruthy();
  });
});

describe("CheckboxGroup", () => {
  const OPTIONS = [
    { value: "a", label: "Apple" },
    { value: "b", label: "Banana" },
  ];

  it("renders all options", () => {
    wrap(<CheckboxGroup options={OPTIONS} />);
    expect(screen.getByText("Apple")).toBeTruthy();
    expect(screen.getByText("Banana")).toBeTruthy();
  });

  it("calls onChange with updated selection", () => {
    const onChange = jest.fn();
    wrap(
      <CheckboxGroup options={OPTIONS} value={[]} onChange={onChange} />,
    );
    fireEvent.press(screen.getByText("Apple"));
    expect(onChange).toHaveBeenCalledWith(["a"]);
  });

  it("deselects an already-selected option", () => {
    const onChange = jest.fn();
    wrap(
      <CheckboxGroup
        options={OPTIONS}
        value={["a"]}
        onChange={onChange}
      />,
    );
    fireEvent.press(screen.getByText("Apple"));
    expect(onChange).toHaveBeenCalledWith([]);
  });
});
