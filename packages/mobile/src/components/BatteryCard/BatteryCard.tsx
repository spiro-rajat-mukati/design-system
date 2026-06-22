import React from "react";
import { View, Text, Pressable, StyleSheet, type TextStyle } from "react-native";
import { useTheme } from "../../ThemeContext";
import { px } from "../../utils/tokens";
import { Badge, type BadgeTone } from "../Badge";
import type { BatteryCardProps, BatteryCardStatus } from "./BatteryCard.types";

/**
 * BatteryCard — product pattern (built into @kijani/mobile for the generator
 * shakedown; its real home is the product's patterns dir). Battery image + serial
 * + a derived charge level, used across the bike and station remap flows.
 *
 * - `context` (flow-set) drives the Bike/Station indicator + the default caption.
 * - `status` tints the background pattern: default→grey, in-progress→info,
 *   warning→amber, error→red.
 * - `level` is continuous: a number derives the charge tone; "unknown" shows the
 *   SoC-unknown state with a re-map link (the card's only interactive element).
 * Styling here maps to the closest Kijani primitives/tokens, not the exact product art.
 */

const STATUS_SURFACE: Record<
  BatteryCardStatus,
  "sunken" | "info-subtle" | "warning-subtle" | "danger-subtle"
> = {
  default: "sunken",
  "in-progress": "info-subtle",
  warning: "warning-subtle",
  error: "danger-subtle",
};

function levelTone(pct: number): BadgeTone {
  if (pct <= 10) return "danger";
  if (pct <= 30) return "warning";
  return "success";
}

const clamp = (n: number) => Math.max(0, Math.min(100, n));

export function BatteryCard({
  name,
  level,
  context,
  caption,
  status = "default",
  illustration,
  onRemap,
  remapLabel = "Re-map battery",
  testID,
  style,
}: BatteryCardProps) {
  const { theme } = useTheme();
  const c = theme.color;
  const captionRole = theme.text.mobile["body-sm-regular"];
  const nameRole = theme.text.mobile["title-sm"];

  const resolvedCaption =
    caption ?? `Re-Map Battery to ${context === "bike" ? "Bike" : "Station"}`;

  return (
    <View
      testID={testID}
      style={[
        styles.card,
        {
          backgroundColor: c.surface.raised,
          borderColor: c.border.subtle,
          borderWidth: px(theme["border-width"]["1"]),
          borderRadius: px(theme.radius.lg),
          padding: px(theme.space["4"]),
          rowGap: px(theme.space["3"]),
        },
        style,
      ]}
    >
      <View
        style={[
          styles.imageArea,
          { backgroundColor: c.surface[STATUS_SURFACE[status]], borderRadius: px(theme.radius.md) },
        ]}
      >
        {illustration !== undefined ? (
          illustration
        ) : (
          <View
            accessible={false}
            importantForAccessibility="no-hide-descendants"
            style={[styles.placeholder, { borderColor: c.border.subtle }]}
          >
            <Text style={{ color: c.text.muted, fontSize: px(captionRole.size) }}>Battery</Text>
          </View>
        )}
        <View style={styles.indicator}>
          <Badge tone="neutral" variant="solid" size="sm">
            {context === "bike" ? "Bike" : "Station"}
          </Badge>
        </View>
      </View>

      <Text
        style={{
          color: c.text.secondary,
          fontSize: px(captionRole.size),
          lineHeight: px(captionRole.line),
          textAlign: "center",
        }}
      >
        {resolvedCaption}
      </Text>

      <Text
        style={{
          color: c.text.primary,
          fontSize: px(nameRole.size),
          lineHeight: px(nameRole.line),
          fontWeight: "600" as TextStyle["fontWeight"],
          textAlign: "center",
        }}
      >
        {name}
      </Text>

      <View style={styles.levelRow}>
        {level === "unknown" ? (
          <>
            <Text style={{ color: c.text.muted, fontSize: px(captionRole.size) }}>
              SoC unknown
            </Text>
            {onRemap != null && (
              <Pressable
                onPress={onRemap}
                accessibilityRole="button"
                accessibilityLabel={remapLabel}
                hitSlop={8}
              >
                <Text
                  style={{
                    color: c.text.link,
                    fontSize: px(captionRole.size),
                    fontWeight: "600" as TextStyle["fontWeight"],
                  }}
                >
                  {remapLabel}
                </Text>
              </Pressable>
            )}
          </>
        ) : (
          <Badge tone={levelTone(clamp(level))} variant="soft" size="sm">
            {`${Math.round(clamp(level))}%`}
          </Badge>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    alignSelf: "stretch",
    alignItems: "center",
  },
  imageArea: {
    alignSelf: "stretch",
    height: 150,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  placeholder: {
    width: 160,
    height: 100,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  indicator: {
    position: "absolute",
    top: 8,
    right: 8,
  },
  levelRow: {
    flexDirection: "row",
    alignItems: "center",
    columnGap: 8,
  },
});
