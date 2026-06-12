import React, { useState } from "react";
import {
  Pressable,
  View,
  Text,
  StyleSheet,
  type TextStyle,
} from "react-native";
import { useTheme } from "../../ThemeContext";
import { useFieldContext } from "../Field/FieldContext";
import { px } from "../../utils/tokens";
import type { CheckboxProps } from "./Checkbox.types";

export function Checkbox({
  label,
  description,
  checked: controlledChecked,
  defaultChecked = false,
  indeterminate = false,
  onChange,
  disabled,
  accessibilityLabel,
  testID,
}: CheckboxProps) {
  const { theme } = useTheme();
  const field = useFieldContext();
  const t = theme.checkbox;

  const isDisabled = disabled ?? field?.disabled ?? false;

  const [internalChecked, setInternalChecked] = useState(defaultChecked);
  const isChecked =
    controlledChecked !== undefined ? controlledChecked : internalChecked;
  const isActive = isChecked || indeterminate;

  const size = px(t.size);
  const radius = px(t.radius);
  const labelGap = px(t["label-gap"]);

  const boxBg = isDisabled
    ? t["bg-disabled"]
    : isActive
    ? t["bg-checked"]
    : t.bg;
  const boxBorder = isDisabled
    ? t["border-disabled"]
    : isActive
    ? t["border-checked"]
    : t.border;

  function handlePress() {
    if (isDisabled) return;
    const next = !isChecked;
    if (controlledChecked === undefined) setInternalChecked(next);
    onChange?.(next);
  }

  const labelText: TextStyle = {
    color: isDisabled ? theme.color.text.disabled : t["label-color"],
    fontSize: px(theme["font-size"]["200"]),
    lineHeight: px(theme["font-size"]["200"]) * 1.25,
  };

  const descText: TextStyle = {
    color: isDisabled
      ? theme.color.text.disabled
      : theme.color.text.secondary,
    fontSize: px(theme["font-size"]["100"]),
    lineHeight: px(theme["font-size"]["100"]) * 1.5,
    marginTop: 2,
  };

  return (
    <Pressable
      onPress={handlePress}
      disabled={isDisabled}
      accessibilityRole="checkbox"
      accessibilityLabel={
        typeof accessibilityLabel === "string"
          ? accessibilityLabel
          : typeof label === "string"
          ? label
          : undefined
      }
      accessibilityState={{ checked: indeterminate ? "mixed" : isChecked, disabled: isDisabled }}
      testID={testID}
      style={[styles.row, { gap: labelGap }]}
    >
      <View
        accessible={false}
        style={[
          styles.box,
          {
            width: size,
            height: size,
            borderRadius: radius,
            backgroundColor: boxBg,
            borderColor: boxBorder,
          },
        ]}
      >
        {indeterminate ? (
          <View style={[styles.dash, { backgroundColor: t.mark }]} />
        ) : isChecked ? (
          <Text style={[styles.checkmark, { color: t.mark }]}>✓</Text>
        ) : null}
      </View>
      <View style={styles.labelBlock}>
        <Text style={labelText}>{label}</Text>
        {description != null && <Text style={descText}>{description}</Text>}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    alignSelf: "flex-start",
  },
  box: {
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
    flexShrink: 0,
    marginTop: 2,
  },
  dash: {
    width: 8,
    height: 2,
    borderRadius: 1,
  },
  checkmark: {
    fontSize: 10,
    lineHeight: 12,
    includeFontPadding: false,
  },
  labelBlock: {
    flex: 1,
  },
});
