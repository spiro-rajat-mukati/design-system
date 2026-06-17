import React from "react";
import figma from "@figma/code-connect";
import { Checkbox } from "./Checkbox";

figma.connect(
  Checkbox,
  "https://www.figma.com/design/EAv9Vx2mFoBo4wXTVzP0Lv/x?node-id=2-3769",
  {
    props: {
      defaultChecked: figma.enum("state", {
        checked: true,
        "checked-disabled": true,
      }),
      indeterminate: figma.enum("state", { indeterminate: true }),
      disabled: figma.enum("state", {
        disabled: true,
        "checked-disabled": true,
      }),
    },
    example: ({ defaultChecked, indeterminate, disabled }) => (
      <Checkbox
        label="Option A"
        defaultChecked={defaultChecked}
        indeterminate={indeterminate}
        disabled={disabled}
      />
    ),
  }
);
