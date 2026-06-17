import React from "react";
import figma from "@figma/code-connect";
import { NumericInput } from "./NumericInput";

figma.connect(
  NumericInput,
  "https://www.figma.com/design/VQ49OXLtAbwlBBFABLEjrN/x?node-id=93-201",
  {
    props: {
      size: figma.enum("Size", { sm: "sm", md: "md", lg: "lg" }),
      disabled: figma.enum("Status", { Disabled: true }),
    },
    example: ({ size, disabled }) => (
      <NumericInput size={size} disabled={disabled} />
    ),
  }
);
