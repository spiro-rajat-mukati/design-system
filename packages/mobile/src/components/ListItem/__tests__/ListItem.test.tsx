import React from "react";
import { Text } from "react-native";
import { render, fireEvent } from "@testing-library/react-native";
import { ThemeProvider } from "../../../ThemeContext";
import { ListItem } from "../ListItem";

function wrap(ui: React.ReactElement) {
  return render(<ThemeProvider>{ui}</ThemeProvider>);
}

describe("ListItem", () => {
  it("renders title", () => {
    const { getByText } = wrap(<ListItem title="Settings" />);
    expect(getByText("Settings")).toBeTruthy();
  });

  it("renders description", () => {
    const { getByText } = wrap(
      <ListItem title="Profile" description="Edit your name and photo" />,
    );
    expect(getByText("Edit your name and photo")).toBeTruthy();
  });

  it("renders leading content", () => {
    const { getByTestId } = wrap(
      <ListItem title="Icon row" leadingContent={<Text testID="icon">★</Text>} />,
    );
    expect(getByTestId("icon")).toBeTruthy();
  });

  it("renders trailing content", () => {
    const { getByText } = wrap(
      <ListItem title="With badge" trailingContent={<Text>›</Text>} />,
    );
    expect(getByText("›")).toBeTruthy();
  });

  it("calls onPress when pressed", () => {
    const onPress = jest.fn();
    const { getByRole } = wrap(
      <ListItem title="Pressable" onPress={onPress} />,
    );
    fireEvent.press(getByRole("button"));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("calls onLongPress when long-pressed", () => {
    const onLongPress = jest.fn();
    const { getByRole } = wrap(
      <ListItem title="Long press" onPress={() => {}} onLongPress={onLongPress} />,
    );
    fireEvent(getByRole("button"), "longPress");
    expect(onLongPress).toHaveBeenCalledTimes(1);
  });

  it("does not call onPress when disabled", () => {
    const onPress = jest.fn();
    const { getByRole } = wrap(
      <ListItem title="Disabled" onPress={onPress} disabled />,
    );
    fireEvent.press(getByRole("button"));
    expect(onPress).not.toHaveBeenCalled();
  });

  it("renders without onPress as a plain View (no button role)", () => {
    const { queryByRole } = wrap(<ListItem title="Static" />);
    expect(queryByRole("button")).toBeNull();
  });

  it("renders divider when showDivider=true", () => {
    const { getByTestId } = wrap(
      <ListItem title="Divided" showDivider testID="item" />,
    );
    expect(getByTestId("item")).toBeTruthy();
  });

  it("respects accessibilityLabel override", () => {
    const { getByLabelText } = wrap(
      <ListItem title="Profile" accessibilityLabel="Open profile settings" onPress={() => {}} />,
    );
    expect(getByLabelText("Open profile settings")).toBeTruthy();
  });

  it("renders variant=inset", () => {
    const { getByText } = wrap(
      <ListItem
        title="Inset divider"
        showDivider
        variant="inset"
        leadingContent={<Text>●</Text>}
      />,
    );
    expect(getByText("Inset divider")).toBeTruthy();
  });

  it("renders in dark theme", () => {
    const { getByText } = render(
      <ThemeProvider forcedTheme="dark">
        <ListItem title="Dark item" />
      </ThemeProvider>,
    );
    expect(getByText("Dark item")).toBeTruthy();
  });
});
