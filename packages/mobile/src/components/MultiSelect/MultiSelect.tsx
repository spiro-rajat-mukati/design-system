import React, { useState } from "react";
import {
  View,
  Text,
  Pressable,
  Modal,
  FlatList,
  StyleSheet,
} from "react-native";
import { useTheme } from "../../ThemeContext";
import { px } from "../../utils/tokens";
import { useFieldContext } from "../Field/FieldContext";
import type { MultiSelectProps, MultiSelectOption } from "./MultiSelect.types";

const HEIGHT: Record<"sm" | "md" | "lg", number> = { sm: 32, md: 40, lg: 48 };
const FONT: Record<"sm" | "md" | "lg", number> = { sm: 13, md: 14, lg: 15 };
const H_PAD: Record<"sm" | "md" | "lg", number> = { sm: 8, md: 12, lg: 16 };
const CHIP_H: Record<"sm" | "md" | "lg", number> = { sm: 20, md: 22, lg: 24 };
const CHIP_FONT: Record<"sm" | "md" | "lg", number> = { sm: 11, md: 12, lg: 13 };

export function MultiSelect({
  options,
  value: controlledValue,
  defaultValue = [],
  onChange,
  placeholder = "Select…",
  size = "md",
  disabled: propDisabled = false,
  maxSelections,
  accessibilityLabel,
  testID,
}: MultiSelectProps) {
  const { theme } = useTheme();
  const field = useFieldContext();
  const disabled = propDisabled || field?.disabled === true;

  const isControlled = controlledValue !== undefined;
  const [internalValue, setInternalValue] = useState<string[]>(defaultValue);
  const selected = isControlled ? (controlledValue ?? []) : internalValue;

  const [modalVisible, setModalVisible] = useState(false);

  const s = theme.select;
  const inputT = theme.input;
  const isError = field?.status === "error";
  const height = HEIGHT[size];
  const fontSize = FONT[size];
  const hPad = H_PAD[size];
  const chipH = CHIP_H[size];
  const chipFont = CHIP_FONT[size];
  const radius = px(s["trigger-radius"]);
  const chipRadius = px(s["chip-radius"]);

  const borderColor = isError
    ? inputT["border-error"]
    : disabled
    ? inputT["border-disabled"]
    : s["trigger-border"];

  function toggle(opt: MultiSelectOption) {
    if (opt.disabled || disabled) return;
    const isSelected = selected.includes(opt.value);
    let next: string[];
    if (isSelected) {
      next = selected.filter((v) => v !== opt.value);
    } else {
      if (maxSelections != null && selected.length >= maxSelections) return;
      next = [...selected, opt.value];
    }
    if (!isControlled) setInternalValue(next);
    onChange?.(next);
  }

  function removeChip(val: string) {
    const next = selected.filter((v) => v !== val);
    if (!isControlled) setInternalValue(next);
    onChange?.(next);
  }

  const selectedOptions = options.filter((o) => selected.includes(o.value));
  const hasValue = selectedOptions.length > 0;

  const minH = Math.max(height, hasValue ? chipH + 16 : height);

  return (
    <>
      <Pressable
        testID={testID}
        onPress={disabled ? undefined : () => setModalVisible(true)}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel ?? (hasValue ? selectedOptions.map((o) => o.label).join(", ") : placeholder)}
        accessibilityState={{ disabled }}
        style={[
          styles.trigger,
          {
            minHeight: minH,
            borderRadius: radius,
            paddingHorizontal: hPad,
            paddingVertical: hasValue ? 6 : 0,
            backgroundColor: disabled ? inputT["bg-disabled"] : s["trigger-bg"],
            borderColor,
            opacity: disabled ? 0.65 : 1,
          },
        ]}
      >
        {hasValue ? (
          <View style={styles.chips}>
            {selectedOptions.map((opt) => (
              <View
                key={opt.value}
                style={[
                  styles.chip,
                  {
                    height: chipH,
                    borderRadius: chipRadius,
                    backgroundColor: s["chip-bg"],
                    paddingHorizontal: 8,
                  },
                ]}
              >
                <Text style={{ color: s["chip-fg"], fontSize: chipFont }} numberOfLines={1}>
                  {opt.label}
                </Text>
                <Pressable
                  onPress={() => removeChip(opt.value)}
                  hitSlop={6}
                  accessibilityLabel={`Remove ${opt.label}`}
                  accessibilityRole="button"
                >
                  <Text style={{ color: s["chip-fg"], fontSize: chipFont + 2, marginLeft: 4, lineHeight: chipH }}>
                    ×
                  </Text>
                </Pressable>
              </View>
            ))}
          </View>
        ) : (
          <Text
            numberOfLines={1}
            style={{ flex: 1, fontSize, color: inputT["fg-placeholder"], lineHeight: height }}
          >
            {placeholder}
          </Text>
        )}
        <Text style={{ color: theme.color.text.tertiary, fontSize: 12, marginLeft: 4, alignSelf: "center" }}>
          ▾
        </Text>
      </Pressable>

      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <Pressable style={styles.overlay} onPress={() => setModalVisible(false)}>
          <View
            style={[
              styles.sheet,
              {
                backgroundColor: theme.dropdown.bg,
                borderColor: theme.dropdown.border,
                borderRadius: px(theme.dropdown.radius),
              },
            ]}
          >
            {maxSelections != null && (
              <View style={styles.limitRow}>
                <Text style={{ color: theme.color.text.muted, fontSize: 12 }}>
                  {selected.length} / {maxSelections} selected
                </Text>
              </View>
            )}
            <FlatList
              data={options}
              keyExtractor={(o) => o.value}
              renderItem={({ item }) => {
                const isSelected = selected.includes(item.value);
                const atMax =
                  maxSelections != null &&
                  !isSelected &&
                  selected.length >= maxSelections;
                const isDisabled = item.disabled || atMax;

                return (
                  <Pressable
                    onPress={() => toggle(item)}
                    disabled={isDisabled}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: isSelected, disabled: isDisabled }}
                    accessibilityLabel={item.label}
                    style={({ pressed }) => [
                      styles.option,
                      {
                        backgroundColor:
                          isSelected
                            ? theme.dropdown["item-bg-active"]
                            : pressed && !isDisabled
                            ? theme.dropdown["item-bg-hover"]
                            : "transparent",
                        opacity: isDisabled ? 0.45 : 1,
                      },
                    ]}
                  >
                    <Text style={{ fontSize: 14, marginRight: 8, color: theme.color.text.primary }}>
                      {isSelected ? "☑" : "☐"}
                    </Text>
                    <Text
                      style={{
                        flex: 1,
                        fontSize: 14,
                        color: isDisabled
                          ? theme.dropdown["item-fg-disabled"]
                          : theme.dropdown["item-fg"],
                      }}
                    >
                      {item.label}
                    </Text>
                  </Pressable>
                );
              }}
            />
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  trigger: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    flexWrap: "wrap",
  },
  chips: {
    flex: 1,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  sheet: {
    maxHeight: 360,
    borderWidth: 1,
    margin: 16,
    overflow: "hidden",
  },
  limitRow: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.06)",
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
});
