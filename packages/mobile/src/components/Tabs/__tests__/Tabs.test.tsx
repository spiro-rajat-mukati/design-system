import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import { ThemeProvider } from "../../../ThemeContext";
import { Tabs } from "../Tabs";

const items = [
  { value: "home", label: "Home" },
  { value: "explore", label: "Explore" },
  { value: "settings", label: "Settings" },
];

function wrap(ui: React.ReactElement) {
  return render(<ThemeProvider>{ui}</ThemeProvider>);
}

describe("Tabs", () => {
  it("renders all tab labels", () => {
    const { getByText } = wrap(<Tabs items={items} />);
    expect(getByText("Home")).toBeTruthy();
    expect(getByText("Explore")).toBeTruthy();
    expect(getByText("Settings")).toBeTruthy();
  });

  it("first tab is selected by default", () => {
    const { getByLabelText } = wrap(<Tabs items={items} />);
    expect(getByLabelText("Home").props.accessibilityState.selected).toBe(true);
    expect(getByLabelText("Explore").props.accessibilityState.selected).toBe(false);
  });

  it("calls onChange when tab is pressed", () => {
    const onChange = jest.fn();
    const { getByText } = wrap(<Tabs items={items} onChange={onChange} />);
    fireEvent.press(getByText("Explore"));
    expect(onChange).toHaveBeenCalledWith("explore");
  });

  it("does not call onChange for disabled tab", () => {
    const onChange = jest.fn();
    const disabledItems = [
      { value: "a", label: "A" },
      { value: "b", label: "B", disabled: true },
    ];
    const { getByText } = wrap(
      <Tabs items={disabledItems} onChange={onChange} />,
    );
    fireEvent.press(getByText("B"));
    expect(onChange).not.toHaveBeenCalled();
  });

  it("reflects controlled value", () => {
    const { getByLabelText } = wrap(
      <Tabs items={items} value="settings" />,
    );
    expect(getByLabelText("Settings").props.accessibilityState.selected).toBe(true);
    expect(getByLabelText("Home").props.accessibilityState.selected).toBe(false);
  });

  it.each(["underline", "pill"] as const)("renders variant=%s", (variant) => {
    const { getByText } = wrap(<Tabs items={items} variant={variant} />);
    expect(getByText("Home")).toBeTruthy();
  });

  it.each(["sm", "md", "lg"] as const)("renders size=%s", (size) => {
    const { getByTestId } = wrap(
      <Tabs items={items} size={size} testID={`tabs-${size}`} />,
    );
    expect(getByTestId(`tabs-${size}`)).toBeTruthy();
  });

  it("renders in dark theme", () => {
    const { getByTestId } = render(
      <ThemeProvider forcedTheme="dark">
        <Tabs items={items} testID="tabs-dark" />
      </ThemeProvider>,
    );
    expect(getByTestId("tabs-dark")).toBeTruthy();
  });
});
