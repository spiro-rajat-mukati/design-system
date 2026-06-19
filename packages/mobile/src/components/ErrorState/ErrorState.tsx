import React from "react";
import { View, Text, StyleSheet, type TextStyle } from "react-native";
import { useTheme } from "../../ThemeContext";
import { px } from "../../utils/tokens";
import { Button } from "../Button";
import type { ErrorStateProps } from "./ErrorState.types";

/**
 * ErrorState — generic error / empty content organism for `@kijani/mobile`.
 *
 * CONTENT ONLY: illustration + headline + body + actions. It carries NO sheet
 * chrome — compose it inside `<BottomSheet>` (or full-screen / inline). The
 * Figma source (node 169:846) baked in the sheet surface, a floating close
 * button, and a top gradient; those are the container's job (BottomSheet now
 * has `showCloseButton`). The Figma's hand-built buttons (Plus Jakarta Sans,
 * raw greyscale, 32px radius) are replaced with the real `<Button>` primitive,
 * so they inherit TT Hoves, the monochrome palette, the pill radius, and dark
 * mode automatically.
 *
 * Behaviour is caller-owned: pass `primaryAction.loading` while a retry is in
 * flight; the component itself runs no async.
 */
export function ErrorState({
  title,
  description,
  illustration,
  primaryAction,
  secondaryAction,
  accessibilityLabel,
  testID,
  style,
}: ErrorStateProps) {
  const { theme } = useTheme();
  const c = theme.color;
  const titleRole = theme.text.mobile["title-sm"];
  const bodyRole = theme.text.mobile["body-md-regular"];

  // undefined → built-in default; null → hidden; otherwise the caller's node.
  const visual =
    illustration === undefined ? <DefaultErrorIllustration /> : illustration;

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
              color: c.text.danger,
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
 * Built-in default visual for ErrorState — a theme-aware danger badge.
 * Replace via the `illustration` slot (e.g. a `@kijani/illustrations` asset).
 * Intentionally token-based so it adapts to light & dark, unlike the raster
 * octagon in the Figma source.
 */
function DefaultErrorIllustration({ size = 96 }: { size?: number }) {
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
        backgroundColor: c.surface["danger-subtle"],
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Text
        style={{
          color: c.text.danger,
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
  actions: {
    alignSelf: "stretch",
  },
});
