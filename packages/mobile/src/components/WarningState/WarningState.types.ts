import type { ReactNode } from "react";
import type { StyleProp, ViewStyle } from "react-native";

/** A button action on {@link WarningState} (e.g. "Continue", "Go Back & Review"). */
export interface WarningStateAction {
  /** Visible button label. */
  label: string;
  /** Called when the button is pressed. */
  onPress: () => void;
  /**
   * Show a spinner on this action and disable it (e.g. while the action runs).
   * WarningState runs no async itself — the caller owns it and toggles this flag.
   */
  loading?: boolean;
}

export interface WarningStateProps {
  /** Headline. Rendered as an accessibility header (text/mobile/title-sm). */
  title: string;
  /** Supporting copy. Rendered in the warning text colour, per the Kijani warning design. */
  description?: string;
  /**
   * Optional ordered "what to do next" steps. When present, a divider and a
   * numbered list are shown below the message. Omit for a plain warning.
   */
  steps?: string[];
  /** Heading above the steps list. Defaults to "What to do next?". */
  stepsTitle?: string;
  /**
   * Visual shown above the text. Defaults to a built-in, theme-aware warning
   * badge. Pass your own node to swap it, or `null` to hide it.
   */
  illustration?: ReactNode;
  /** Primary (filled) action, e.g. "Go Back & Review". */
  primaryAction?: WarningStateAction;
  /** Secondary (outline) action, e.g. "Continue". Rendered above the primary action. */
  secondaryAction?: WarningStateAction;
  /** Accessibility label for the whole block (optional; the title is already a header). */
  accessibilityLabel?: string;
  testID?: string;
  style?: StyleProp<ViewStyle>;
}
