import React from "react";
import figma from "@figma/code-connect";
import { Badge } from "./Badge";

figma.connect(
  Badge,
  "https://www.figma.com/design/VQ49OXLtAbwlBBFABLEjrN/x?node-id=49-114",
  {
    props: {
      variant: figma.enum("Variant", {
        soft: "soft",
        solid: "solid",
        outline: "outline",
        dot: "dot",
      }),
      tone: figma.enum("Tone", {
        neutral: "neutral",
        brand: "brand",
        success: "success",
        warning: "warning",
        danger: "danger",
        info: "info",
      }),
      size: figma.enum("Size", { xs: "xs", sm: "sm", md: "md" }),
      withDot: figma.boolean("With dot"),
      leadingIcon: figma.instance("Leading icon swap"),
      children: figma.string("Label"),
    },
    example: ({ variant, tone, size, withDot, leadingIcon, children }) => (
      <Badge variant={variant} tone={tone} size={size} withDot={withDot} leadingIcon={leadingIcon}>
        {children}
      </Badge>
    ),
  }
);
