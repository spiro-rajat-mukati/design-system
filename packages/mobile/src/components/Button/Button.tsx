import React from "react";
import {
  ActivityIndicator,
  Pressable,
  Text,
  View,
  type TextStyle,
} from "react-native";
import { useTheme } from "../../ThemeContext";
import { px } from "../../utils/tokens";
import type { ButtonProps } from "./Button.types";

/** Minimum touch target per Apple HIG / Material guidance. */
const MIN_TOUCH = 44;

export function Button({
  variant = "primary",
  size = "md",
  leadingIcon,
  trailingIcon,
  iconOnly = false,
  fullWidth = false,
  loading = false,
  disabled = false,
  accessibilityLabel,
  children,
  onPress,
  testID,
}: ButtonProps) {
  const { theme } = useTheme();
  const t = theme.button;
  const v = t[variant];
  const isDisabled = disabled || loading;

  const minHeight = Math.max(px(t.height[size]), MIN_TOUCH);
  const paddingH = px(t["padding-inline"][size]);
  const fontSize = px(t["font-size"][size]);
  const iconGap = px(t["icon-gap"]);
  const radius = px(t.radius);
  const borderWidth = px(t["border-width"]);
  const disabledOpacity = px(t["disabled-opacity"]);

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityLabel={
        iconOnly ? accessibilityLabel : accessibilityLabel
      }
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      testID={testID}
      style={({ pressed }) => ({
        minHeight,
        paddingHorizontal: iconOnly ? paddingH / 2 : paddingH,
        paddingVertical: 0,
        borderRadius: radius,
        borderWidth,
        borderColor: isDisabled ? v["bg-disabled"] : v.border,
        backgroundColor: isDisabled
          ? v["bg-disabled"]
          : pressed
          ? v["bg-active"]
          : v.bg,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        alignSelf: fullWidth ? "stretch" : "flex-start",
        gap: iconGap,
        opacity: isDisabled ? disabledOpacity : 1,
        aspectRatio: iconOnly ? 1 : undefined,
      })}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={v.fg}
          accessibilityLabel="Loading"
        />
      ) : (
        <>
          {leadingIcon != null && (
            <View accessible={false} importantForAccessibility="no">
              {leadingIcon}
            </View>
          )}
          {!iconOnly && children != null && (
            <Text
              style={
                {
                  color: v.fg,
                  fontSize,
                  fontWeight: t["font-weight"] as TextStyle["fontWeight"],
                  includeFontPadding: false,
                } satisfies TextStyle
              }
              numberOfLines={1}
            >
              {children}
            </Text>
          )}
          {trailingIcon != null && !iconOnly && (
            <View accessible={false} importantForAccessibility="no">
              {trailingIcon}
            </View>
          )}
        </>
      )}
    </Pressable>
  );
}
