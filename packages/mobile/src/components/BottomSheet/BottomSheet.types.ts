import type { ReactNode } from "react";
import type { StyleProp, ViewStyle } from "react-native";

export interface SnapPoint {
  /** Height in px or percent string like "50%" */
  value: number | string;
  label?: string;
}

export interface BottomSheetProps {
  visible: boolean;
  onClose: () => void;
  /**
   * Snap points from smallest to largest. The sheet opens at the last point.
   * Defaults to ["50%", "90%"].
   */
  snapPoints?: Array<number | string>;
  /** Initial snap point index (0-based). Defaults to 0. */
  initialSnapIndex?: number;
  title?: string;
  children: ReactNode;
  /** Show the drag handle pill. Defaults to true. */
  showHandle?: boolean;
  /** Show an X close button in the top-right of the sheet. Defaults to false. */
  showCloseButton?: boolean;
  /** Backdrop press closes the sheet. Defaults to true. */
  closeOnBackdrop?: boolean;
  /** Swipe-down past the smallest snap point closes the sheet. Defaults to true. */
  closeOnSwipeDown?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}
