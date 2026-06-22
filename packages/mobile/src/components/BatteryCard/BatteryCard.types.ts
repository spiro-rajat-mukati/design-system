import type { ReactNode } from "react";
import type { StyleProp, ViewStyle } from "react-native";

/** Which flow the card is used in — drives the indicator + the default caption. */
export type BatteryContext = "bike" | "station";

/** Operation state of the flow — tints the background pattern. */
export type BatteryCardStatus = "default" | "in-progress" | "warning" | "error";

export interface BatteryCardProps {
  /** Battery serial / display name, e.g. U7B1LBNL36300660. */
  name: string;
  /** 0–100 charge → derived tone; "unknown" → SoC-unknown state with a re-map link. */
  level: number | "unknown";
  /** Set by the flow; drives the Bike/Station indicator + the default caption. */
  context: BatteryContext;
  /** Subheading below the image; defaults to "Re-Map Battery to {Bike|Station}". */
  caption?: string;
  /** Flow state; tints the background pattern (grey / blue / yellow / red). */
  status?: BatteryCardStatus;
  /** Battery image slot; defaults to a themed placeholder (real default: @kijani/illustrations Battery). */
  illustration?: ReactNode;
  /** Fired by the re-map link, only in the "unknown" level state. */
  onRemap?: () => void;
  /** Label for the re-map link. Defaults to "Re-map battery". */
  remapLabel?: string;
  testID?: string;
  style?: StyleProp<ViewStyle>;
}
