import React from "react";
import figma from "@figma/code-connect";
import { TextInput } from "./TextInput";

figma.connect(
  TextInput,
  "https://www.figma.com/design/VQ49OXLtAbwlBBFABLEjrN/x?node-id=79-114",
  {
    props: {
      size: figma.enum("Size", { sm: "sm", md: "md", lg: "lg" }),
      invalid: figma.enum("Status", { Error: true }),
      disabled: figma.enum("Status", { Disabled: true }),
      secureTextEntry: figma.boolean("Masked"),
      leadingIcon: figma.instance("Leading icon swap"),
      defaultValue: figma.string("Value"),
    },
    example: ({ size, invalid, disabled, secureTextEntry, leadingIcon, defaultValue }) => (
      <TextInput
        size={size}
        invalid={invalid}
        disabled={disabled}
        secureTextEntry={secureTextEntry}
        leadingIcon={leadingIcon}
        defaultValue={defaultValue}
      />
    ),
  }
);
