import React from "react";
import figma from "@figma/code-connect";
import { MultiSelect } from "./MultiSelect";

figma.connect(
  MultiSelect,
  "https://www.figma.com/design/VQ49OXLtAbwlBBFABLEjrN/x?node-id=102-199",
  {
    props: {
      size: figma.enum("Size", { SM: "sm", MD: "md", LG: "lg" }),
      disabled: figma.boolean("Disabled"),
      placeholder: figma.string("Placeholder"),
    },
    example: ({ size, disabled, placeholder }) => (
      <MultiSelect
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
