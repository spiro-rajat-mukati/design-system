import type { ReactNode } from "react";
import type { TextInputProps as RNTextInputProps } from "react-native";

export type TextInputSize = "sm" | "md" | "lg";

export interface TextInputProps
  extends Omit<RNTextInputProps, "style" | "editable"> {
  size?: TextInputSize;
  /** Icon rendered inside the leading edge. */
  leadingIcon?: ReactNode;
  /** Icon rendered inside the trailing edge. */
  trailingIcon?: ReactNode;
  /** Static text prefix (e.g. "https://"). */
  prefix?: string;
  /** Static text suffix (e.g. ".com"). */
  suffix?: string;
  /** Show an × clear button when the field has a value. */
  clearable?: boolean;
  /** Called when the clear button is pressed. */
  onClear?: () => void;
  /** Override the validity state (usually inherited from FieldContext). */
  invalid?: boolean;
  disabled?: boolean;
  testID?: string;
}
