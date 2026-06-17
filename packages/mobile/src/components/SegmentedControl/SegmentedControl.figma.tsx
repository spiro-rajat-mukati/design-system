import React from "react";
import figma from "@figma/code-connect";
import { SegmentedControl } from "./SegmentedControl";

figma.connect(
  SegmentedControl,
  "https://www.figma.com/design/VQ49OXLtAbwlBBFABLEjrN/x?node-id=95-145",
  {
    props: {
      size: figma.enum("Size", { sm: "sm", md: "md", lg: "lg" }),
      tab1: figma.string("Tab 1"),
      tab2: figma.string("Tab 2"),
      tab3: figma.string("Tab 3"),
    },
    example: ({ size, tab1, tab2, tab3 }) => (
      <SegmentedControl
        size={size}
        options={[
          { value: "tab1", label: tab1 },
          { value: "tab2", label: tab2 },
          { value: "tab3", label: tab3 },
        ]}
        defaultValue="tab1"
      />
    ),
  }
);
