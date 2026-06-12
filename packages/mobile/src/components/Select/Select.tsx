import React, { useState } from "react";
import {
  View,
  Text,
  Pressable,
  Modal,
  FlatList,
  StyleSheet,
  Platform,
  ActionSheetIOS,
} from "react-native";
import { useTheme } from "../../ThemeContext";
import { px } from "../../utils/tokens";
import { useFieldContext } from "../Field/FieldContext";
import type { SelectProps, SelectOption } from "./Select.types";

const HEIGHT: Record<"sm" | "md" | "lg", number> = { sm: 32, md: 40, lg: 48 };
const FONT: Record<"sm" | "md" | "lg", number> = { sm: 13, md: 14, lg: 15 };
const H_PAD: Record<"sm" | "md" | "lg", number> = { sm: 8, md: 12, lg: 16 };

export function Select({
  options,
  value: controlledValue,
  defaultValue,
  onChange,
  placeholder = "Select…",
  size = "md",
  disabled: propDisabled = false,
  accessibilityLabel,
  testID,
}: SelectProps) {
  const { theme } = useTheme();
  const field = useFieldContext();
  const disabled = propDisabled || field?.disabled === true;

  const isControlled = controlledValue !== undefined;
  const [internalValue, setInternalValue] = useState<string | undefined>(defaultValue);
  const selected = isControlled ? controlledValue : internalValue;

  const [modalVisible, setModalVisible] = useState(false);

  const s = theme.select;
  const inputT = theme.input;
  const isError = field?.status === "error";
  const height = HEIGHT[size];
  const fontSize = FONT[size];
  const hPad = H_PAD[size];
  const radius = px(s["trigger-radius"]);
  const borderColor = isError
    ? inputT["border-error"]
    : disabled
    ? inputT["border-disabled"]
    : s["trigger-border"];

  const selectedLabel =
    options.find((o) => o.value === selected)?.label ?? placeholder;
  const hasValue = selected != null;

  function pick(opt: SelectOption) {
    if (opt.disabled) return;
    if (!isControlled) setInternalValue(opt.value);
    onChange?.(opt.value);
    setModalVisible(false);
  }

  function openPicker() {
    if (disabled) return;

    if (Platform.OS === "ios") {
      const labels = options.map((o) => o.label);
      labels.push("Cancel");
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: labels,
          cancelButtonIndex: labels.length - 1,
          title: accessibilityLabel,
        },
        (idx) => {
          if (idx < options.length) {
            const opt = options[idx];
            if (!opt.disabled) pick(opt);
          }
        },
      );
    } else {
      setModalVisible(true);
    }
  }

  return (
    <>
      <Pressable
        testID={testID}
        onPress={openPicker}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel ?? selectedLabel}
        accessibilityState={{ disabled }}
        style={({ pressed }) => [
          styles.trigger,
          {
            height,
            borderRadius: radius,
            paddingHorizontal: hPad,
            backgroundColor: disabled ? inputT["bg-disabled"] : s["trigger-bg"],
            borderColor,
            opacity: disabled ? 0.65 : pressed ? 0.85 : 1,
          },
        ]}
      >
        <Text
          numberOfLines={1}
          style={{
            flex: 1,
            fontSize,
            color: hasValue ? s["trigger-fg"] : inputT["fg-placeholder"],
          }}
        >
          {selectedLabel}
        </Text>
        <Text style={{ color: theme.color.text.tertiary, fontSize: 12, marginLeft: 4 }}>
          ▾
        </Text>
      </Pressable>

      {/* Android modal picker */}
      {Platform.OS !== "ios" && (
        <Modal
          visible={modalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setModalVisible(false)}
        >
          <Pressable
            style={styles.overlay}
            onPress={() => setModalVisible(false)}
          >
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
              <FlatList
                data={options}
                keyExtractor={(o) => o.value}
                renderItem={({ item }) => (
                  <Pressable
                    onPress={() => pick(item)}
                    disabled={item.disabled}
                    style={({ pressed }) => [
                      styles.option,
                      {
                        paddingVertical: 12,
                        paddingHorizontal: 16,
                        backgroundColor:
                          item.value === selected
                            ? theme.dropdown["item-bg-active"]
                            : pressed
                            ? theme.dropdown["item-bg-hover"]
                            : "transparent",
                      },
                    ]}
                  >
                    <Text
                      style={{
                        fontSize: 14,
                        color: item.disabled
                          ? theme.dropdown["item-fg-disabled"]
                          : item.value === selected
                          ? theme.dropdown["item-fg-active"]
                          : theme.dropdown["item-fg"],
                      }}
                    >
                      {item.label}
                    </Text>
                  </Pressable>
                )}
              />
            </View>
          </Pressable>
        </Modal>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  trigger: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  sheet: {
    maxHeight: 320,
    borderWidth: 1,
    margin: 16,
    overflow: "hidden",
  },
  option: {},
});
