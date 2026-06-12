import React from "react";
import { Pressable, View, Text, StyleSheet } from "react-native";
import { useTheme } from "../../ThemeContext";
import { px } from "../../utils/tokens";
import type { ListItemProps } from "./ListItem.types";

const LEADING_SIZE = 40;
const MIN_HEIGHT = 56;

export function ListItem({
  title,
  description,
  leadingContent,
  trailingContent,
  showDivider = false,
  variant = "default",
  onPress,
  onLongPress,
  disabled = false,
  accessibilityLabel,
  accessibilityHint,
  testID,
  style,
}: ListItemProps) {
  const { theme } = useTheme();
  const t = theme.color;

  const insetDivider = variant === "inset" && leadingContent != null;
  const dividerLeft = insetDivider ? LEADING_SIZE + px(theme.space["4"]) * 2 : 0;

  const content = (
    <>
      <View style={styles.row}>
        {leadingContent != null && (
          <View
            style={styles.leading}
            accessible={false}
            importantForAccessibility="no"
          >
            {leadingContent}
          </View>
        )}

        <View style={styles.body}>
          <Text
            style={[
              styles.title,
              {
                color: disabled ? t.text.disabled : t.text.primary,
                fontSize: px(theme["font-size"]["200"]),
              },
            ]}
            numberOfLines={1}
          >
            {title}
          </Text>
          {description != null && (
            <Text
              style={[
                styles.description,
                {
                  color: disabled ? t.text.disabled : t.text.secondary,
                  fontSize: px(theme["font-size"]["100"]),
                  lineHeight: px(theme["font-size"]["100"]) * 1.5,
                },
              ]}
              numberOfLines={2}
            >
              {description}
            </Text>
          )}
        </View>

        {trailingContent != null && (
          <View style={styles.trailing}>{trailingContent}</View>
        )}
      </View>

      {showDivider && (
        <View
          style={[
            styles.divider,
            {
              backgroundColor: t.border.subtle,
              marginLeft: dividerLeft,
            },
          ]}
          accessible={false}
        />
      )}
    </>
  );

  if (onPress || onLongPress) {
    return (
      <Pressable
        testID={testID}
        onPress={disabled ? undefined : onPress}
        onLongPress={disabled ? undefined : onLongPress}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel ?? title}
        accessibilityHint={accessibilityHint}
        accessibilityState={{ disabled }}
        style={({ pressed }) => [
          styles.container,
          {
            backgroundColor: pressed && !disabled
              ? t.neutral["50"]
              : t.surface.default,
            minHeight: MIN_HEIGHT,
            opacity: disabled ? 0.55 : 1,
          },
          style,
        ]}
      >
        {content}
      </Pressable>
    );
  }

  return (
    <View
      testID={testID}
      style={[
        styles.container,
        {
          backgroundColor: t.surface.default,
          minHeight: MIN_HEIGHT,
          opacity: disabled ? 0.55 : 1,
        },
        style,
      ]}
    >
      {content}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    justifyContent: "center",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: MIN_HEIGHT - 16,
  },
  leading: {
    width: LEADING_SIZE,
    height: LEADING_SIZE,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
    flexShrink: 0,
  },
  body: {
    flex: 1,
    justifyContent: "center",
  },
  title: {
    fontWeight: "400",
  },
  description: {
    marginTop: 2,
  },
  trailing: {
    marginLeft: 12,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginTop: 8,
  },
});
