import React from "react";
import figma from "@figma/code-connect";
import { Checkbox } from "./Checkbox";
import { CheckboxGroup } from "./CheckboxGroup";

figma.connect(
  Checkbox,
  "https://www.figma.com/design/VQ49OXLtAbwlBBFABLEjrN/x?node-id=62-114",
  {
    props: {
      checked: figma.enum("State", { Checked: true, Indeterminate: "indeterminate" }),
      indeterminate: figma.enum("State", { Indeterminate: true }),
      disabled: figma.boolean("Disabled"),
      label: figma.string("Label"),
      description: figma.string("Description"),
      showDescription: figma.boolean("Show description"),
    },
    example: ({ checked, indeterminate, disabled, label }) => (
      <Checkbox
        defaultChecked={!!checked}
        indeterminate={indeterminate}
        disabled={disabled}
        label={label}
      />
    ),
  }
);
