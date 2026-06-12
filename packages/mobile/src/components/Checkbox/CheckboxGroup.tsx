import React, { useState } from "react";
import { View } from "react-native";
import { useTheme } from "../../ThemeContext";
import { px } from "../../utils/tokens";
import { Checkbox } from "./Checkbox";
import type { CheckboxGroupProps } from "./Checkbox.types";

export function CheckboxGroup({
  options,
  value: controlledValue,
  defaultValue = [],
  onChange,
  orientation = "vertical",
  disabled = false,
  accessibilityLabel,
  testID,
}: CheckboxGroupProps) {
  const { theme } = useTheme();
  const [internalValue, setInternalValue] = useState<string[]>(defaultValue);
  const selected =
    controlledValue !== undefined ? controlledValue : internalValue;

  function handleChange(optValue: string, checked: boolean) {
    const next = checked
      ? [...selected, optValue]
      : selected.filter((v) => v !== optValue);
    if (controlledValue === undefined) setInternalValue(next);
    onChange?.(next);
  }

  const gap = px(theme.checkbox["group-gap"]);

  return (
    <View
      testID={testID}
      accessibilityLabel={accessibilityLabel}
      accessible={accessibilityLabel != null}
      style={{
        flexDirection: orientation === "horizontal" ? "row" : "column",
        flexWrap: orientation === "horizontal" ? "wrap" : undefined,
        gap,
      }}
    >
      {options.map((opt) => (
        <Checkbox
          key={opt.value}
          label={opt.label}
          description={opt.description}
          checked={selected.includes(opt.value)}
          disabled={disabled || opt.disabled}
          onChange={(checked) => handleChange(opt.value, checked)}
        />
      ))}
    </View>
  );
}
