import type { ReactNode } from "react";

export type FieldStatus = "default" | "error" | "success";

export interface FieldContextValue {
  controlId: string;
  required: boolean;
  disabled: boolean;
  status: FieldStatus;
}

export interface FieldProps {
  /** Visible label. Required for accessibility. */
  label: ReactNode;
  /** Long-form description shown under the label. */
  description?: ReactNode;
  /** Helper text shown below the control in the default state. */
  helperText?: ReactNode;
  /** Error message — shown instead of helperText; sets status=error. */
  errorText?: ReactNode;
  /** Success message — sets status=success. */
  successText?: ReactNode;
  /** Mark field required (asterisk + propagated to control). */
  required?: boolean;
  /** Disabled state propagated to children via context. */
  disabled?: boolean;
  /** The control (TextInput, Textarea, Checkbox group, etc.). */
  children: ReactNode;
  testID?: string;
}
