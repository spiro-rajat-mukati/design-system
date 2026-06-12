import type { ReactNode } from "react";
import type { PressableProps } from "react-native";

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "tertiary"
  | "destructive"
  | "destructive-secondary"
  | "link";

export type ButtonSize = "xs" | "sm" | "md" | "lg" | "xl";

export interface ButtonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Icon rendered before the label. */
  leadingIcon?: ReactNode;
  /** Icon rendered after the label. */
  trailingIcon?: ReactNode;
  /** Square icon-only button; requires accessibilityLabel for an accessible name. */
  iconOnly?: boolean;
  /** Stretch to 100% of parent width. */
  fullWidth?: boolean;
  /** Show spinner; disables interaction. */
  loading?: boolean;
  disabled?: boolean;
  /** Visible label (or aria name when iconOnly). */
  children?: ReactNode;
  onPress?: PressableProps["onPress"];
  accessibilityLabel?: string;
  testID?: string;
}
