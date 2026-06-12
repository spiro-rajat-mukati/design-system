import React, { useState } from "react";
import {
  TextInput,
  View,
  Text,
  StyleSheet,
  type TextStyle,
  type ViewStyle,
} from "react-native";
import { useTheme } from "../../ThemeContext";
import { useFieldContext } from "../Field/FieldContext";
import { px } from "../../utils/tokens";
import type { TextareaProps } from "./Textarea.types";

const LINE_HEIGHT_MULTIPLIER = 1.5;

export function Textarea({
  rows = 3,
  maxRows,
  showCount = false,
  invalid,
  disabled,
  testID,
  value,
  onChangeText,
  placeholder,
  maxLength,
  ...rest
}: TextareaProps) {
  const { theme } = useTheme();
  const field = useFieldContext();
  const t = theme.input;

  const isDisabled = disabled ?? field?.disabled ?? false;
  const isInvalid = invalid !== undefined ? invalid : field?.status === "error";

  const [focused, setFocused] = useState(false);
  const [contentHeight, setContentHeight] = useState<number | null>(null);

  const fontSize = px(t["font-size"]);
  const lineHeight = fontSize * LINE_HEIGHT_MULTIPLIER;
  const paddingV = px(theme.textarea["padding-block"]);
  const paddingH = px(t["padding-inline"].md);
  const radius = px(t.radius);
  const borderWidth = px(t["border-width"]);
  const minHeight = px(theme.textarea["min-height"]);

  const borderColor = isDisabled
    ? t["border-disabled"]
    : isInvalid
    ? t["border-error"]
    : focused
    ? t["border-focus"]
    : t.border;

  const fixedHeight =
    rows !== "auto" ? lineHeight * rows + paddingV * 2 : undefined;
  const maxHeight =
    rows === "auto" && maxRows != null
      ? lineHeight * maxRows + paddingV * 2
      : undefined;
  const autoHeight =
    rows === "auto" && contentHeight != null ? contentHeight : undefined;

  const containerStyle: ViewStyle = {
    borderRadius: radius,
    borderWidth,
    borderColor,
    backgroundColor: isDisabled ? t["bg-disabled"] : t.bg,
    overflow: "hidden",
    opacity: isDisabled ? 0.6 : 1,
  };

  const inputStyle: TextStyle = {
    color: isDisabled ? t["fg-disabled"] : t.fg,
    fontSize,
    lineHeight,
    paddingHorizontal: paddingH,
    paddingVertical: paddingV,
    textAlignVertical: "top",
    minHeight,
    height: rows !== "auto" ? fixedHeight : autoHeight,
    maxHeight,
    includeFontPadding: false,
    padding: 0,
  };

  const displayCount = showCount || maxLength != null;
  const charCount = typeof value === "string" ? value.length : 0;

  return (
    <View testID={testID}>
      <View style={containerStyle}>
        <TextInput
          {...rest}
          multiline
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={t["fg-placeholder"]}
          maxLength={maxLength}
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
          onContentSizeChange={
            rows === "auto"
              ? (e) => setContentHeight(e.nativeEvent.contentSize.height)
              : undefined
          }
          aria-invalid={isInvalid}
        />
      </View>
      {displayCount && (
        <Text style={[styles.counter, { color: t["icon-color"] }]}>
          {maxLength != null ? `${charCount} / ${maxLength}` : String(charCount)}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  counter: {
    fontSize: 12,
    textAlign: "right",
    marginTop: 4,
  },
});
