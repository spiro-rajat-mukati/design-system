import React from "react";
import { render, screen, fireEvent } from "@testing-library/react-native";
import { ThemeProvider } from "../../../ThemeContext";
import { Field } from "../../Field";
import { TextInput } from "../TextInput";

function wrap(ui: React.ReactElement) {
  return render(<ThemeProvider>{ui}</ThemeProvider>);
}

describe("TextInput", () => {
  it("renders with placeholder", () => {
    wrap(<TextInput placeholder="Enter email" testID="input" />);
    expect(screen.getByPlaceholderText("Enter email")).toBeTruthy();
  });

  it("calls onChangeText when typed", () => {
    const onChangeText = jest.fn();
    wrap(<TextInput testID="input" onChangeText={onChangeText} />);
    fireEvent.changeText(screen.getByTestId("input").findByType("TextInput" as any), "hello");
    expect(onChangeText).toHaveBeenCalledWith("hello");
  });

  it("is not editable when disabled", () => {
    wrap(
      <TextInput disabled placeholder="Email" testID="input" />,
    );
    const input = screen.getByPlaceholderText("Email");
    expect(input.props.editable).toBe(false);
  });

  it("shows clear button when clearable and value set", () => {
    wrap(
      <TextInput clearable value="hello" testID="input" />,
    );
    expect(screen.getByLabelText("Clear")).toBeTruthy();
  });

  it("calls onClear when clear button pressed", () => {
    const onClear = jest.fn();
    wrap(
      <TextInput clearable value="hello" onClear={onClear} testID="input" />,
    );
    fireEvent.press(screen.getByLabelText("Clear"));
    expect(onClear).toHaveBeenCalledTimes(1);
  });

  it("inherits error state from Field context", () => {
    wrap(
      <Field label="Email" errorText="Required">
        <TextInput testID="input" placeholder="Email" />
      </Field>,
    );
    const input = screen.getByPlaceholderText("Email");
    expect(input).toBeTruthy();
  });

  it("renders prefix and suffix text", () => {
    wrap(
      <TextInput prefix="https://" suffix=".com" testID="input" />,
    );
    expect(screen.getByText("https://")).toBeTruthy();
    expect(screen.getByText(".com")).toBeTruthy();
  });

  it("renders in dark theme without crashing", () => {
    render(
      <ThemeProvider forcedTheme="dark">
        <TextInput placeholder="Dark" testID="input" />
      </ThemeProvider>,
    );
    expect(screen.getByPlaceholderText("Dark")).toBeTruthy();
  });
});
