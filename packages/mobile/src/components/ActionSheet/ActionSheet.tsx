import React, { useEffect, useRef } from "react";
import {
  Animated,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  ActionSheetIOS,
} from "react-native";
import { useTheme } from "../../ThemeContext";
import { px } from "../../utils/tokens";
import type { ActionSheetProps } from "./ActionSheet.types";

function NativeActionSheet({
  visible,
  onClose,
  title,
  message,
  items,
  cancelLabel = "Cancel",
}: ActionSheetProps) {
  const triggered = useRef(false);

  useEffect(() => {
    if (!visible || triggered.current) return;
    triggered.current = true;

    const labels = items.map((i) => i.label);
    labels.push(cancelLabel);

    const destructiveIndexes = items
      .map((item, idx) => (item.destructive ? idx : -1))
      .filter((i) => i >= 0);

    ActionSheetIOS.showActionSheetWithOptions(
      {
        title,
        message,
        options: labels,
        cancelButtonIndex: labels.length - 1,
        destructiveButtonIndex: destructiveIndexes.length > 0 ? destructiveIndexes : undefined,
      },
      (idx) => {
        triggered.current = false;
        if (idx < items.length) {
          const item = items[idx];
          if (!item.disabled) {
            item.onPress();
          }
        }
        onClose();
      },
    );
  }, [visible]);

  return null;
}

function CrossPlatformActionSheet({
  visible,
  onClose,
  title,
  message,
  items,
  cancelLabel = "Cancel",
  testID,
}: ActionSheetProps) {
  const { theme } = useTheme();
  const d = theme.dropdown;
  const slideAnim = useRef(new Animated.Value(300)).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        bounciness: 0,
        speed: 20,
      }).start();
    } else {
      slideAnim.setValue(300);
    }
  }, [visible]);

  const sheetRadius = px(d.radius) * 2;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      testID={testID}
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Animated.View
          style={[
            styles.sheet,
            {
              backgroundColor: d.bg,
              borderTopLeftRadius: sheetRadius,
              borderTopRightRadius: sheetRadius,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          {(title || message) && (
            <View style={styles.header}>
              {title ? (
                <Text style={[styles.sheetTitle, { color: theme.color.text.secondary }]}>
                  {title}
                </Text>
              ) : null}
              {message ? (
                <Text style={[styles.sheetMessage, { color: theme.color.text.muted }]}>
                  {message}
                </Text>
              ) : null}
            </View>
          )}

          {items.map((item, idx) => (
            <Pressable
              key={idx}
              onPress={() => {
                if (!item.disabled) {
                  item.onPress();
                  onClose();
                }
              }}
              disabled={item.disabled}
              accessibilityRole="menuitem"
              accessibilityLabel={item.label}
              accessibilityState={{ disabled: item.disabled }}
              style={({ pressed }) => [
                styles.item,
                {
                  backgroundColor: pressed && !item.disabled
                    ? item.destructive
                      ? d["item-bg-destructive-hover"]
                      : d["item-bg-hover"]
                    : "transparent",
                },
              ]}
            >
              {item.icon ? (
                <View style={styles.itemIcon} accessible={false}>
                  {item.icon}
                </View>
              ) : null}
              <Text
                style={{
                  fontSize: 16,
                  color: item.disabled
                    ? d["item-fg-disabled"]
                    : item.destructive
                    ? d["item-fg-destructive"]
                    : d["item-fg"],
                }}
              >
                {item.label}
              </Text>
            </Pressable>
          ))}

          <View style={[styles.divider, { backgroundColor: d["divider-color"] }]} />

          <Pressable
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel={cancelLabel}
            style={({ pressed }) => [
              styles.item,
              styles.cancelItem,
              { backgroundColor: pressed ? d["item-bg-hover"] : "transparent" },
            ]}
          >
            <Text style={{ fontSize: 16, fontWeight: "600", color: d["item-fg"] }}>
              {cancelLabel}
            </Text>
          </Pressable>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

export function ActionSheet(props: ActionSheetProps) {
  if (Platform.OS === "ios") {
    return <NativeActionSheet {...props} />;
  }
  return <CrossPlatformActionSheet {...props} />;
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  sheet: {
    paddingBottom: 34,
    overflow: "hidden",
  },
  header: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.08)",
  },
  sheetTitle: {
    fontWeight: "600",
    fontSize: 13,
    marginBottom: 2,
  },
  sheetMessage: {
    fontSize: 12,
    textAlign: "center",
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 20,
    minHeight: 50,
  },
  cancelItem: {
    marginTop: 0,
    justifyContent: "center",
  },
  itemIcon: {
    marginRight: 12,
  },
  divider: {
    height: 1,
    marginVertical: 4,
  },
});
