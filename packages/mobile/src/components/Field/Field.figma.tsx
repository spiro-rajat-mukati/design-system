import React from "react";
import figma from "@figma/code-connect";
import { Field } from "./Field";
import { TextInput } from "../TextInput/TextInput";

figma.connect(
  Field,
  "https://www.figma.com/design/VQ49OXLtAbwlBBFABLEjrN/x?node-id=69-114",
  {
    props: {
      label: figma.string("Label"),
      description: figma.string("Description"),
      helperText: figma.string("Footer text"),
      required: figma.boolean("Required"),
      disabled: figma.boolean("Disabled"),
    },
    example: ({ label, description, helperText, required, disabled }) => (
      <Field
        label={label}
        description={description}
        helperText={helperText}
        required={required}
        disabled={disabled}
      >
        <TextInput />
      </Field>
    ),
  }
);
