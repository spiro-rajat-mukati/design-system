import React from "react";
import figma from "@figma/code-connect";
import { Button } from "./Button";

figma.connect(
  Button,
  "https://www.figma.com/design/EAv9Vx2mFoBo4wXTVzP0Lv/x?node-id=2-121",
  {
    props: {
      variant: figma.enum("variant", {
        primary: "primary",
        secondary: "secondary",
        tertiary: "tertiary",
        destructive: "destructive",
        "destructive-secondary": "destructive-secondary",
        link: "link",
      }),
      size: figma.enum("size", {
        xs: "xs",
        sm: "sm",
        md: "md",
        lg: "lg",
        xl: "xl",
      }),
      disabled: figma.enum("state", { disabled: true }),
      loading: figma.enum("state", { loading: true }),
      iconOnly: figma.boolean("iconOnly"),
      fullWidth: figma.boolean("fullWidth"),
    },
    example: ({ variant, size, disabled, loading, iconOnly, fullWidth }) => (
      <Button
        variant={variant}
        size={size}
        disabled={disabled}
        loading={loading}
        iconOnly={iconOnly}
        fullWidth={fullWidth}
      >
        Label
      </Button>
    ),
  }
);
