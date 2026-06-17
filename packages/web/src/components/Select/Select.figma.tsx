import React from "react";
import figma from "@figma/code-connect";
import { Select } from "./Select";

figma.connect(
  Select,
  "https://www.figma.com/design/EAv9Vx2mFoBo4wXTVzP0Lv/x?node-id=2-5231",
  {
    props: {
      size: figma.enum("size", { sm: "sm", md: "md", lg: "lg" }),
      invalid: figma.enum("state", { error: true }),
      disabled: figma.enum("state", { disabled: true }),
    },
    example: ({ size, invalid, disabled }) => (
      <Select
        size={size}
        invalid={invalid}
        disabled={disabled}
        options={[
          { value: "a", label: "Option A" },
          { value: "b", label: "Option B" },
        ]}
      />
    ),
  }
);
