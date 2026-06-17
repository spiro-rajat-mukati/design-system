import React from "react";
import figma from "@figma/code-connect";
import { MultiSelect } from "./MultiSelect";

figma.connect(
  MultiSelect,
  "https://www.figma.com/design/EAv9Vx2mFoBo4wXTVzP0Lv/x?node-id=2-5292",
  {
    props: {
      size: figma.enum("Size", { SM: "sm", MD: "md", LG: "lg" }),
      invalid: figma.enum("Status", { Error: true }),
      disabled: figma.enum("Status", { Disabled: true }),
      searchable: figma.boolean("Searchable"),
      selectAll: figma.boolean("Select all"),
      placeholder: figma.string("Placeholder"),
    },
    example: ({ size, invalid, disabled, searchable, selectAll, placeholder }) => (
      <MultiSelect
        size={size}
        invalid={invalid}
        disabled={disabled}
        searchable={searchable}
        selectAll={selectAll}
        placeholder={placeholder}
        options={[
          { value: "a", label: "Option A" },
          { value: "b", label: "Option B" },
        ]}
      />
    ),
  }
);
