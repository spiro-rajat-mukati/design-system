import React from "react";
import figma from "@figma/code-connect";
import { Badge } from "./Badge";

figma.connect(
  Badge,
  "https://www.figma.com/design/EAv9Vx2mFoBo4wXTVzP0Lv/x?node-id=2-2154",
  {
    props: {
      variant: figma.enum("Variant", {
        Solid: "solid",
        Soft: "soft",
        Outline: "outline",
        Dot: "dot",
      }),
      tone: figma.enum("Tone", {
        Neutral: "neutral",
        Brand: "brand",
        Info: "info",
        Success: "success",
        Warning: "warning",
        Danger: "danger",
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
