import type { ReactNode } from "react";
import type { ViewProps } from "react-native";

export type BadgeVariant = "soft" | "solid" | "outline" | "dot";
export type BadgeTone =
  | "neutral"
  | "brand"
  | "success"
  | "warning"
  | "danger"
  | "info";
export type BadgeSize = "xs" | "sm" | "md";

export interface BadgeProps extends Pick<ViewProps, "testID" | "accessibilityLabel"> {
  variant?: BadgeVariant;
  tone?: BadgeTone;
  size?: BadgeSize;
  /** Icon rendered before the label. */
  leadingIcon?: ReactNode;
  /** When set, renders the numeric count (capped at 99+) instead of children. */
  count?: number;
  /** Prepend a filled dot. */
  withDot?: boolean;
  children?: ReactNode;
}
