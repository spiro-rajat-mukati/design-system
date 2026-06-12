import React from "react";
import { Pressable, Text, View, StyleSheet } from "react-native";
import { useTheme } from "../../ThemeContext";
import { px } from "../../utils/tokens";
import type { TagProps, TagTone, TagVariant } from "./Tag.types";

type Theme = ReturnType<typeof useTheme>["theme"];
type Colors = { bg: string; fg: string; border: string };

function getColors(theme: Theme, tone: TagTone, variant: TagVariant): Colors {
  const { color } = theme;
  const fb = color.feedback;

  const soft: Record<TagTone, Colors> = {
    neutral: { bg: color.neutral["100"], fg: color.text.secondary, border: color.border.subtle },
    brand: { bg: color.brand["100"], fg: color.brand["800"], border: color.brand["200"] },
    success: { bg: fb.success.bg, fg: fb.success.fg, border: fb.success.border },
    warning: { bg: fb.warning.bg, fg: fb.warning.fg, border: fb.warning.border },
    danger: { bg: fb.danger.bg, fg: fb.danger.fg, border: fb.danger.border },
    info: { bg: fb.info.bg, fg: fb.info.fg, border: fb.info.border },
  };

  const solid: Record<TagTone, Colors> = {
    neutral: { bg: color.neutral["600"], fg: color.white, border: color.neutral["600"] },
    brand: { bg: color.action.primary.bg, fg: color.action.primary.fg, border: color.action.primary.bg },
    success: { bg: color.success["600"], fg: color.white, border: color.success["600"] },
    warning: { bg: color.warning["600"], fg: color.white, border: color.warning["600"] },
    danger: { bg: color.danger["600"], fg: color.white, border: color.danger["600"] },
    info: { bg: color.info["600"], fg: color.white, border: color.info["600"] },
  };

  if (variant === "solid") return solid[tone];
  if (variant === "outline") {
    const s = solid[tone];
    return { bg: color.transparent, fg: s.fg === color.white ? s.border : s.fg, border: s.border };
  }
  return soft[tone];
}

const HEIGHT: Record<"sm" | "md", number> = { sm: 22, md: 26 };
const FONT_SIZE: Record<"sm" | "md", number> = { sm: 11, md: 12 };
const H_PAD: Record<"sm" | "md", number> = { sm: 8, md: 10 };

export function Tag({
  label,
  tone = "neutral",
  variant = "soft",
  size = "md",
  removable = false,
  onRemove,
  onPress,
  disabled = false,
  accessibilityLabel,
}: TagProps) {
  const { theme } = useTheme();
  const colors = getColors(theme, tone, variant);
  const radius = px(theme.tag.radius);
  const height = HEIGHT[size];
  const fontSize = FONT_SIZE[size];
  const hPad = H_PAD[size];

  const inner = (
    <View
      style={[
        styles.inner,
        {
          height,
          borderRadius: radius,
          backgroundColor: colors.bg,
          borderWidth: variant === "outline" ? 1 : 0,
          borderColor: colors.border,
          paddingHorizontal: hPad,
          opacity: disabled ? 0.45 : 1,
        },
      ]}
    >
      <Text
        style={{ color: colors.fg, fontSize, fontWeight: "500", lineHeight: height }}
        numberOfLines={1}
      >
        {label}
      </Text>
      {removable && (
        <Pressable
          onPress={disabled ? undefined : onRemove}
          accessibilityRole="button"
          accessibilityLabel={`Remove ${label}`}
          disabled={disabled}
          hitSlop={8}
          style={({ pressed }) => [
            styles.removeBtn,
            {
              width: height - 4,
              height: height - 4,
              borderRadius: (height - 4) / 2,
              backgroundColor: pressed && !disabled ? theme.tag["remove-hover-bg"] : "transparent",
            },
          ]}
        >
          <Text style={{ color: colors.fg, fontSize: fontSize + 2, lineHeight: height - 4, textAlign: "center" }}>
            ×
          </Text>
        </Pressable>
      )}
    </View>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={disabled ? undefined : onPress}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel ?? label}
        accessibilityState={{ disabled }}
        style={({ pressed }) => pressed && !disabled ? { opacity: 0.75 } : {}}
      >
        {inner}
      </Pressable>
    );
  }

  return inner;
}

const styles = StyleSheet.create({
  inner: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
  },
  removeBtn: {
    marginLeft: 2,
    alignItems: "center",
    justifyContent: "center",
  },
});
