import React, { useState } from "react";
import { View, Text, Pressable, ScrollView, StyleSheet } from "react-native";
import { useTheme } from "../../ThemeContext";
import { px } from "../../utils/tokens";
import type { TabsProps, TabsVariant } from "./Tabs.types";

const V_PAD: Record<"sm" | "md" | "lg", number> = { sm: 8, md: 12, lg: 12 };
const H_PAD: Record<"sm" | "md" | "lg", number> = { sm: 12, md: 16, lg: 20 };
const FONT: Record<"sm" | "md" | "lg", number> = { sm: 12, md: 14, lg: 16 };

export function Tabs({
  items,
  value: controlledValue,
  defaultValue,
  onChange,
  variant = "underline",
  size = "md",
  disabled: allDisabled = false,
  testID,
  accessibilityLabel,
}: TabsProps) {
  const { theme } = useTheme();
  const t = theme.tabs;

  const isControlled = controlledValue !== undefined;
  const [internalValue, setInternalValue] = useState<string>(
    defaultValue ?? items[0]?.value ?? "",
  );
  const selected = isControlled ? (controlledValue ?? "") : internalValue;

  function select(val: string) {
    if (!isControlled) setInternalValue(val);
    onChange?.(val);
  }

  const vPad = V_PAD[size];
  const hPad = H_PAD[size];
  const fontSize = FONT[size];
  const radius = px(t["trigger-radius"]);

  function renderTab(item: (typeof items)[number]) {
    const isActive = selected === item.value;
    const isDisabled = allDisabled || item.disabled;

    const fg = isActive
      ? t["trigger-fg-active"]
      : isDisabled
      ? t["trigger-fg-disabled"]
      : t["trigger-fg"];

    const pillBg = isActive ? t["pill-bg-active"] : "transparent";
    const pillFg = isActive ? t["pill-fg-active"] : fg;

    return (
      <Pressable
        key={item.value}
        onPress={isDisabled ? undefined : () => select(item.value)}
        disabled={isDisabled}
        accessibilityRole="tab"
        accessibilityState={{ selected: isActive, disabled: isDisabled }}
        accessibilityLabel={item.label}
        style={({ pressed }) => [
          styles.trigger,
          {
            paddingVertical: vPad,
            paddingHorizontal: hPad,
            borderRadius: variant === "pill" ? radius : 0,
            backgroundColor:
              variant === "pill"
                ? pressed && !isDisabled && !isActive
                  ? theme.tag["bg-hover-tint"]
                  : pillBg
                : "transparent",
          },
        ]}
      >
        <Text
          numberOfLines={1}
          style={{
            color: variant === "pill" ? pillFg : fg,
            fontSize,
            fontWeight: isActive ? "600" : "400",
            includeFontPadding: false,
          }}
        >
          {item.label}
        </Text>
        {variant === "underline" && isActive && (
          <View
            style={[
              styles.underline,
              { backgroundColor: t["underline-color"] },
            ]}
          />
        )}
      </Pressable>
    );
  }

  return (
    <View testID={testID} style={styles.wrapper}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        accessibilityRole="tablist"
        accessibilityLabel={accessibilityLabel}
        contentContainerStyle={[
          styles.list,
          variant === "underline" && {
            borderBottomWidth: 1,
            borderBottomColor: theme.color.border.subtle,
          },
        ]}
      >
        {items.map(renderTab)}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {},
  list: {
    flexDirection: "row",
    alignItems: "stretch",
  },
  trigger: {
    alignItems: "center",
    justifyContent: "flex-end",
    position: "relative",
  },
  underline: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 2,
    borderTopLeftRadius: 2,
    borderTopRightRadius: 2,
  },
});
