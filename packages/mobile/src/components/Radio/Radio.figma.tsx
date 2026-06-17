import React from "react";
import figma from "@figma/code-connect";
import { Radio } from "./Radio";

figma.connect(
  Radio,
  "https://www.figma.com/design/VQ49OXLtAbwlBBFABLEjrN/x?node-id=65-114",
  {
    props: {
      checked: figma.enum("State", { Checked: true }),
      disabled: figma.boolean("Disabled"),
      label: figma.string("Label"),
      description: figma.string("Description"),
    },
    example: ({ checked, disabled, label, description }) => (
      <Radio
        checked={checked}
        disabled={disabled}
        label={label}
        description={description}
        value="option"
      />
    ),
  }
);
