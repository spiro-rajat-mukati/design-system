import React, { useState } from "react";
import {
  TextInput as RNTextInput,
  View,
  Text,
  Pressable,
  StyleSheet,
  type TextStyle,
  type ViewStyle,
} from "react-native";
import { useTheme } from "../../ThemeContext";
import { useFieldContext } from "../Field/FieldContext";
import { px } from "../../utils/tokens";
import type { TextInputProps } from "./TextInput.types";

export function TextInput({
  size = "md",
  leadingIcon,
  trailingIcon,
  prefix,
  suffix,
  clearable = false,
  onClear,
  invalid,
  disabled,
  testID,
  value,
  onChangeText,
  placeholder,
  ...rest
}: TextInputProps) {
  const { theme } = useTheme();
  const field = useFieldContext();
  const t = theme.input;

  const isDisabled = disabled ?? field?.disabled ?? false;
  const isInvalid = invalid !== undefined ? invalid : field?.status === "error";

  const [focused, setFocused] = useState(false);

  const height = px(t.height[size]);
  const paddingH = px(t["padding-inline"][size]);
  const fontSize = px(t["font-size"]);
  const radius = px(t.radius);
  const borderWidth = px(t["border-width"]);

  const borderColor = isDisabled
    ? t["border-disabled"]
    : isInvalid
    ? t["border-error"]
    : focused
    ? t["border-focus"]
    : t.border;

  const bgColor = isDisabled ? t["bg-disabled"] : t.bg;

  const containerStyle: ViewStyle = {
    flexDirection: "row",
    alignItems: "center",
    height,
    paddingHorizontal: paddingH,
    borderRadius: radius,
    borderWidth,
    borderColor,
    backgroundColor: bgColor,
    gap: px(t["icon-gap"]),
    opacity: isDisabled ? 0.6 : 1,
  };

  const inputStyle: TextStyle = {
    flex: 1,
    color: isDisabled ? t["fg-disabled"] : t.fg,
    fontSize,
    includeFontPadding: false,
    padding: 0,
  };

  const adornStyle: TextStyle = {
    color: t["icon-color"],
    fontSize,
    includeFontPadding: false,
  };

  const showClear = clearable && !isDisabled && value != null && value !== "";

  return (
    <View
      style={containerStyle}
      accessibilityState={{ disabled: isDisabled }}
      testID={testID}
    >
      {leadingIcon != null && (
        <View accessible={false} importantForAccessibility="no">
          {leadingIcon}
        </View>
      )}
      {prefix != null && <Text style={adornStyle}>{prefix}</Text>}

      <RNTextInput
        {...rest}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={t["fg-placeholder"]}
        editable={!isDisabled}
        style={inputStyle}
        onFocus={(e) => {
          setFocused(true);
          rest.onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          rest.onBlur?.(e);
        }}
        aria-invalid={isInvalid}
      />

      {suffix != null && <Text style={adornStyle}>{suffix}</Text>}
      {showClear && (
        <Pressable
          onPress={onClear}
          accessibilityRole="button"
          accessibilityLabel="Clear"
          hitSlop={8}
          style={styles.clearBtn}
        >
          <Text style={[adornStyle, styles.clearText]}>×</Text>
        </Pressable>
      )}
      {trailingIcon != null && !showClear && (
        <View accessible={false} importantForAccessibility="no">
          {trailingIcon}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  clearBtn: {
    justifyContent: "center",
    alignItems: "center",
  },
  clearText: {
    fontSize: 18,
    lineHeight: 18,
  },
});
