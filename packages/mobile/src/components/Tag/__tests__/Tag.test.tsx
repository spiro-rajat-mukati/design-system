import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import { ThemeProvider } from "../../../ThemeContext";
import { Tag } from "../Tag";

function wrap(ui: React.ReactElement) {
  return render(<ThemeProvider>{ui}</ThemeProvider>);
}

describe("Tag", () => {
  it("renders label text", () => {
    const { getByText } = wrap(<Tag label="React Native" />);
    expect(getByText("React Native")).toBeTruthy();
  });

  it("renders remove button when removable", () => {
    const { getByLabelText } = wrap(<Tag label="test" removable />);
    expect(getByLabelText("Remove test")).toBeTruthy();
  });

  it("calls onRemove when remove button pressed", () => {
    const onRemove = jest.fn();
    const { getByLabelText } = wrap(
      <Tag label="chip" removable onRemove={onRemove} />,
    );
    fireEvent.press(getByLabelText("Remove chip"));
    expect(onRemove).toHaveBeenCalledTimes(1);
  });

  it("does not call onRemove when disabled", () => {
    const onRemove = jest.fn();
    const { getByLabelText } = wrap(
      <Tag label="chip" removable onRemove={onRemove} disabled />,
    );
    fireEvent.press(getByLabelText("Remove chip"));
    expect(onRemove).not.toHaveBeenCalled();
  });

  it("calls onPress when provided", () => {
    const onPress = jest.fn();
    const { getByRole } = wrap(<Tag label="click me" onPress={onPress} />);
    fireEvent.press(getByRole("button"));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("does not call onPress when disabled", () => {
    const onPress = jest.fn();
    const { getByRole } = wrap(
      <Tag label="click me" onPress={onPress} disabled />,
    );
    fireEvent.press(getByRole("button"));
    expect(onPress).not.toHaveBeenCalled();
  });

  it.each(["neutral", "brand", "success", "warning", "danger", "info"] as const)(
    "renders tone=%s without crashing",
    (tone) => {
      const { getByText } = wrap(<Tag label={tone} tone={tone} />);
      expect(getByText(tone)).toBeTruthy();
    },
  );

  it.each(["soft", "outline", "solid"] as const)(
    "renders variant=%s without crashing",
    (variant) => {
      const { getByText } = wrap(
        <Tag label="label" tone="brand" variant={variant} />,
      );
      expect(getByText("label")).toBeTruthy();
    },
  );

  it("renders in dark theme", () => {
    const { getByText } = render(
      <ThemeProvider forcedTheme="dark">
        <Tag label="dark" tone="danger" />
      </ThemeProvider>,
    );
    expect(getByText("dark")).toBeTruthy();
  });
});
