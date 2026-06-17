import React from "react";
import figma from "@figma/code-connect";
import { NumericInput } from "./NumericInput";

figma.connect(
  NumericInput,
  "https://www.figma.com/design/EAv9Vx2mFoBo4wXTVzP0Lv/x?node-id=2-3537",
  {
    props: {
      size: figma.enum("size", { sm: "sm", md: "md", lg: "lg" }),
      invalid: figma.enum("state", { error: true }),
      disabled: figma.enum("state", { disabled: true }),
    },
    example: ({ size, invalid, disabled }) => (
      <NumericInput size={size} invalid={invalid} disabled={disabled} />
    ),
  }
);
