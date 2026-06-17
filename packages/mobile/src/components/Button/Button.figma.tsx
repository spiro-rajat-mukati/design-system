import React from "react";
import figma from "@figma/code-connect";
import { Button } from "./Button";

figma.connect(
  Button,
  "https://www.figma.com/design/VQ49OXLtAbwlBBFABLEjrN/x?node-id=24-114",
  {
    props: {
      variant: figma.enum("Variant", {
        primary: "primary",
        secondary: "secondary",
        tertiary: "tertiary",
        destructive: "destructive",
        "destructive-secondary": "destructive-secondary",
        link: "link",
      }),
      size: figma.enum("Size", {
        xs: "xs",
        sm: "sm",
        md: "md",
        lg: "lg",
        xl: "xl",
      }),
      disabled: figma.enum("State", { Disabled: true }),
      loading: figma.enum("State", { Loading: true }),
      leadingIcon: figma.instance("Leading icon swap"),
      trailingIcon: figma.instance("Trailing icon swap"),
      children: figma.string("Label"),
    },
    example: ({ variant, size, disabled, loading, leadingIcon, trailingIcon, children }) => (
      <Button
        variant={variant}
        size={size}
        disabled={disabled}
        loading={loading}
        leadingIcon={leadingIcon}
        trailingIcon={trailingIcon}
      >
        {children}
      </Button>
    ),
  }
);
