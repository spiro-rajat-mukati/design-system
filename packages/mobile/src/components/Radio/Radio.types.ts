import type { ReactNode } from "react";

export interface RadioProps {
  label: ReactNode;
  description?: ReactNode;
  checked?: boolean;
  value?: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
  accessibilityLabel?: string;
  testID?: string;
}

export interface RadioOption {
  value: string;
  label: ReactNode;
  description?: ReactNode;
  disabled?: boolean;
}

export interface RadioGroupProps {
  name?: string;
  options: RadioOption[];
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  orientation?: "vertical" | "horizontal";
  disabled?: boolean;
  accessibilityLabel?: string;
  testID?: string;
}
