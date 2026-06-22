import React from "react";
import { View, Text, StyleSheet, type TextStyle } from "react-native";
import { useTheme } from "../../ThemeContext";
import { px } from "../../utils/tokens";
import { Button } from "../Button";
import type { WarningStateProps } from "./WarningState.types";

/**
 * WarningState — generic warning content organism for `@kijani/mobile`.
 *
 * CONTENT ONLY: illustration + headline + body + optional "what to do next"
 * steps + actions. It carries NO sheet chrome — compose it inside
 * `<BottomSheet>` (or full-screen / inline). The Figma source (node 178:369)
 * bakes in the sheet surface, a floating close button, and a top gradient;
 * those are the container's job (BottomSheet has `showCloseButton`).
 *
 * Sibling of ErrorState — same skeleton, warning tone (body in
 * `color/text/warning`) plus an optional numbered steps list. Actions render
 * secondary-on-top, consistent with ErrorState. Behaviour is caller-owned.
 */
export function WarningState({
  title,
  description,
  steps,
  stepsTitle = "What to do next?",
  illustration,
  primaryAction,
  secondaryAction,
  accessibilityLabel,
  testID,
  style,
}: WarningStateProps) {
  const { theme } = useTheme();
  const c = theme.color;
  const titleRole = theme.text.mobile["title-sm"];
  const bodyRole = theme.text.mobile["body-md-regular"];
  const subheadRole = theme.text.mobile["subhead-md"];
  const microRole = theme.text.mobile["micro"];

  const visual =
    illustration === undefined ? <DefaultWarningIllustration /> : illustration;

  const hasSteps = Array.isArray(steps) && steps.length > 0;
  const hasActions = primaryAction != null || secondaryAction != null;

  return (
    <View
      testID={testID}
      accessibilityLabel={accessibilityLabel}
      accessibilityLiveRegion="polite"
      style={[
        styles.container,
        {
          paddingHorizontal: px(theme.space["6"]),
          paddingTop: px(theme.space["8"]),
          paddingBottom: px(theme.space["6"]),
          gap: px(theme.space["4"]),
        },
        style,
      ]}
    >
      {visual != null && <View style={styles.center}>{visual}</View>}

      <View style={[styles.textBlock, { gap: px(theme.space["2"]) }]}>
        <Text
          accessibilityRole="header"
          style={{
            color: c.text.primary,
            fontSize: px(titleRole.size),
            lineHeight: px(titleRole.line),
            fontWeight: titleRole.weight as TextStyle["fontWeight"],
            textAlign: "center",
          }}
        >
          {title}
        </Text>

        {description != null && (
          <Text
            style={{
              color: c.text.warning,
              fontSize: px(bodyRole.size),
              lineHeight: px(bodyRole.line),
              fontWeight: bodyRole.weight as TextStyle["fontWeight"],
              textAlign: "center",
            }}
          >
            {description}
          </Text>
        )}
      </View>

      {hasSteps && (
        <View style={styles.stepsWrap}>
          <View style={[styles.divider, { backgroundColor: c.border.subtle }]} />
          <Text
            style={{
              color: c.text.primary,
              fontSize: px(subheadRole.size),
              lineHeight: px(subheadRole.line),
              fontWeight: subheadRole.weight as TextStyle["fontWeight"],
            }}
          >
            {stepsTitle}
          </Text>
          <View style={{ gap: px(theme.space["4"]) }}>
            {steps!.map((step, i) => (
              <View key={i} style={styles.stepRow}>
                <View
                  accessible={false}
                  importantForAccessibility="no-hide-descendants"
                  style={[styles.stepBadge, { backgroundColor: c.neutral["100"] }]}
                >
                  <Text
                    style={{
                      color: c.text.muted,
                      fontSize: px(microRole.size),
                      lineHeight: px(microRole.line),
                    }}
                  >
                    {i + 1}
                  </Text>
                </View>
                <Text
                  style={[
                    styles.stepText,
                    {
                      color: c.text.primary,
                      fontSize: px(bodyRole.size),
                      lineHeight: px(bodyRole.line),
                    },
                  ]}
                >
                  {step}
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {hasActions && (
        <View style={[styles.actions, { gap: px(theme.space["3"]) }]}>
          {secondaryAction != null && (
            <Button
              variant="secondary"
              fullWidth
              onPress={secondaryAction.onPress}
              loading={secondaryAction.loading}
            >
              {secondaryAction.label}
            </Button>
          )}
          {primaryAction != null && (
            <Button
              variant="primary"
              fullWidth
              onPress={primaryAction.onPress}
              loading={primaryAction.loading}
            >
              {primaryAction.label}
            </Button>
          )}
        </View>
      )}
    </View>
  );
}

/**
 * Built-in default visual for WarningState — a theme-aware warning badge.
 * Replace via the `illustration` slot (e.g. a `@kijani/illustrations` asset).
 * Token-based so it adapts to light & dark, unlike the raster icon in Figma.
 */
function DefaultWarningIllustration({ size = 96 }: { size?: number }) {
  const { theme } = useTheme();
  const c = theme.color;
  return (
    <View
      accessible={false}
      importantForAccessibility="no-hide-descendants"
      style={{
        width: size,
        height: size,
        borderRadius: px(theme.radius.full),
        backgroundColor: c.surface["warning-subtle"],
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Text
        style={{
          color: c.text.warning,
          fontSize: size * 0.5,
          lineHeight: size * 0.62,
          fontWeight: "700",
        }}
      >
        !
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignSelf: "stretch",
    alignItems: "center",
  },
  center: {
    alignItems: "center",
    justifyContent: "center",
  },
  textBlock: {
    alignSelf: "stretch",
    alignItems: "center",
  },
  stepsWrap: {
    alignSelf: "stretch",
    gap: 12,
  },
  divider: {
    height: 1,
    alignSelf: "stretch",
  },
  stepRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  stepBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
  },
  stepText: {
    flex: 1,
  },
  actions: {
    alignSelf: "stretch",
  },
});
