import React from "react";
import figma from "@figma/code-connect";
import { Select } from "./Select";

figma.connect(
  Select,
  "https://www.figma.com/design/VQ49OXLtAbwlBBFABLEjrN/x?node-id=101-144",
  {
    props: {
      size: figma.enum("Size", { sm: "sm", md: "md", lg: "lg" }),
      disabled: figma.enum("Status", { Disabled: true }),
      value: figma.string("Value"),
    },
    example: ({ size, disabled, value }) => (
      <Select
        size={size}
        disabled={disabled}
        value={value}
        options={[
          { value: "a", label: "Option A" },
          { value: "b", label: "Option B" },
        ]}
      />
    ),
  }
);
