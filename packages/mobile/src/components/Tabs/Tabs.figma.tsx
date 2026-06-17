import React from "react";
import figma from "@figma/code-connect";
import { Tabs } from "./Tabs";

figma.connect(
  Tabs,
  "https://www.figma.com/design/VQ49OXLtAbwlBBFABLEjrN/x?node-id=96-174",
  {
    props: {
      variant: figma.enum("Variant", {
        underline: "underline",
        pill: "pill",
      }),
      size: figma.enum("Size", { sm: "sm", md: "md", lg: "lg" }),
      tab1: figma.string("Tab 1"),
      tab2: figma.string("Tab 2"),
      tab3: figma.string("Tab 3"),
      tab4: figma.string("Tab 4"),
    },
    example: ({ variant, size, tab1, tab2, tab3, tab4 }) => (
      <Tabs
        variant={variant}
        size={size}
        items={[
          { value: "tab1", label: tab1 },
          { value: "tab2", label: tab2 },
          { value: "tab3", label: tab3 },
          { value: "tab4", label: tab4 },
        ]}
        defaultValue="tab1"
      />
    ),
  }
);
