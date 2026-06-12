import type { StyleProp, ViewStyle } from "react-native";

export type SafeAreaEdge = "top" | "bottom" | "left" | "right";
export type SafeAreaSurface = "default" | "raised" | "sunken" | "inverse" | "brand";

export interface SafeAreaWrapperProps {
  children: React.ReactNode;
  /**
   * Which edges to apply safe-area insets to.
   * Defaults to all four edges — pass a subset to skip edges
   * (e.g. ["bottom"] for a screen that has a fixed header already handling top).
   */
  edges?: SafeAreaEdge[];
  /**
   * Token surface to use as the wrapper background.
   * Maps to `theme.color.surface.*`. Defaults to "default".
   */
  surface?: SafeAreaSurface;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}
