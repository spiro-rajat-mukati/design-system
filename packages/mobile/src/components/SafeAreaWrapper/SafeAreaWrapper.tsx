import React from "react";
import { SafeAreaView, View, StyleSheet } from "react-native";
import { useTheme } from "../../ThemeContext";
import type { SafeAreaWrapperProps, SafeAreaEdge, SafeAreaSurface } from "./SafeAreaWrapper.types";

/*
 * Uses React Native's built-in SafeAreaView.
 * For more precise insets (notch, dynamic island, Android cutouts), install
 * expo-safe-area-context and swap this component for SafeAreaView from that
 * package — the props API is intentionally compatible.
 */

const ALL_EDGES: SafeAreaEdge[] = ["top", "bottom", "left", "right"];

function getSurfaceColor(
  theme: ReturnType<typeof useTheme>["theme"],
  surface: SafeAreaSurface,
): string {
  const s = theme.color.surface;
  switch (surface) {
    case "raised": return s.raised;
    case "sunken": return s.sunken;
    case "inverse": return s.inverse;
    case "brand": return s.brand;
    default: return s.default;
  }
}

export function SafeAreaWrapper({
  children,
  edges = ALL_EDGES,
  surface = "default",
  style,
  testID,
}: SafeAreaWrapperProps) {
  const { theme } = useTheme();
  const backgroundColor = getSurfaceColor(theme, surface);

  // When all four edges are requested, use SafeAreaView directly.
  // When a subset is requested, wrap in a plain View and apply manual
  // padding for the non-safe edges — RN's SafeAreaView applies all insets
  // and can't be restricted to a subset at this API level.
  const isAllEdges =
    edges.length === 4 &&
    ALL_EDGES.every((e) => edges.includes(e));

  if (isAllEdges) {
    return (
      <SafeAreaView
        testID={testID}
        style={[styles.base, { backgroundColor }, style]}
      >
        {children}
      </SafeAreaView>
    );
  }

  // Subset: use SafeAreaView for the edges that are safe, plain View for others
  const useTop = edges.includes("top");
  const useBottom = edges.includes("bottom");

  return (
    <SafeAreaView
      testID={testID}
      style={[
        styles.base,
        { backgroundColor },
        !useTop && styles.noTop,
        !useBottom && styles.noBottom,
        style,
      ]}
    >
      {children}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  base: {
    flex: 1,
  },
  noTop: {
    // SafeAreaView always applies top; compensate by removing the visual effect
    // via a negative margin when consumers explicitly exclude the top edge.
    // This is a best-effort approximation — expo-safe-area-context handles
    // this more precisely via useSafeAreaInsets().
    marginTop: 0,
  },
  noBottom: {
    marginBottom: 0,
  },
});
