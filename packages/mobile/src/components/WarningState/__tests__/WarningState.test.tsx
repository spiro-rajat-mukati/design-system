import React from "react";
import { Text } from "react-native";
import { render, fireEvent } from "@testing-library/react-native";
import { ThemeProvider } from "../../../ThemeContext";
import { WarningState } from "../WarningState";

function wrap(ui: React.ReactElement) {
  return render(<ThemeProvider>{ui}</ThemeProvider>);
}

describe("WarningState", () => {
  it("renders title and description", () => {
    const { getByText } = wrap(
      <WarningState title="Heads up" description="Read this carefully." />,
    );
    expect(getByText("Heads up")).toBeTruthy();
    expect(getByText("Read this carefully.")).toBeTruthy();
  });

  it("renders the title as an accessibility header", () => {
    const { getByRole } = wrap(<WarningState title="Heads up" />);
    expect(getByRole("header")).toBeTruthy();
  });

  it("renders the steps list with its default title when steps are provided", () => {
    const { getByText } = wrap(
      <WarningState title="Heads up" steps={["First do this", "Then do that"]} />,
    );
    expect(getByText("What to do next?")).toBeTruthy();
    expect(getByText("First do this")).toBeTruthy();
    expect(getByText("Then do that")).toBeTruthy();
  });

  it("does not render a steps section when steps are omitted", () => {
    const { queryByText } = wrap(<WarningState title="Heads up" />);
    expect(queryByText("What to do next?")).toBeNull();
  });

  it("honours a custom steps title", () => {
    const { getByText } = wrap(
      <WarningState title="Heads up" stepsTitle="Next steps" steps={["Do it"]} />,
    );
    expect(getByText("Next steps")).toBeTruthy();
  });

  it("calls primaryAction.onPress when the primary button is pressed", () => {
    const onPress = jest.fn();
    const { getByRole } = wrap(
      <WarningState title="Heads up" primaryAction={{ label: "Go Back", onPress }} />,
    );
    fireEvent.press(getByRole("button"));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("calls secondaryAction.onPress when the secondary button is pressed", () => {
    const onPress = jest.fn();
    const { getByRole } = wrap(
      <WarningState title="Heads up" secondaryAction={{ label: "Continue", onPress }} />,
    );
    fireEvent.press(getByRole("button"));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("does not fire onPress while the primary action is loading", () => {
    const onPress = jest.fn();
    const { getByRole } = wrap(
      <WarningState
        title="Heads up"
        primaryAction={{ label: "Go Back", onPress, loading: true }}
      />,
    );
    fireEvent.press(getByRole("button"));
    expect(onPress).not.toHaveBeenCalled();
  });

  it("renders a custom illustration when provided", () => {
    const { getByTestId } = wrap(
      <WarningState title="Heads up" illustration={<Text testID="art">!</Text>} />,
    );
    expect(getByTestId("art")).toBeTruthy();
  });

  it("renders in dark theme", () => {
    const { getByText } = render(
      <ThemeProvider forcedTheme="dark">
        <WarningState title="Dark warning" description="In the dark." />
      </ThemeProvider>,
    );
    expect(getByText("Dark warning")).toBeTruthy();
  });
});
