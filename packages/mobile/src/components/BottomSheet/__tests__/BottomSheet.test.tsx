import React from "react";
import { render, fireEvent, act, configure } from "@testing-library/react-native";
import { ThemeProvider } from "../../../ThemeContext";
import { BottomSheet } from "../BottomSheet";

jest.useFakeTimers();

// accessibilityViewIsModal on the sheet panel hides sibling elements from RNTL's
// a11y-aware queries; include hidden elements so backdrop/pressable are findable.
configure({ defaultIncludeHiddenElements: true });

function wrap(ui: React.ReactElement) {
  return render(<ThemeProvider>{ui}</ThemeProvider>);
}

const baseProps = {
  visible: true,
  onClose: jest.fn(),
  children: null as React.ReactNode,
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe("BottomSheet", () => {
  it("renders children when visible", () => {
    const { getByText } = wrap(
      <BottomSheet {...baseProps}>
        <React.Fragment>
          <React.Fragment>{/* @ts-ignore */}</React.Fragment>
        </React.Fragment>
        {React.createElement("Text", {}, "Sheet content")}
      </BottomSheet>,
    );
    expect(getByText("Sheet content")).toBeTruthy();
  });

  it("renders title when provided", () => {
    const { getByText } = wrap(
      <BottomSheet {...baseProps} title="My Sheet">
        {null}
      </BottomSheet>,
    );
    expect(getByText("My Sheet")).toBeTruthy();
  });

  it("renders drag handle by default", () => {
    const { getByTestId } = wrap(
      <BottomSheet {...baseProps} testID="bs">
        {null}
      </BottomSheet>,
    );
    expect(getByTestId("bs-handle")).toBeTruthy();
  });

  it("hides handle when showHandle=false", () => {
    const { queryByTestId } = wrap(
      <BottomSheet {...baseProps} showHandle={false} testID="bs">
        {null}
      </BottomSheet>,
    );
    expect(queryByTestId("bs-handle")).toBeNull();
  });

  it("calls onClose when backdrop pressed", () => {
    const onClose = jest.fn();
    const { getByLabelText } = wrap(
      <BottomSheet {...baseProps} onClose={onClose} testID="bs">
        {null}
      </BottomSheet>,
    );
    fireEvent.press(getByLabelText("Close sheet"));
    act(() => { jest.runAllTimers(); });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("does not render close pressable when closeOnBackdrop=false", () => {
    const { queryByLabelText } = wrap(
      <BottomSheet {...baseProps} closeOnBackdrop={false} testID="bs">
        {null}
      </BottomSheet>,
    );
    expect(queryByLabelText("Close sheet")).toBeNull();
  });

  it("does not render when visible=false", () => {
    const { queryByTestId } = wrap(
      <BottomSheet {...baseProps} visible={false} testID="bs">
        {null}
      </BottomSheet>,
    );
    expect(queryByTestId("bs")).toBeNull();
  });

  it("renders backdrop element", () => {
    const { getByTestId } = wrap(
      <BottomSheet {...baseProps} testID="bs">
        {null}
      </BottomSheet>,
    );
    expect(getByTestId("bs-backdrop")).toBeTruthy();
  });

  it("renders in dark theme", () => {
    const { getByTestId } = render(
      <ThemeProvider forcedTheme="dark">
        <BottomSheet {...baseProps} testID="bs">
          {null}
        </BottomSheet>
      </ThemeProvider>,
    );
    expect(getByTestId("bs")).toBeTruthy();
  });

  it("renders with custom snapPoints", () => {
    const { getByTestId } = wrap(
      <BottomSheet {...baseProps} snapPoints={["30%", "60%", "90%"]} testID="bs">
        {null}
      </BottomSheet>,
    );
    expect(getByTestId("bs")).toBeTruthy();
  });

  it("renders handle area with testID", () => {
    const { getByTestId } = wrap(
      <BottomSheet {...baseProps} testID="bs">
        {null}
      </BottomSheet>,
    );
    expect(getByTestId("bs-handle-area")).toBeTruthy();
  });
});
