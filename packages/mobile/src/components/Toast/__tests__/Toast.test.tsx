import React from "react";
import { Text, Pressable } from "react-native";
import { render, fireEvent, waitFor, act } from "@testing-library/react-native";
import { ThemeProvider } from "../../../ThemeContext";
import { ToastProvider, useToast } from "../ToastContext";

function AllProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <ToastProvider>{children}</ToastProvider>
    </ThemeProvider>
  );
}

function ShowButton({ tone, title, message }: { tone?: string; title?: string; message: string }) {
  const { show } = useToast();
  return (
    <Pressable
      onPress={() => show({ message, tone: tone as any, title })}
      accessibilityLabel="show"
    >
      <Text>Show</Text>
    </Pressable>
  );
}

function DismissAllButton() {
  const { dismissAll } = useToast();
  return (
    <Pressable onPress={dismissAll} accessibilityLabel="dismiss-all">
      <Text>Dismiss All</Text>
    </Pressable>
  );
}

describe("Toast", () => {
  it("shows a toast message", async () => {
    const { getByLabelText, getByText } = render(
      <AllProviders>
        <ShowButton message="Hello toast" />
      </AllProviders>,
    );
    fireEvent.press(getByLabelText("show"));
    await waitFor(() => expect(getByText("Hello toast")).toBeTruthy());
  });

  it("shows toast with title", async () => {
    const { getByLabelText, getByText } = render(
      <AllProviders>
        <ShowButton message="Body text" title="My Title" />
      </AllProviders>,
    );
    fireEvent.press(getByLabelText("show"));
    await waitFor(() => {
      expect(getByText("My Title")).toBeTruthy();
      expect(getByText("Body text")).toBeTruthy();
    });
  });

  it("dismisses a toast when × is pressed", async () => {
    const { getByLabelText, queryByText } = render(
      <AllProviders>
        <ShowButton message="Dismiss me" />
      </AllProviders>,
    );
    fireEvent.press(getByLabelText("show"));
    await waitFor(() => getByLabelText("Dismiss notification"));
    fireEvent.press(getByLabelText("Dismiss notification"));
    await waitFor(() => expect(queryByText("Dismiss me")).toBeNull());
  });

  it("dismissAll removes all toasts", async () => {
    const { getByLabelText, queryByText } = render(
      <AllProviders>
        <ShowButton message="Toast 1" />
        <DismissAllButton />
      </AllProviders>,
    );
    fireEvent.press(getByLabelText("show"));
    await waitFor(() => getByLabelText("Dismiss notification"));
    fireEvent.press(getByLabelText("dismiss-all"));
    await waitFor(() => expect(queryByText("Toast 1")).toBeNull());
  });

  it.each(["neutral", "info", "success", "warning", "danger"] as const)(
    "renders tone=%s",
    async (tone) => {
      const { getByLabelText, getByText } = render(
        <AllProviders>
          <ShowButton message={`tone-${tone}`} tone={tone} />
        </AllProviders>,
      );
      fireEvent.press(getByLabelText("show"));
      await waitFor(() => expect(getByText(`tone-${tone}`)).toBeTruthy());
    },
  );

  it("throws if useToast is called outside ToastProvider", () => {
    const spy = jest.spyOn(console, "error").mockImplementation(() => {});
    function Bad() {
      useToast();
      return null;
    }
    expect(() =>
      render(
        <ThemeProvider>
          <Bad />
        </ThemeProvider>,
      ),
    ).toThrow("useToast must be used inside <ToastProvider>");
    spy.mockRestore();
  });
});
