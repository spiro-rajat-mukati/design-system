import React from "react";
import { render, screen } from "@testing-library/react-native";
import { ThemeProvider } from "../../../ThemeContext";
import { Badge } from "../Badge";

function wrap(ui: React.ReactElement) {
  return render(<ThemeProvider>{ui}</ThemeProvider>);
}

describe("Badge", () => {
  it("renders its label", () => {
    wrap(<Badge>New</Badge>);
    expect(screen.getByText("New")).toBeTruthy();
  });

  it("renders a count", () => {
    wrap(<Badge count={5} />);
    expect(screen.getByText("5")).toBeTruthy();
  });

  it("caps count at 99+", () => {
    wrap(<Badge count={150} />);
    expect(screen.getByText("99+")).toBeTruthy();
  });

  it("renders dot variant without text", () => {
    wrap(
      <Badge variant="dot" tone="danger" accessibilityLabel="Unread" />,
    );
    expect(screen.getByLabelText("Unread")).toBeTruthy();
  });

  it.each(["soft", "solid", "outline", "dot"] as const)(
    "renders variant=%s without crashing",
    (variant) => {
      wrap(
        <Badge variant={variant} accessibilityLabel="badge">
          Label
        </Badge>,
      );
      expect(screen.getByLabelText("badge")).toBeTruthy();
    },
  );

  it.each(["neutral", "brand", "success", "warning", "danger", "info"] as const)(
    "renders tone=%s without crashing",
    (tone) => {
      wrap(<Badge tone={tone}>Label</Badge>);
      expect(screen.getByText("Label")).toBeTruthy();
    },
  );

  it("renders in dark theme without crashing", () => {
    render(
      <ThemeProvider forcedTheme="dark">
        <Badge tone="brand" variant="solid">
          Dark
        </Badge>
      </ThemeProvider>,
    );
    expect(screen.getByText("Dark")).toBeTruthy();
  });
});
