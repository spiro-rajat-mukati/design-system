import React from "react";
import figma from "@figma/code-connect";
import { Textarea } from "./Textarea";

figma.connect(
  Textarea,
  "https://www.figma.com/design/EAv9Vx2mFoBo4wXTVzP0Lv/x?node-id=2-3511",
  {
    props: {
      invalid: figma.enum("Status", { Error: true }),
      disabled: figma.enum("Status", { Disabled: true }),
      showCount: figma.boolean("Show count"),
      resize: figma.enum("Resize", {
        Vertical: "vertical",
        None: "none",
      }),
      placeholder: figma.string("Placeholder"),
      value: figma.string("Value"),
    },
    example: ({ invalid, disabled, showCount, resize, placeholder, value }) => (
      <Textarea
        invalid={invalid}
        disabled={disabled}
        showCount={showCount}
        resize={resize}
        placeholder={placeholder}
        defaultValue={value}
      />
    ),
  }
);
