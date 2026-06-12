import React, { useState } from "react";
import { View } from "react-native";
import { useTheme } from "../../ThemeContext";
import { px } from "../../utils/tokens";
import { Radio } from "./Radio";
import type { RadioGroupProps } from "./Radio.types";

export function RadioGroup({
  options,
  value: controlledValue,
  defaultValue,
  onChange,
  orientation = "vertical",
  disabled = false,
  accessibilityLabel,
  testID,
}: RadioGroupProps) {
  const { theme } = useTheme();
  const [internalValue, setInternalValue] = useState(defaultValue ?? "");
  const selected =
    controlledValue !== undefined ? controlledValue : internalValue;

  function handleChange(val: string) {
    if (controlledValue === undefined) setInternalValue(val);
    onChange?.(val);
  }

  const gap = px(theme.radio["group-gap"]);

  return (
    <View
      testID={testID}
      accessibilityLabel={accessibilityLabel}
      accessible={accessibilityLabel != null}
      accessibilityRole="radiogroup"
      style={{
        flexDirection: orientation === "horizontal" ? "row" : "column",
        flexWrap: orientation === "horizontal" ? "wrap" : undefined,
        gap,
      }}
    >
      {options.map((opt) => (
        <Radio
          key={opt.value}
          label={opt.label}
          description={opt.description}
          value={opt.value}
          checked={selected === opt.value}
          disabled={disabled || opt.disabled}
          onChange={handleChange}
        />
      ))}
    </View>
  );
}
