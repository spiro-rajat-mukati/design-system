export interface ActionSheetItem {
  label: string;
  onPress: () => void;
  destructive?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
}

export interface ActionSheetProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  message?: string;
  items: ActionSheetItem[];
  cancelLabel?: string;
  testID?: string;
}
