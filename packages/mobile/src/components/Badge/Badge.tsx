import React from "react";
import { View, Text, StyleSheet, type TextStyle } from "react-native";
import { useTheme } from "../../ThemeContext";
import { px } from "../../utils/tokens";
import type { BadgeProps, BadgeTone, BadgeVariant } from "./Badge.types";

type Colors = { bg: string; fg: string; border: string };

function getColors(
  theme: ReturnType<typeof useTheme>["theme"],
  variant: BadgeVariant,
  tone: BadgeTone,
): Colors {
  const { color } = theme;
  const fb = color.feedback;

  // Per-tone soft palette (light bg, colored text).
  const soft: Record<BadgeTone, Colors> = {
    neutral: {
      bg: color.neutral["100"],
      fg: color.text.secondary,
      border: color.border.subtle,
    },
    brand: {
      bg: color.brand["100"],
      fg: color.brand["800"],
      border: color.brand["200"],
    },
    success: { bg: fb.success.bg, fg: fb.success.fg, border: fb.success.border },
    warning: { bg: fb.warning.bg, fg: fb.warning.fg, border: fb.warning.border },
    danger: { bg: fb.danger.bg, fg: fb.danger.fg, border: fb.danger.border },
    info: { bg: fb.info.bg, fg: fb.info.fg, border: fb.info.border },
  };

  // Per-tone solid palette (filled bg, white text).
  const solid: Record<BadgeTone, Colors> = {
    neutral: {
      bg: color.neutral["600"],
      fg: color.white,
      border: color.neutral["600"],
    },
    brand: {
      bg: color.action.primary.bg,
      fg: color.action.primary.fg,
      border: color.action.primary.bg,
    },
    success: {
      bg: color.success["600"],
      fg: color.white,
      border: color.success["600"],
    },
    warning: {
      bg: color.warning["600"],
      fg: color.white,
      border: color.warning["600"],
    },
    danger: {
      bg: color.danger["600"],
      fg: color.white,
      border: color.danger["600"],
    },
    info: {
      bg: color.info["600"],
      fg: color.white,
      border: color.info["600"],
    },
  };

  if (variant === "solid" || variant === "dot") return solid[tone];
  if (variant === "outline") {
    const s = solid[tone];
    return { bg: color.transparent, fg: s.fg === color.white ? s.border : s.fg, border: s.border };
  }
  return soft[tone];
}

export function Badge({
  variant = "soft",
  tone = "neutral",
  size = "sm",
  leadingIcon,
  count,
  withDot = false,
  children,
  testID,
  accessibilityLabel,
}: BadgeProps) {
  const { theme } = useTheme();
  const t = theme.badge;
  const { bg, fg, border } = getColors(theme, variant, tone);

  if (variant === "dot") {
    const dotSize = px(t.height[size]);
    return (
      <View
        testID={testID}
        accessibilityLabel={accessibilityLabel}
        accessible={accessibilityLabel != null}
        style={[
          styles.dot,
          {
            width: dotSize,
            height: dotSize,
            borderRadius: dotSize / 2,
            backgroundColor: bg,
          },
        ]}
      />
    );
  }

  const height = px(t.height[size]);
  const paddingH = px(t["padding-inline"][size]);
  const fontSize = px(t["font-size"][size]);
  const iconGap = px(t["icon-gap"]);
  const display =
    count != null ? (count > 99 ? "99+" : String(count)) : children;

  return (
    <View
      testID={testID}
      accessibilityLabel={accessibilityLabel}
      accessible={accessibilityLabel != null}
      style={[
        styles.base,
        {
          minHeight: height,
          paddingHorizontal: paddingH,
          borderRadius: px(t.radius),
          backgroundColor: bg,
          borderColor: border,
          gap: iconGap,
        },
      ]}
    >
      {withDot && (
        <View
          accessible={false}
          style={[styles.innerDot, { backgroundColor: fg }]}
        />
      )}
      {leadingIcon != null && (
        <View accessible={false} importantForAccessibility="no">
          {leadingIcon}
        </View>
      )}
      {display != null && (
        <Text
          style={
            {
              color: fg,
              fontSize,
              fontWeight: t["font-weight"] as TextStyle["fontWeight"],
              includeFontPadding: false,
            } satisfies TextStyle
          }
          numberOfLines={1}
        >
          {display}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    borderWidth: 1,
  },
  dot: {
    alignSelf: "flex-start",
  },
  innerDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
});
