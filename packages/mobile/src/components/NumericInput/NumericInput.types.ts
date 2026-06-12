export type NumericInputSize = "sm" | "md" | "lg";

export interface NumericInputProps {
  value?: number;
  defaultValue?: number;
  onChange?: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  size?: NumericInputSize;
  disabled?: boolean;
  placeholder?: string;
  accessibilityLabel?: string;
  testID?: string;
}
