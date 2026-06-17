import React from "react";
import figma from "@figma/code-connect";
import { Select } from "./Select";

figma.connect(
  Select,
  "https://www.figma.com/design/EAv9Vx2mFoBo4wXTVzP0Lv/x?node-id=2-5231",
  {
    props: {
      size: figma.enum("Size", { SM: "sm", MD: "md", LG: "lg" }),
      invalid: figma.enum("Status", { Error: true }),
      disabled: figma.enum("Status", { Disabled: true }),
      searchable: figma.boolean("Searchable"),
      placeholder: figma.string("Placeholder"),
    },
    example: ({ size, invalid, disabled, searchable, placeholder }) => (
      <Select
        size={size}
        invalid={invalid}
        disabled={disabled}
        searchable={searchable}
        placeholder={placeholder}
        options={[
          { value: "a", label: "Option A" },
          { value: "b", label: "Option B" },
        ]}
      />
    ),
  }
);
