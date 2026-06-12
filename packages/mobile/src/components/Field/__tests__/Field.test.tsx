import React from "react";
import { render, screen } from "@testing-library/react-native";
import { ThemeProvider } from "../../../ThemeContext";
import { Field } from "../Field";

function wrap(ui: React.ReactElement) {
  return render(<ThemeProvider>{ui}</ThemeProvider>);
}

describe("Field", () => {
  it("renders the label", () => {
    wrap(<Field label="Email">{"_"}</Field>);
    expect(screen.getByText("Email")).toBeTruthy();
  });

  it("appends asterisk when required", () => {
    wrap(
      <Field label="Email" required>
        {"_"}
      </Field>,
    );
    expect(screen.getByText("*")).toBeTruthy();
  });

  it("shows helper text by default", () => {
    wrap(
      <Field label="Email" helperText="Enter your email">
        {"_"}
      </Field>,
    );
    expect(screen.getByText("Enter your email")).toBeTruthy();
  });

  it("shows errorText and hides helperText", () => {
    wrap(
      <Field label="Email" helperText="Helper" errorText="Required">
        {"_"}
      </Field>,
    );
    expect(screen.getByText("Required")).toBeTruthy();
    expect(screen.queryByText("Helper")).toBeNull();
  });

  it("shows successText when provided", () => {
    wrap(
      <Field label="Email" successText="Looks good!">
        {"_"}
      </Field>,
    );
    expect(screen.getByText("Looks good!")).toBeTruthy();
  });

  it("shows description when provided", () => {
    wrap(
      <Field label="Bio" description="Tell us about yourself">
        {"_"}
      </Field>,
    );
    expect(screen.getByText("Tell us about yourself")).toBeTruthy();
  });

  it("renders in dark theme without crashing", () => {
    render(
      <ThemeProvider forcedTheme="dark">
        <Field label="Name" errorText="Required">
          {"_"}
        </Field>
      </ThemeProvider>,
    );
    expect(screen.getByText("Required")).toBeTruthy();
  });
});
