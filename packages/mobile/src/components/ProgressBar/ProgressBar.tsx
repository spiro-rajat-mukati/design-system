import React, { useEffect, useRef } from "react";
import { View, Text, Animated, StyleSheet } from "react-native";
import { useTheme } from "../../ThemeContext";
import { px } from "../../utils/tokens";
import type { ProgressBarProps, ProgressBarTone } from "./ProgressBar.types";

type Theme = ReturnType<typeof useTheme>["theme"];

function getFillColor(theme: Theme, tone: ProgressBarTone): string {
  const t = theme.progress;
  switch (tone) {
    case "success": return t["fill-success"];
    case "warning": return t["fill-warning"];
    case "danger": return t["fill-danger"];
    default: return t["fill-brand"];
  }
}

export function ProgressBar({
  value = 0,
  max = 100,
  tone = "brand",
  size = "md",
  label,
  showValue = false,
  indeterminate = false,
  accessibilityLabel,
  testID,
}: ProgressBarProps) {
  const { theme } = useTheme();
  const t = theme.progress;
  const fillColor = getFillColor(theme, tone);
  const trackHeight = px(t.height[size]);
  const radius = px(t.radius);
  const clampedPct = Math.min(100, Math.max(0, (value / max) * 100));

  // Indeterminate animation
  const slideAnim = useRef(new Animated.Value(-1)).current;
  useEffect(() => {
    if (!indeterminate) {
      slideAnim.setValue(-1);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(slideAnim, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: -1,
          duration: 0,
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [indeterminate, slideAnim]);

  const displayPct = indeterminate ? null : `${Math.round(clampedPct)}%`;
  const a11yLabel =
    accessibilityLabel ??
    (label ? `${label}: ${displayPct ?? "loading"}` : (displayPct ?? "loading"));

  return (
    <View testID={testID} style={styles.wrapper}>
      {(label || showValue) && (
        <View style={styles.labelRow}>
          {label ? (
            <Text style={[styles.label, { color: t["label-color"], fontSize: px(t["label-size"]) }]}>
              {label}
            </Text>
          ) : null}
          {showValue && !indeterminate ? (
            <Text style={[styles.valueText, { color: t["label-color"], fontSize: px(t["label-size"]) }]}>
              {displayPct}
            </Text>
          ) : null}
        </View>
      )}
      <View
        accessible
        accessibilityRole="progressbar"
        accessibilityLabel={a11yLabel}
        accessibilityValue={{ min: 0, max, now: indeterminate ? undefined : value }}
        style={[
          styles.track,
          {
            height: trackHeight,
            borderRadius: radius,
            backgroundColor: t["track-bg"],
          },
        ]}
      >
        {indeterminate ? (
          <Animated.View
            style={[
              styles.fill,
              {
                width: "40%",
                height: trackHeight,
                borderRadius: radius,
                backgroundColor: fillColor,
                transform: [
                  {
                    translateX: slideAnim.interpolate({
                      inputRange: [-1, 1],
                      outputRange: ["-100%", "250%"],
                    }),
                  },
                ],
              },
            ]}
          />
        ) : (
          <View
            style={[
              styles.fill,
              {
                width: `${clampedPct}%`,
                height: trackHeight,
                borderRadius: radius,
                backgroundColor: fillColor,
              },
            ]}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: "100%",
  },
  labelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  label: {
    fontWeight: "500",
  },
  valueText: {},
  track: {
    width: "100%",
    overflow: "hidden",
  },
  fill: {},
});
