import React from "react";
import { render, screen, fireEvent } from "@testing-library/react-native";
import { ThemeProvider } from "../../../ThemeContext";
import { Button } from "../Button";

function wrap(ui: React.ReactElement) {
  return render(<ThemeProvider>{ui}</ThemeProvider>);
}

describe("Button", () => {
  it("renders its label", () => {
    wrap(<Button>Save</Button>);
    expect(screen.getByText("Save")).toBeTruthy();
  });

  it("calls onPress when tapped", () => {
    const onPress = jest.fn();
    wrap(<Button onPress={onPress}>Go</Button>);
    fireEvent.press(screen.getByRole("button"));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("does not call onPress when disabled", () => {
    const onPress = jest.fn();
    wrap(
      <Button disabled onPress={onPress}>
        Go
      </Button>,
    );
    fireEvent.press(screen.getByRole("button"));
    expect(onPress).not.toHaveBeenCalled();
  });

  it("does not call onPress when loading", () => {
    const onPress = jest.fn();
    wrap(
      <Button loading onPress={onPress}>
        Save
      </Button>,
    );
    fireEvent.press(screen.getByRole("button"));
    expect(onPress).not.toHaveBeenCalled();
  });

  it("shows spinner and hides label while loading", () => {
    wrap(<Button loading>Save</Button>);
    expect(screen.queryByText("Save")).toBeNull();
    expect(screen.getByLabelText("Loading")).toBeTruthy();
  });

  it("renders the forced dark theme without crashing", () => {
    render(
      <ThemeProvider forcedTheme="dark">
        <Button variant="primary">Dark</Button>
      </ThemeProvider>,
    );
    expect(screen.getByText("Dark")).toBeTruthy();
  });

  it.each(["primary", "secondary", "tertiary", "destructive", "link"] as const)(
    "renders variant=%s without crashing",
    (variant) => {
      wrap(<Button variant={variant}>{variant}</Button>);
      expect(screen.getByText(variant)).toBeTruthy();
    },
  );

  it.each(["xs", "sm", "md", "lg", "xl"] as const)(
    "renders size=%s without crashing",
    (size) => {
      wrap(<Button size={size}>Label</Button>);
      expect(screen.getByText("Label")).toBeTruthy();
    },
  );
});
