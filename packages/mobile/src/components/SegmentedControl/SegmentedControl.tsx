import React, { useState } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { useTheme } from "../../ThemeContext";
import { px } from "../../utils/tokens";
import type { SegmentedControlProps } from "./SegmentedControl.types";

const HEIGHT: Record<"sm" | "md" | "lg", number> = { sm: 28, md: 32, lg: 36 };
const FONT_SIZE: Record<"sm" | "md" | "lg", number> = { sm: 12, md: 13, lg: 14 };

export function SegmentedControl({
  options,
  value: controlledValue,
  defaultValue,
  onChange,
  size = "md",
  disabled: allDisabled = false,
  testID,
  accessibilityLabel,
}: SegmentedControlProps) {
  const { theme } = useTheme();
  const t = theme.tabs;

  const isControlled = controlledValue !== undefined;
  const [internalValue, setInternalValue] = useState<string>(
    defaultValue ?? options[0]?.value ?? "",
  );
  const selected = isControlled ? (controlledValue ?? "") : internalValue;

  function select(val: string) {
    if (!isControlled) setInternalValue(val);
    onChange?.(val);
  }

  const trackHeight = HEIGHT[size];
  const fontSize = FONT_SIZE[size];
  const trackRadius = px(t["list-radius"]);
  const segmentRadius = px(t["trigger-radius"]) - 1;

  return (
    <View
      testID={testID}
      accessibilityRole="tablist"
      accessibilityLabel={accessibilityLabel}
      style={[
        styles.track,
        {
          height: trackHeight + 4,
          borderRadius: trackRadius,
          backgroundColor: t["list-bg-segmented"],
          gap: px(t.gap),
          padding: 2,
          opacity: allDisabled ? 0.55 : 1,
        },
      ]}
    >
      {options.map((opt) => {
        const isActive = selected === opt.value;
        const isDisabled = allDisabled || opt.disabled;
        const fg = isActive
          ? t["trigger-fg-active"]
          : isDisabled
          ? t["trigger-fg-disabled"]
          : t["trigger-fg"];

        return (
          <Pressable
            key={opt.value}
            onPress={isDisabled ? undefined : () => select(opt.value)}
            disabled={isDisabled}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive, disabled: isDisabled }}
            accessibilityLabel={opt.label}
            style={({ pressed }) => [
              styles.segment,
              {
                flex: 1,
                height: trackHeight,
                borderRadius: segmentRadius,
                backgroundColor: isActive
                  ? t["segmented-bg-active"]
                  : pressed && !isDisabled
                  ? theme.tag["bg-hover-tint"]
                  : "transparent",
              },
              isActive && styles.activeShadow,
            ]}
          >
            <Text
              style={{
                color: fg,
                fontSize,
                fontWeight: isActive ? "600" : "400",
                includeFontPadding: false,
              }}
              numberOfLines={1}
            >
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: "row",
    alignItems: "center",
  },
  segment: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
  },
  activeShadow: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
});
