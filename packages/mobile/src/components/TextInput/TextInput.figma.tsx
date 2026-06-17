import React from "react";
import figma from "@figma/code-connect";
import { TextInput } from "./TextInput";

figma.connect(
  TextInput,
  "https://www.figma.com/design/VQ49OXLtAbwlBBFABLEjrN/x?node-id=79-114",
  {
    props: {
      size: figma.enum("Size", { SM: "sm", MD: "md", LG: "lg" }),
      invalid: figma.enum("Status", { Error: true }),
      disabled: figma.enum("Status", { Disabled: true }),
      clearable: figma.boolean("Clearable"),
      secureTextEntry: figma.boolean("Masked"),
      leadingIcon: figma.instance("Leading icon"),
      trailingIcon: figma.instance("Trailing icon"),
      placeholder: figma.string("Placeholder"),
      value: figma.string("Value"),
    },
    example: ({ size, invalid, disabled, clearable, secureTextEntry, leadingIcon, trailingIcon, placeholder, value }) => (
      <TextInput
        size={size}
        invalid={invalid}
        disabled={disabled}
        clearable={clearable}
        secureTextEntry={secureTextEntry}
        leadingIcon={leadingIcon}
        trailingIcon={trailingIcon}
        placeholder={placeholder}
        defaultValue={value}
      />
    ),
  }
);
