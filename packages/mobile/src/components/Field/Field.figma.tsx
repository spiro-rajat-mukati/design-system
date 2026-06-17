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
      helperText: figma.string("Helper text"),
      errorText: figma.string("Error text"),
      showLabel: figma.boolean("Show label"),
      showHelperText: figma.boolean("Show helper"),
      required: figma.boolean("Required"),
      disabled: figma.boolean("Disabled"),
    },
    example: ({ label, helperText, errorText, required, disabled }) => (
      <Field
        label={label}
        helperText={helperText}
        errorText={errorText}
        required={required}
        disabled={disabled}
      >
        <TextInput />
      </Field>
    ),
  }
);
