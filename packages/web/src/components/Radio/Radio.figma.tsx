import React from "react";
import figma from "@figma/code-connect";
import { Radio } from "./Radio";

figma.connect(
  Radio,
  "https://www.figma.com/design/EAv9Vx2mFoBo4wXTVzP0Lv/x?node-id=2-3705",
  {
    props: {
      defaultChecked: figma.enum("state", {
        checked: true,
        "checked-hover": true,
        "checked-disabled": true,
      }),
      disabled: figma.enum("state", {
        disabled: true,
        "checked-disabled": true,
      }),
    },
    example: ({ defaultChecked, disabled }) => (
      <Radio
        label="Option A"
        value="option-a"
        defaultChecked={defaultChecked}
        disabled={disabled}
      />
    ),
  }
);
