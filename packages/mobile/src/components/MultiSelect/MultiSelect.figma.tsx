import React from "react";
import figma from "@figma/code-connect";
import { MultiSelect } from "./MultiSelect";

figma.connect(
  MultiSelect,
  "https://www.figma.com/design/VQ49OXLtAbwlBBFABLEjrN/x?node-id=102-199",
  {
    props: {
      size: figma.enum("Size", { sm: "sm", md: "md", lg: "lg" }),
      disabled: figma.enum("Status", { Disabled: true }),
    },
    example: ({ size, disabled }) => (
      <MultiSelect
        size={size}
        disabled={disabled}
        options={[
          { value: "a", label: "Option A" },
          { value: "b", label: "Option B" },
        ]}
      />
    ),
  }
);
