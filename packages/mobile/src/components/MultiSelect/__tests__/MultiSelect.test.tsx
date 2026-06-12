import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import { ThemeProvider } from "../../../ThemeContext";
import { MultiSelect } from "../MultiSelect";

const opts = [
  { value: "a", label: "Apple" },
  { value: "b", label: "Banana" },
  { value: "c", label: "Cherry" },
  { value: "d", label: "Durian", disabled: true },
];

function wrap(ui: React.ReactElement) {
  return render(<ThemeProvider>{ui}</ThemeProvider>);
}

describe("MultiSelect", () => {
  it("renders placeholder when nothing selected", () => {
    const { getByText } = wrap(<MultiSelect options={opts} placeholder="Pick fruits" />);
    expect(getByText("Pick fruits")).toBeTruthy();
  });

  it("renders chips for defaultValue", () => {
    const { getByText } = wrap(
      <MultiSelect options={opts} defaultValue={["a", "b"]} />,
    );
    expect(getByText("Apple")).toBeTruthy();
    expect(getByText("Banana")).toBeTruthy();
  });

  it("opens modal and shows options when pressed", async () => {
    const { getByTestId, getByLabelText } = wrap(
      <MultiSelect options={opts} testID="ms" />,
    );
    fireEvent.press(getByTestId("ms"));
    await waitFor(() => expect(getByLabelText("Apple")).toBeTruthy());
  });

  it("calls onChange when option is toggled", async () => {
    const onChange = jest.fn();
    const { getByTestId, getByLabelText } = wrap(
      <MultiSelect options={opts} onChange={onChange} testID="ms" />,
    );
    fireEvent.press(getByTestId("ms"));
    await waitFor(() => getByLabelText("Apple"));
    fireEvent.press(getByLabelText("Apple"));
    expect(onChange).toHaveBeenCalledWith(["a"]);
  });

  it("removes value on second toggle (deselect)", async () => {
    const onChange = jest.fn();
    const { getByTestId, getAllByLabelText } = wrap(
      <MultiSelect options={opts} defaultValue={["a"]} onChange={onChange} testID="ms" />,
    );
    fireEvent.press(getByTestId("ms"));
    // trigger + modal checkbox both have label "Apple"; modal item is last
    await waitFor(() => getAllByLabelText("Apple").length > 1);
    const items = getAllByLabelText("Apple");
    fireEvent.press(items[items.length - 1]);
    expect(onChange).toHaveBeenCalledWith([]);
  });

  it("does not toggle disabled option", async () => {
    const onChange = jest.fn();
    const { getByTestId, getByLabelText } = wrap(
      <MultiSelect options={opts} onChange={onChange} testID="ms" />,
    );
    fireEvent.press(getByTestId("ms"));
    await waitFor(() => getByLabelText("Durian"));
    fireEvent.press(getByLabelText("Durian"));
    expect(onChange).not.toHaveBeenCalled();
  });

  it("respects maxSelections", async () => {
    const onChange = jest.fn();
    const { getByTestId, getByLabelText } = wrap(
      <MultiSelect options={opts} defaultValue={["a"]} maxSelections={1} onChange={onChange} testID="ms" />,
    );
    fireEvent.press(getByTestId("ms"));
    await waitFor(() => getByLabelText("Banana"));
    fireEvent.press(getByLabelText("Banana"));
    expect(onChange).not.toHaveBeenCalled();
  });

  it("removes chip via × button", () => {
    const onChange = jest.fn();
    const { getByLabelText } = wrap(
      <MultiSelect options={opts} defaultValue={["a"]} onChange={onChange} />,
    );
    fireEvent.press(getByLabelText("Remove Apple"));
    expect(onChange).toHaveBeenCalledWith([]);
  });

  it("does not open when disabled", () => {
    const { getByTestId, queryByLabelText } = wrap(
      <MultiSelect options={opts} disabled testID="ms" />,
    );
    fireEvent.press(getByTestId("ms"));
    expect(queryByLabelText("Apple")).toBeNull();
  });

  it("renders in dark theme", () => {
    const { getByTestId } = render(
      <ThemeProvider forcedTheme="dark">
        <MultiSelect options={opts} testID="ms-dark" />
      </ThemeProvider>,
    );
    expect(getByTestId("ms-dark")).toBeTruthy();
  });
});
