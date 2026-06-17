import React from "react";
import figma from "@figma/code-connect";
import { Select } from "./Select";

figma.connect(
  Select,
  "https://www.figma.com/design/VQ49OXLtAbwlBBFABLEjrN/x?node-id=101-144",
  {
    props: {
      size: figma.enum("Size", { SM: "sm", MD: "md", LG: "lg" }),
      disabled: figma.boolean("Disabled"),
      placeholder: figma.string("Placeholder"),
    },
    example: ({ size, disabled, placeholder }) => (
      <Select
        size={size}
        disabled={disabled}
        placeholder={placeholder}
        options={[
          { value: "a", label: "Option A" },
          { value: "b", label: "Option B" },
        ]}
      />
    ),
  }
);
