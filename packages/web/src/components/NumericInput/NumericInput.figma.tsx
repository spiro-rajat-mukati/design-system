import React from "react";
import figma from "@figma/code-connect";
import { NumericInput } from "./NumericInput";

figma.connect(
  NumericInput,
  "https://www.figma.com/design/EAv9Vx2mFoBo4wXTVzP0Lv/x?node-id=2-3537",
  {
    props: {
      size: figma.enum("Size", { SM: "sm", MD: "md", LG: "lg" }),
      invalid: figma.enum("Status", { Error: true }),
      disabled: figma.enum("Status", { Disabled: true }),
      placeholder: figma.string("Placeholder"),
    },
    example: ({ size, invalid, disabled, placeholder }) => (
      <NumericInput
        size={size}
        invalid={invalid}
        disabled={disabled}
        placeholder={placeholder}
      />
    ),
  }
);
