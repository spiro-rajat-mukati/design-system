import React from "react";
import figma from "@figma/code-connect";
import { Tabs } from "./Tabs";

figma.connect(
  Tabs,
  "https://www.figma.com/design/VQ49OXLtAbwlBBFABLEjrN/x?node-id=96-174",
  {
    props: {
      variant: figma.enum("Variant", {
        Underline: "underline",
        Pill: "pill",
      }),
      size: figma.enum("Size", { SM: "sm", MD: "md", LG: "lg" }),
      disabled: figma.boolean("Disabled"),
    },
    example: ({ variant, size, disabled }) => (
      <Tabs
        variant={variant}
        size={size}
        disabled={disabled}
        items={[
          { value: "one", label: "Tab 1" },
          { value: "two", label: "Tab 2" },
        ]}
        defaultValue="one"
      />
    ),
  }
);
