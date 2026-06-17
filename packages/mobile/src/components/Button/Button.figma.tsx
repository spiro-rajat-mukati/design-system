import React from "react";
import figma from "@figma/code-connect";
import { Button } from "./Button";

figma.connect(
  Button,
  "https://www.figma.com/design/VQ49OXLtAbwlBBFABLEjrN/x?node-id=24-114",
  {
    props: {
      variant: figma.enum("Variant", {
        Primary: "primary",
        Secondary: "secondary",
        Tertiary: "tertiary",
        Destructive: "destructive",
        "Destructive Secondary": "destructive-secondary",
        Link: "link",
      }),
      size: figma.enum("Size", {
        XS: "xs",
        SM: "sm",
        MD: "md",
        LG: "lg",
        XL: "xl",
      }),
      loading: figma.enum("State", { Loading: true }),
      disabled: figma.enum("State", { Disabled: true }),
      iconOnly: figma.boolean("Icon only"),
      fullWidth: figma.boolean("Full width"),
      children: figma.string("Label"),
      leadingIcon: figma.instance("Leading icon"),
      trailingIcon: figma.instance("Trailing icon"),
    },
    example: ({ variant, size, loading, disabled, iconOnly, fullWidth, children, leadingIcon, trailingIcon }) => (
      <Button
        variant={variant}
        size={size}
        loading={loading}
        disabled={disabled}
        iconOnly={iconOnly}
        fullWidth={fullWidth}
        leadingIcon={leadingIcon}
        trailingIcon={trailingIcon}
      >
        {children}
      </Button>
    ),
  }
);
