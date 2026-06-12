export type TagTone = "neutral" | "brand" | "success" | "warning" | "danger" | "info";
export type TagVariant = "soft" | "outline" | "solid";
export type TagSize = "sm" | "md";

export interface TagProps {
  label: string;
  tone?: TagTone;
  variant?: TagVariant;
  size?: TagSize;
  removable?: boolean;
  onRemove?: () => void;
  onPress?: () => void;
  disabled?: boolean;
  accessibilityLabel?: string;
}
