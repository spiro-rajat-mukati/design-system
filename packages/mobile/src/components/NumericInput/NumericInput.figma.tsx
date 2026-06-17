import React from "react";
import figma from "@figma/code-connect";
import { NumericInput } from "./NumericInput";

figma.connect(
  NumericInput,
  "https://www.figma.com/design/VQ49OXLtAbwlBBFABLEjrN/x?node-id=93-201",
  {
    props: {
      size: figma.enum("Size", { SM: "sm", MD: "md", LG: "lg" }),
      disabled: figma.boolean("Disabled"),
      placeholder: figma.string("Placeholder"),
    },
    example: ({ size, disabled, placeholder }) => (
      <NumericInput size={size} disabled={disabled} placeholder={placeholder} />
    ),
  }
);
