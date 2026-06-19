import React from "react";
import { Text } from "react-native";
import { render, fireEvent } from "@testing-library/react-native";
import { ThemeProvider } from "../../../ThemeContext";
import { ErrorState } from "../ErrorState";

function wrap(ui: React.ReactElement) {
  return render(<ThemeProvider>{ui}</ThemeProvider>);
}

describe("ErrorState", () => {
  it("renders title and description", () => {
    const { getByText } = wrap(
      <ErrorState title="Something went wrong" description="Please try again." />,
    );
    expect(getByText("Something went wrong")).toBeTruthy();
    expect(getByText("Please try again.")).toBeTruthy();
  });

  it("renders the title as an accessibility header", () => {
    const { getByRole } = wrap(<ErrorState title="Oops" />);
    expect(getByRole("header")).toBeTruthy();
  });

  it("calls primaryAction.onPress when the primary button is pressed", () => {
    const onPress = jest.fn();
    const { getByRole } = wrap(
      <ErrorState title="Oops" primaryAction={{ label: "Try Again", onPress }} />,
    );
    fireEvent.press(getByRole("button"));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("calls secondaryAction.onPress when the secondary button is pressed", () => {
    const onPress = jest.fn();
    const { getByRole } = wrap(
      <ErrorState title="Oops" secondaryAction={{ label: "Go Back", onPress }} />,
    );
    fireEvent.press(getByRole("button"));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("does not render a secondary action when not provided", () => {
    const { queryByText } = wrap(
      <ErrorState
        title="Oops"
        primaryAction={{ label: "Try Again", onPress: () => {} }}
      />,
    );
    expect(queryByText("Go Back")).toBeNull();
  });

  it("does not fire onPress while the primary action is loading", () => {
    const onPress = jest.fn();
    const { getByRole } = wrap(
      <ErrorState
        title="Oops"
        primaryAction={{ label: "Try Again", onPress, loading: true }}
      />,
    );
    fireEvent.press(getByRole("button"));
    expect(onPress).not.toHaveBeenCalled();
  });

  it("renders a custom illustration when provided", () => {
    const { getByTestId } = wrap(
      <ErrorState
        title="Oops"
        illustration={<Text testID="custom-art">satellite</Text>}
      />,
    );
    expect(getByTestId("custom-art")).toBeTruthy();
  });

  it("renders in dark theme", () => {
    const { getByText } = render(
      <ThemeProvider forcedTheme="dark">
        <ErrorState title="Dark error" description="In the dark." />
      </ThemeProvider>,
    );
    expect(getByText("Dark error")).toBeTruthy();
  });
});
