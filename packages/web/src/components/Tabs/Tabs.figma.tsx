import React from "react";
import figma from "@figma/code-connect";
import { Tabs } from "./Tabs";

figma.connect(
  Tabs,
  "https://www.figma.com/design/EAv9Vx2mFoBo4wXTVzP0Lv/x?node-id=2-4769",
  {
    props: {
      variant: figma.enum("variant", {
        underline: "underline",
        pill: "pill",
        segmented: "segmented",
        enclosed: "enclosed",
      }),
      size: figma.enum("size", { sm: "sm", md: "md", lg: "lg" }),
    },
    example: ({ variant, size }) => (
      <Tabs
        variant={variant}
        size={size}
        items={[
          { id: "one", label: "Tab 1", content: null },
          { id: "two", label: "Tab 2", content: null },
          { id: "three", label: "Tab 3", content: null },
        ]}
        defaultValue="one"
      />
    ),
  }
);
