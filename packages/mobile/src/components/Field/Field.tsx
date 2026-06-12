import React, { useMemo, useId } from "react";
import { View, Text, StyleSheet, type TextStyle } from "react-native";
import { useTheme } from "../../ThemeContext";
import { px } from "../../utils/tokens";
import { FieldContext } from "./FieldContext";
import type { FieldProps, FieldStatus } from "./Field.types";

export function Field({
  label,
  description,
  helperText,
  errorText,
  successText,
  required = false,
  disabled = false,
  children,
  testID,
}: FieldProps) {
  const { theme } = useTheme();
  const t = theme.field;
  const controlId = useId();

  const status: FieldStatus = errorText ? "error" : successText ? "success" : "default";

  const ctx = useMemo(
    () => ({ controlId, required, disabled, status }),
    [controlId, required, disabled, status],
  );

  const labelStyle: TextStyle = {
    color: disabled ? theme.color.text.disabled : t.label.color,
    fontSize: px(t.label.size),
    fontWeight: t.label.weight as TextStyle["fontWeight"],
    lineHeight: px(t.label.size) * parseFloat(t.label.line),
  };

  const requiredStyle: TextStyle = { color: t.required.color };

  const descStyle: TextStyle = {
    color: disabled ? theme.color.text.disabled : t.helper.color,
    fontSize: px(t.helper.size),
    lineHeight: px(t.helper.size) * parseFloat(t.helper.line),
  };

  const footerText =
    status === "error"
      ? errorText
      : status === "success"
      ? successText
      : helperText;

  const footerColor =
    status === "error"
      ? t.error.color
      : status === "success"
      ? t.success.color
      : t.helper.color;

  const footerStyle: TextStyle = {
    color: disabled ? theme.color.text.disabled : footerColor,
    fontSize: px(t.helper.size),
    lineHeight: px(t.helper.size) * parseFloat(t.helper.line),
  };

  return (
    <FieldContext.Provider value={ctx}>
      <View testID={testID} style={styles.container}>
        <View style={[styles.labelRow, { marginBottom: px(t.label.gap) }]}>
          <Text style={labelStyle}>
            {label}
            {required && <Text style={requiredStyle}> *</Text>}
          </Text>
          {description != null && (
            <Text style={descStyle}>{description}</Text>
          )}
        </View>
        {children}
        {footerText != null && (
          <View style={{ marginTop: px(t["stack-gap"]) }}>
            <Text style={footerStyle}>{footerText}</Text>
          </View>
        )}
      </View>
    </FieldContext.Provider>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "column",
  },
  labelRow: {
    flexDirection: "column",
  },
});
