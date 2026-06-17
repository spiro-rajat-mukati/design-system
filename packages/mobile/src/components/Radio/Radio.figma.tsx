import React from "react";
import figma from "@figma/code-connect";
import { Radio } from "./Radio";

figma.connect(
  Radio,
  "https://www.figma.com/design/VQ49OXLtAbwlBBFABLEjrN/x?node-id=65-114",
  {
    props: {
      checked: figma.enum("State", { Selected: true }),
      disabled: figma.boolean("Disabled"),
      label: figma.string("Label"),
      description: figma.string("Description"),
      showDescription: figma.boolean("Show description"),
    },
    example: ({ checked, disabled, label }) => (
      <Radio checked={checked} disabled={disabled} value="option" label={label} />
    ),
  }
);
