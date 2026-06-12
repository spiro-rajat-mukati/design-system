import React, { useState, useCallback } from "react";
import {
  View,
  TextInput as RNTextInput,
  Pressable,
  Text,
  StyleSheet,
} from "react-native";
import { useTheme } from "../../ThemeContext";
import { px } from "../../utils/tokens";
import { useFieldContext } from "../Field/FieldContext";
import type { NumericInputProps } from "./NumericInput.types";

export function NumericInput({
  value: controlledValue,
  defaultValue = 0,
  onChange,
  min,
  max,
  step = 1,
  size = "md",
  disabled: propDisabled = false,
  placeholder,
  accessibilityLabel,
  testID,
}: NumericInputProps) {
  const { theme } = useTheme();
  const field = useFieldContext();
  const disabled = propDisabled || field?.disabled === true;

  const isControlled = controlledValue !== undefined;
  const [internalValue, setInternalValue] = useState<number>(defaultValue);
  const numValue = isControlled ? (controlledValue ?? defaultValue) : internalValue;

  const [isFocused, setIsFocused] = useState(false);
  const [rawText, setRawText] = useState<string | null>(null);

  const t = theme.input;
  const n = theme.numeric;
  const height = px(t.height[size]);
  const hPad = px(t["padding-inline"][size]);
  const stepperWidth = px(n["stepper-width"]);
  const radius = px(t.radius);
  const isError = field?.status === "error";

  const borderColor = isError
    ? t["border-error"]
    : isFocused
    ? t["border-focus"]
    : disabled
    ? t["border-disabled"]
    : t.border;

  function clamp(v: number): number {
    let result = v;
    if (min !== undefined) result = Math.max(min, result);
    if (max !== undefined) result = Math.min(max, result);
    return result;
  }

  function commit(v: number) {
    const next = clamp(v);
    if (!isControlled) setInternalValue(next);
    onChange?.(next);
    setRawText(null);
  }

  const decrement = useCallback(() => {
    if (disabled) return;
    commit(numValue - step);
  }, [disabled, numValue, step]);

  const increment = useCallback(() => {
    if (disabled) return;
    commit(numValue + step);
  }, [disabled, numValue, step]);

  const canDecrement = min === undefined || numValue > min;
  const canIncrement = max === undefined || numValue < max;

  function handleChangeText(text: string) {
    setRawText(text);
    const parsed = parseFloat(text);
    if (!Number.isNaN(parsed)) {
      if (!isControlled) setInternalValue(parsed);
      onChange?.(clamp(parsed));
    }
  }

  function handleBlur() {
    setIsFocused(false);
    if (rawText !== null) {
      const parsed = parseFloat(rawText);
      commit(Number.isNaN(parsed) ? numValue : parsed);
    }
  }

  const stepperStyle = {
    width: stepperWidth,
    height: height - 2,
    backgroundColor: n["stepper-bg"],
    alignItems: "center" as const,
    justifyContent: "center" as const,
  };

  const stepperTextStyle = {
    color: n["stepper-fg"],
    fontSize: 18,
    lineHeight: 22,
    fontWeight: "400" as const,
    userSelect: "none" as const,
  };

  return (
    <View
      testID={testID}
      style={[
        styles.container,
        {
          height,
          borderRadius: radius,
          borderColor,
          backgroundColor: disabled ? t["bg-disabled"] : t.bg,
          opacity: disabled ? 0.65 : 1,
        },
      ]}
      accessible={false}
    >
      <Pressable
        onPress={decrement}
        disabled={disabled || !canDecrement}
        accessibilityRole="button"
        accessibilityLabel="Decrease"
        style={({ pressed }) => [
          stepperStyle,
          { backgroundColor: pressed && canDecrement ? n["stepper-bg-hover"] : n["stepper-bg"] },
          styles.stepperLeft,
          { borderTopLeftRadius: radius, borderBottomLeftRadius: radius },
        ]}
      >
        <Text style={[stepperTextStyle, (!canDecrement || disabled) && styles.faded]}>−</Text>
      </Pressable>

      <RNTextInput
        value={rawText !== null ? rawText : String(numValue)}
        onChangeText={handleChangeText}
        onFocus={() => setIsFocused(true)}
        onBlur={handleBlur}
        editable={!disabled}
        keyboardType="numeric"
        selectTextOnFocus
        placeholder={placeholder}
        placeholderTextColor={t["fg-placeholder"]}
        accessibilityLabel={accessibilityLabel}
        accessibilityValue={{ min, max, now: numValue }}
        style={[
          styles.input,
          {
            color: disabled ? t["fg-disabled"] : t.fg,
            fontSize: px(t["font-size"]),
            paddingHorizontal: hPad / 2,
          },
        ]}
      />

      <Pressable
        onPress={increment}
        disabled={disabled || !canIncrement}
        accessibilityRole="button"
        accessibilityLabel="Increase"
        style={({ pressed }) => [
          stepperStyle,
          { backgroundColor: pressed && canIncrement ? n["stepper-bg-hover"] : n["stepper-bg"] },
          styles.stepperRight,
          { borderTopRightRadius: radius, borderBottomRightRadius: radius },
        ]}
      >
        <Text style={[stepperTextStyle, (!canIncrement || disabled) && styles.faded]}>+</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    overflow: "hidden",
  },
  stepperLeft: {
    borderRightWidth: 1,
    borderRightColor: "transparent",
  },
  stepperRight: {
    borderLeftWidth: 1,
    borderLeftColor: "transparent",
  },
  input: {
    flex: 1,
    textAlign: "center",
    includeFontPadding: false,
  },
  faded: {
    opacity: 0.35,
  },
});
