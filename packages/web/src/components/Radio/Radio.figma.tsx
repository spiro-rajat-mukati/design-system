import React from "react";
import figma from "@figma/code-connect";
import { Radio } from "./Radio";
import { RadioGroup } from "./RadioGroup";

figma.connect(
  Radio,
  "https://www.figma.com/design/EAv9Vx2mFoBo4wXTVzP0Lv/x?node-id=2-3705",
  {
    props: {
      disabled: figma.boolean("Disabled"),
      checked: figma.enum("State", { Selected: true }),
      label: figma.string("Label"),
      description: figma.string("Description"),
      showDescription: figma.boolean("Show description"),
    },
    example: ({ disabled, checked, label, description, showDescription }) => (
      <Radio disabled={disabled} defaultChecked={checked} value="option">
        {label}
      </Radio>
    ),
  }
);
