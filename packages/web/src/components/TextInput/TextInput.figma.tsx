import React from "react";
import figma from "@figma/code-connect";
import { TextInput } from "./TextInput";

figma.connect(
  TextInput,
  "https://www.figma.com/design/EAv9Vx2mFoBo4wXTVzP0Lv/x?node-id=2-2919",
  {
    props: {
      size: figma.enum("size", { sm: "sm", md: "md", lg: "lg" }),
      invalid: figma.enum("state", { error: true }),
      disabled: figma.enum("state", { disabled: true }),
      clearable: figma.boolean("clearable"),
    },
    example: ({ size, invalid, disabled, clearable }) => (
      <TextInput
        size={size}
        invalid={invalid}
        disabled={disabled}
        clearable={clearable}
      />
    ),
  }
);
