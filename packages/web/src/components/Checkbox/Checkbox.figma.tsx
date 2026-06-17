import React from "react";
import figma from "@figma/code-connect";
import { Checkbox } from "./Checkbox";

figma.connect(
  Checkbox,
  "https://www.figma.com/design/EAv9Vx2mFoBo4wXTVzP0Lv/x?node-id=2-3769",
  {
    props: {
      disabled: figma.boolean("Disabled"),
      checked: figma.enum("State", { Checked: true, Indeterminate: "indeterminate" }),
      indeterminate: figma.enum("State", { Indeterminate: true }),
      label: figma.string("Label"),
      description: figma.string("Description"),
      showDescription: figma.boolean("Show description"),
    },
    example: ({ disabled, checked, indeterminate, label }) => (
      <Checkbox disabled={disabled} defaultChecked={!!checked} indeterminate={indeterminate} label={label} />
    ),
  }
);
