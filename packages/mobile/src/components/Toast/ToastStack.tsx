import React, { useEffect, useRef } from "react";
import { Animated, Pressable, Text, View, StyleSheet } from "react-native";
import { useTheme } from "../../ThemeContext";
import { px } from "../../utils/tokens";
import type { ToastItem, ToastTone } from "./Toast.types";

type Theme = ReturnType<typeof useTheme>["theme"];

function getAccentColor(theme: Theme, tone: ToastTone): string {
  const t = theme.toast;
  switch (tone) {
    case "info": return t["info-accent"];
    case "success": return t["success-accent"];
    case "warning": return t["warning-accent"];
    case "danger": return t["danger-accent"];
    default: return t["neutral-accent"];
  }
}

function ToastCard({
  item,
  onDismiss,
}: {
  item: ToastItem;
  onDismiss: (id: string) => void;
}) {
  const { theme } = useTheme();
  const t = theme.toast;
  const slideAnim = useRef(new Animated.Value(-80)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  const tone = item.tone ?? "neutral";
  const accentColor = getAccentColor(theme, tone);

  useEffect(() => {
    Animated.parallel([
      Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, bounciness: 4 }),
      Animated.timing(opacityAnim, { toValue: 1, duration: 180, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={[
        styles.card,
        {
          backgroundColor: t.bg,
          borderRadius: px(t.radius),
          borderColor: t.border,
          marginBottom: px(t["stack-gap"]),
          transform: [{ translateY: slideAnim }],
          opacity: opacityAnim,
        },
      ]}
      accessibilityLiveRegion="polite"
      accessibilityRole="alert"
    >
      <View style={[styles.accent, { backgroundColor: accentColor }]} />
      <View style={styles.body}>
        {item.title ? (
          <Text style={[styles.title, { color: t.fg }]} numberOfLines={1}>
            {item.title}
          </Text>
        ) : null}
        <Text style={[styles.message, { color: t.fg }]}>{item.message}</Text>
      </View>
      <Pressable
        onPress={() => onDismiss(item.id)}
        accessibilityRole="button"
        accessibilityLabel="Dismiss notification"
        hitSlop={8}
        style={styles.closeBtn}
      >
        <Text style={{ color: theme.color.text.tertiary, fontSize: 18, lineHeight: 20 }}>
          ×
        </Text>
      </Pressable>
    </Animated.View>
  );
}

export function ToastStack({
  toasts,
  onDismiss,
}: {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
}) {
  const { theme } = useTheme();

  if (toasts.length === 0) return null;

  return (
    <View
      style={[styles.stack, { bottom: px(theme.toast["stack-gap"]) + 16 }]}
      pointerEvents="box-none"
    >
      {toasts.map((toast) => (
        <ToastCard key={toast.id} item={toast} onDismiss={onDismiss} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  stack: {
    position: "absolute",
    left: 16,
    right: 16,
    zIndex: 1400,
    pointerEvents: "box-none",
  } as any,
  card: {
    flexDirection: "row",
    alignItems: "stretch",
    borderWidth: 1,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  accent: {
    width: 4,
  },
  body: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 12,
    gap: 2,
  },
  title: {
    fontWeight: "600",
    fontSize: 14,
  },
  message: {
    fontSize: 14,
    lineHeight: 20,
  },
  closeBtn: {
    paddingHorizontal: 12,
    justifyContent: "center",
  },
});
