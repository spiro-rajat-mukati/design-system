import React from "react";
import figma from "@figma/code-connect";
import { Tabs } from "./Tabs";

figma.connect(
  Tabs,
  "https://www.figma.com/design/EAv9Vx2mFoBo4wXTVzP0Lv/x?node-id=2-4769",
  {
    props: {
      variant: figma.enum("Variant", {
        Underline: "underline",
        Pill: "pill",
        Segmented: "segmented",
        Enclosed: "enclosed",
      }),
      size: figma.enum("Size", { SM: "sm", MD: "md", LG: "lg" }),
      orientation: figma.enum("Orientation", {
        Horizontal: "horizontal",
        Vertical: "vertical",
      }),
      fullWidth: figma.boolean("Full width"),
    },
    example: ({ variant, size, orientation, fullWidth }) => (
      <Tabs
        variant={variant}
        size={size}
        orientation={orientation}
        fullWidth={fullWidth}
        items={[
          { id: "one", label: "Tab 1", content: null },
          { id: "two", label: "Tab 2", content: null },
        ]}
        defaultValue="one"
      />
    ),
  }
);
