export type ProgressBarTone = "brand" | "success" | "warning" | "danger";
export type ProgressBarSize = "xs" | "sm" | "md" | "lg";

export interface ProgressBarProps {
  value?: number;
  max?: number;
  tone?: ProgressBarTone;
  size?: ProgressBarSize;
  label?: string;
  showValue?: boolean;
  indeterminate?: boolean;
  accessibilityLabel?: string;
  testID?: string;
}
