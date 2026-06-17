import React from "react";
import figma from "@figma/code-connect";
import { SegmentedControl } from "./SegmentedControl";

figma.connect(
  SegmentedControl,
  "https://www.figma.com/design/VQ49OXLtAbwlBBFABLEjrN/x?node-id=95-145",
  {
    props: {
      size: figma.enum("Size", { SM: "sm", MD: "md", LG: "lg" }),
      disabled: figma.boolean("Disabled"),
    },
    example: ({ size, disabled }) => (
      <SegmentedControl
        size={size}
        disabled={disabled}
        options={[
          { value: "a", label: "Option A" },
          { value: "b", label: "Option B" },
          { value: "c", label: "Option C" },
        ]}
        defaultValue="a"
      />
    ),
  }
);
