import type { TextInputProps as RNTextInputProps } from "react-native";

export interface TextareaProps
  extends Omit<RNTextInputProps, "style" | "editable" | "multiline"> {
  /**
   * Number of visible rows. Defaults to 3.
   * "auto" grows with content (up to maxRows).
   */
  rows?: number | "auto";
  /** Only meaningful when rows="auto". */
  maxRows?: number;
  /** Show a character counter. Also shown automatically when maxLength is set. */
  showCount?: boolean;
  /** Override validity state (usually inherited from FieldContext). */
  invalid?: boolean;
  disabled?: boolean;
  testID?: string;
}
