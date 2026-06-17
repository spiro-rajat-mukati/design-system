import React from "react";
import figma from "@figma/code-connect";
import { RadioGroup } from "./RadioGroup";

figma.connect(
  RadioGroup,
  "https://www.figma.com/design/VQ49OXLtAbwlBBFABLEjrN/x?node-id=108-181",
  {
    props: {
      orientation: figma.enum("Orientation", {
        Vertical: "vertical",
        Horizontal: "horizontal",
      }),
      disabled: figma.boolean("Disabled"),
    },
    example: ({ orientation, disabled }) => (
      <RadioGroup
        orientation={orientation}
        disabled={disabled}
        options={[
          { value: "a", label: "Option A" },
          { value: "b", label: "Option B" },
        ]}
      />
    ),
  }
);
