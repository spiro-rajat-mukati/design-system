export interface MultiSelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export type MultiSelectSize = "sm" | "md" | "lg";

export interface MultiSelectProps {
  options: MultiSelectOption[];
  value?: string[];
  defaultValue?: string[];
  onChange?: (value: string[]) => void;
  placeholder?: string;
  size?: MultiSelectSize;
  disabled?: boolean;
  maxSelections?: number;
  accessibilityLabel?: string;
  testID?: string;
}
