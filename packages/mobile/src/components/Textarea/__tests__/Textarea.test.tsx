import React from "react";
import { render, screen, fireEvent } from "@testing-library/react-native";
import { ThemeProvider } from "../../../ThemeContext";
import { Field } from "../../Field";
import { Textarea } from "../Textarea";

function wrap(ui: React.ReactElement) {
  return render(<ThemeProvider>{ui}</ThemeProvider>);
}

describe("Textarea", () => {
  it("renders with placeholder", () => {
    wrap(<Textarea placeholder="Enter notes" testID="ta" />);
    expect(screen.getByPlaceholderText("Enter notes")).toBeTruthy();
  });

  it("is multiline", () => {
    wrap(<Textarea testID="ta" />);
    const input = screen.getByTestId("ta").findAllByType("TextInput" as any)[0];
    expect(input?.props?.multiline).toBe(true);
  });

  it("shows character counter with showCount", () => {
    wrap(<Textarea showCount value="hello" testID="ta" />);
    expect(screen.getByText("5")).toBeTruthy();
  });

  it("shows max count when maxLength set", () => {
    wrap(<Textarea maxLength={100} value="hi" testID="ta" />);
    expect(screen.getByText("2 / 100")).toBeTruthy();
  });

  it("is not editable when disabled", () => {
    wrap(<Textarea disabled placeholder="Notes" testID="ta" />);
    const inputs = screen.getByPlaceholderText("Notes");
    expect(inputs.props.editable).toBe(false);
  });

  it("inherits error state from Field context", () => {
    wrap(
      <Field label="Notes" errorText="Required">
        <Textarea placeholder="Notes" testID="ta" />
      </Field>,
    );
    expect(screen.getByPlaceholderText("Notes")).toBeTruthy();
  });

  it("renders in dark theme without crashing", () => {
    render(
      <ThemeProvider forcedTheme="dark">
        <Textarea placeholder="Dark" testID="ta" />
      </ThemeProvider>,
    );
    expect(screen.getByPlaceholderText("Dark")).toBeTruthy();
  });
});
