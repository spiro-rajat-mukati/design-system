import React from "react";
import figma from "@figma/code-connect";
import { Textarea } from "./Textarea";

figma.connect(
  Textarea,
  "https://www.figma.com/design/VQ49OXLtAbwlBBFABLEjrN/x?node-id=84-114",
  {
    props: {
      invalid: figma.enum("Status", { Error: true }),
      disabled: figma.enum("Status", { Disabled: true }),
      showCount: figma.boolean("Show count"),
      placeholder: figma.string("Placeholder"),
      value: figma.string("Value"),
    },
    example: ({ invalid, disabled, showCount, placeholder, value }) => (
      <Textarea
        invalid={invalid}
        disabled={disabled}
        showCount={showCount}
        placeholder={placeholder}
        defaultValue={value}
      />
    ),
  }
);
