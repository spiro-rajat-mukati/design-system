import React from "react";
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
import type { RadioProps } from "./Radio.types";

export function Radio({
  label,
  description,
  checked = false,
  value,
  onChange,
  disabled,
  accessibilityLabel,
  testID,
}: RadioProps) {
  const { theme } = useTheme();
  const field = useFieldContext();
  const t = theme.radio;

  const isDisabled = disabled ?? field?.disabled ?? false;

  const size = px(t.size);
  const labelGap = px(t["label-gap"]);

  const ringBg = isDisabled ? t["bg-disabled"] : t.bg;
  const ringBorder = isDisabled
    ? t["border-disabled"]
    : checked
    ? t["border-checked"]
    : t.border;
  const dotBg = isDisabled ? t["border-disabled"] : t.dot;

  function handlePress() {
    if (isDisabled || !value) return;
    onChange?.(value);
  }

  const labelTextStyle: TextStyle = {
    color: isDisabled ? theme.color.text.disabled : t["label-color"],
    fontSize: px(theme["font-size"]["200"]),
    lineHeight: px(theme["font-size"]["200"]) * 1.25,
  };

  const descTextStyle: TextStyle = {
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
      accessibilityRole="radio"
      accessibilityLabel={
        typeof accessibilityLabel === "string"
          ? accessibilityLabel
          : typeof label === "string"
          ? label
          : undefined
      }
      accessibilityState={{ checked, disabled: isDisabled }}
      testID={testID}
      style={[styles.row, { gap: labelGap }]}
    >
      <View
        accessible={false}
        style={[
          styles.ring,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: ringBg,
            borderColor: ringBorder,
          },
        ]}
      >
        {checked && (
          <View
            style={[
              styles.dot,
              {
                width: size * 0.5,
                height: size * 0.5,
                borderRadius: size * 0.25,
                backgroundColor: isDisabled ? dotBg : t["bg-checked"],
              },
            ]}
          />
        )}
      </View>
      <View style={styles.labelBlock}>
        <Text style={labelTextStyle}>{label}</Text>
        {description != null && <Text style={descTextStyle}>{description}</Text>}
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
  ring: {
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
    flexShrink: 0,
    marginTop: 2,
  },
  dot: {},
  labelBlock: {
    flex: 1,
  },
});
