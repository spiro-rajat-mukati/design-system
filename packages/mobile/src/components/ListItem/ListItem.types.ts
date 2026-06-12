import type { StyleProp, ViewStyle } from "react-native";

export type ListItemVariant = "default" | "inset";

export interface ListItemProps {
  title: string;
  description?: string;
  /** Rendered before the title — pass an icon node or an Avatar */
  leadingContent?: React.ReactNode;
  /** Rendered after the title row — pass a Badge, a chevron, a Switch, etc. */
  trailingContent?: React.ReactNode;
  /** Show a horizontal divider below this item */
  showDivider?: boolean;
  /** Inset divider aligns with the title, skipping the leading slot width */
  variant?: ListItemVariant;
  onPress?: () => void;
  onLongPress?: () => void;
  disabled?: boolean;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  testID?: string;
  style?: StyleProp<ViewStyle>;
}
