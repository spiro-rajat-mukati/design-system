import React from "react";
import figma from "@figma/code-connect";
import { CheckboxGroup } from "./CheckboxGroup";

figma.connect(
  CheckboxGroup,
  "https://www.figma.com/design/VQ49OXLtAbwlBBFABLEjrN/x?node-id=108-148",
  {
    props: {
      orientation: figma.enum("Orientation", {
        Vertical: "vertical",
        Horizontal: "horizontal",
      }),
      disabled: figma.boolean("Disabled"),
    },
    example: ({ orientation, disabled }) => (
      <CheckboxGroup
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
