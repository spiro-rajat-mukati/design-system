import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import { ThemeProvider } from "../../../ThemeContext";
import { BatteryCard } from "../BatteryCard";

function wrap(ui: React.ReactElement) {
  return render(<ThemeProvider>{ui}</ThemeProvider>);
}

describe("BatteryCard", () => {
  it("renders name + derived caption from context", () => {
    const { getByText } = wrap(
      <BatteryCard name="U7B1LBNL36300660" level={92} context="bike" />,
    );
    expect(getByText("U7B1LBNL36300660")).toBeTruthy();
    expect(getByText("Re-Map Battery to Bike")).toBeTruthy();
  });

  it("derives the station caption", () => {
    const { getByText } = wrap(<BatteryCard name="X" level={92} context="station" />);
    expect(getByText("Re-Map Battery to Station")).toBeTruthy();
  });

  it("overrides caption when provided", () => {
    const { getByText, queryByText } = wrap(
      <BatteryCard name="X" level={92} context="bike" caption="Custom subheading" />,
    );
    expect(getByText("Custom subheading")).toBeTruthy();
    expect(queryByText("Re-Map Battery to Bike")).toBeNull();
  });

  it("renders the battery level percent", () => {
    const { getByText } = wrap(<BatteryCard name="X" level={7} context="bike" />);
    expect(getByText("7%")).toBeTruthy();
  });

  it("shows the re-map link in the unknown state and fires onRemap", () => {
    const onRemap = jest.fn();
    const { getByText } = wrap(
      <BatteryCard name="X" level="unknown" context="bike" onRemap={onRemap} remapLabel="Re-map" />,
    );
    expect(getByText("SoC unknown")).toBeTruthy();
    fireEvent.press(getByText("Re-map"));
    expect(onRemap).toHaveBeenCalledTimes(1);
  });

  it("shows no percent when level is unknown", () => {
    const { queryByText } = wrap(<BatteryCard name="X" level="unknown" context="bike" />);
    expect(queryByText(/%$/)).toBeNull();
  });

  it("renders in dark theme", () => {
    const { getByText } = render(
      <ThemeProvider forcedTheme="dark">
        <BatteryCard name="Dark" level={50} context="bike" />
      </ThemeProvider>,
    );
    expect(getByText("Dark")).toBeTruthy();
  });
});
