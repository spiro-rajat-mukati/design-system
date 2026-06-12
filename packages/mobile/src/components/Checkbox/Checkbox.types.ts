import type { ReactNode } from "react";

export interface CheckboxProps {
  label: ReactNode;
  description?: ReactNode;
  checked?: boolean;
  defaultChecked?: boolean;
  /** Render the indeterminate "−" visual state. */
  indeterminate?: boolean;
  onChange?: (checked: boolean) => void;
  disabled?: boolean;
  accessibilityLabel?: string;
  testID?: string;
}

export interface CheckboxOption {
  value: string;
  label: ReactNode;
  description?: ReactNode;
  disabled?: boolean;
}

export interface CheckboxGroupProps {
  options: CheckboxOption[];
  value?: string[];
  defaultValue?: string[];
  onChange?: (values: string[]) => void;
  orientation?: "vertical" | "horizontal";
  disabled?: boolean;
  accessibilityLabel?: string;
  testID?: string;
}
