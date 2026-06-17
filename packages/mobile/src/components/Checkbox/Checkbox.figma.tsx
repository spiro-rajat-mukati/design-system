import React from "react";
import figma from "@figma/code-connect";
import { Checkbox } from "./Checkbox";

figma.connect(
  Checkbox,
  "https://www.figma.com/design/VQ49OXLtAbwlBBFABLEjrN/x?node-id=62-114",
  {
    props: {
      checked: figma.enum("State", { Checked: true }),
      indeterminate: figma.enum("State", { Indeterminate: true }),
      disabled: figma.boolean("Disabled"),
      label: figma.string("Label"),
      description: figma.string("Description"),
    },
    example: ({ checked, indeterminate, disabled, label, description }) => (
      <Checkbox
        checked={checked}
        indeterminate={indeterminate}
        disabled={disabled}
        label={label}
        description={description}
      />
    ),
  }
);
