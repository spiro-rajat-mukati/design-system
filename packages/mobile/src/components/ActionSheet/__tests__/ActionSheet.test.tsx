import React, { useState } from "react";
import { Platform, Pressable, Text } from "react-native";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import { ThemeProvider } from "../../../ThemeContext";
import { ActionSheet } from "../ActionSheet";

// Force cross-platform modal path in tests (jest reports Platform.OS as "ios")
beforeAll(() => {
  (Platform as any).OS = "android";
});
afterAll(() => {
  (Platform as any).OS = "ios";
});

const items = [
  { label: "Edit", onPress: jest.fn() },
  { label: "Share", onPress: jest.fn() },
  { label: "Delete", onPress: jest.fn(), destructive: true },
  { label: "Locked", onPress: jest.fn(), disabled: true },
];

function Harness() {
  const [visible, setVisible] = useState(false);
  return (
    <ThemeProvider>
      <Pressable onPress={() => setVisible(true)} accessibilityLabel="open">
        <Text>Open</Text>
      </Pressable>
      <ActionSheet
        visible={visible}
        onClose={() => setVisible(false)}
        title="Options"
        items={items}
        testID="sheet"
      />
    </ThemeProvider>
  );
}

describe("ActionSheet (cross-platform modal)", () => {
  beforeEach(() => jest.clearAllMocks());

  it("renders items when visible", async () => {
    const { getByLabelText, getByText } = render(<Harness />);
    fireEvent.press(getByLabelText("open"));
    await waitFor(() => {
      expect(getByText("Edit")).toBeTruthy();
      expect(getByText("Share")).toBeTruthy();
      expect(getByText("Delete")).toBeTruthy();
    });
  });

  it("calls onPress and closes when item is tapped", async () => {
    const { getByLabelText } = render(<Harness />);
    fireEvent.press(getByLabelText("open"));
    await waitFor(() => getByLabelText("Edit"));
    fireEvent.press(getByLabelText("Edit"));
    expect(items[0].onPress).toHaveBeenCalledTimes(1);
  });

  it("does not call onPress for disabled item", async () => {
    const { getByLabelText } = render(<Harness />);
    fireEvent.press(getByLabelText("open"));
    await waitFor(() => getByLabelText("Locked"));
    fireEvent.press(getByLabelText("Locked"));
    expect(items[3].onPress).not.toHaveBeenCalled();
  });

  it("closes when Cancel is pressed", async () => {
    const { getByLabelText, queryByText } = render(<Harness />);
    fireEvent.press(getByLabelText("open"));
    await waitFor(() => getByLabelText("Cancel"));
    fireEvent.press(getByLabelText("Cancel"));
    await waitFor(() => expect(queryByText("Edit")).toBeNull());
  });

  it("renders title", async () => {
    const { getByLabelText, getByText } = render(<Harness />);
    fireEvent.press(getByLabelText("open"));
    await waitFor(() => expect(getByText("Options")).toBeTruthy());
  });

  it("renders in dark theme", async () => {
    const onClose = jest.fn();
    const { getByText } = render(
      <ThemeProvider forcedTheme="dark">
        <ActionSheet
          visible
          onClose={onClose}
          items={[{ label: "Dark action", onPress: jest.fn() }]}
        />
      </ThemeProvider>,
    );
    await waitFor(() => expect(getByText("Dark action")).toBeTruthy());
  });
});
