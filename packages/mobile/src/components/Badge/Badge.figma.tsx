import React from "react";
import figma from "@figma/code-connect";
import { Badge } from "./Badge";

figma.connect(
  Badge,
  "https://www.figma.com/design/VQ49OXLtAbwlBBFABLEjrN/x?node-id=49-114",
  {
    props: {
      variant: figma.enum("Variant", {
        Soft: "soft",
        Solid: "solid",
        Outline: "outline",
        Dot: "dot",
      }),
      tone: figma.enum("Tone", {
        Neutral: "neutral",
        Brand: "brand",
        Success: "success",
        Warning: "warning",
        Danger: "danger",
        Info: "info",
      }),
      size: figma.enum("Size", { XS: "xs", SM: "sm", MD: "md" }),
      withDot: figma.boolean("With dot"),
      leadingIcon: figma.instance("Leading icon"),
      children: figma.string("Label"),
    },
    example: ({ variant, tone, size, withDot, leadingIcon, children }) => (
      <Badge variant={variant} tone={tone} size={size} withDot={withDot} leadingIcon={leadingIcon}>
        {children}
      </Badge>
    ),
  }
);
