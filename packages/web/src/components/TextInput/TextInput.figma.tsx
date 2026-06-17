import React from "react";
import figma from "@figma/code-connect";
import { TextInput } from "./TextInput";

figma.connect(
  TextInput,
  "https://www.figma.com/design/EAv9Vx2mFoBo4wXTVzP0Lv/x?node-id=2-2919",
  {
    props: {
      size: figma.enum("Size", { SM: "sm", MD: "md", LG: "lg" }),
      invalid: figma.enum("Status", { Error: true }),
      disabled: figma.enum("Status", { Disabled: true }),
      clearable: figma.boolean("Clearable"),
      leadingIcon: figma.instance("Leading icon"),
      trailingIcon: figma.instance("Trailing icon"),
      placeholder: figma.string("Placeholder"),
      value: figma.string("Value"),
    },
    example: ({ size, invalid, disabled, clearable, leadingIcon, trailingIcon, placeholder, value }) => (
      <TextInput
        size={size}
        invalid={invalid}
        disabled={disabled}
        clearable={clearable}
        leadingIcon={leadingIcon}
        trailingIcon={trailingIcon}
        placeholder={placeholder}
        defaultValue={value}
      />
    ),
  }
);
