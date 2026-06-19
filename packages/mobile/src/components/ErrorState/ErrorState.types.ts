import type { ReactNode } from "react";
import type { StyleProp, ViewStyle } from "react-native";

/** A button action on {@link ErrorState} (e.g. "Try Again", "Go Back"). */
export interface ErrorStateAction {
  /** Visible button label. */
  label: string;
  /** Called when the button is pressed. */
  onPress: () => void;
  /**
   * Show a spinner on this action and disable it (e.g. while a retry is in
   * flight). ErrorState runs no async itself — the caller owns the request and
   * toggles this flag.
   */
  loading?: boolean;
}

export interface ErrorStateProps {
  /** Headline. Rendered as an accessibility header (text/mobile/title-sm). */
  title: string;
  /** Supporting copy. Rendered in the danger text colour, per the Kijani error design. */
  description?: string;
  /**
   * Visual shown above the text. Defaults to a built-in, theme-aware error
   * badge. Pass your own node to swap it per error type, or `null` to hide it.
   */
  illustration?: ReactNode;
  /** Primary (filled) action, e.g. "Try Again". */
  primaryAction?: ErrorStateAction;
  /** Secondary (outline) action, e.g. "Go Back". Rendered above the primary action. */
  secondaryAction?: ErrorStateAction;
  /** Accessibility label for the whole block (optional; the title is already a header). */
  accessibilityLabel?: string;
  testID?: string;
  style?: StyleProp<ViewStyle>;
}
