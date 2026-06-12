export interface TabItem {
  value: string;
  label: string;
  disabled?: boolean;
}

export type TabsVariant = "underline" | "pill";
export type TabsSize = "sm" | "md" | "lg";

export interface TabsProps {
  items: TabItem[];
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  variant?: TabsVariant;
  size?: TabsSize;
  disabled?: boolean;
  testID?: string;
  accessibilityLabel?: string;
}
