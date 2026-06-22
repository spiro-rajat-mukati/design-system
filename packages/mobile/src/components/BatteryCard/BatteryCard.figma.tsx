import React from "react";
import figma from "@figma/code-connect";
import { BatteryCard } from "./BatteryCard";

// Figma node 40002084:16516 (product file). Shakedown mapping — the Figma
// "Remap To" variant collapses to the `context` prop; level/status are data-driven.
figma.connect(
  BatteryCard,
  "https://www.figma.com/design/dQRT3wlyyiNh2WjjXPejWK/x?node-id=40002084-16516",
  {
    props: {
      context: figma.enum("Remap To", { Bike: "bike", Station: "station" }),
    },
    example: ({ context }) => (
      <BatteryCard name="U7B1LBNL36300660" level={7} context={context} />
    ),
  },
);
