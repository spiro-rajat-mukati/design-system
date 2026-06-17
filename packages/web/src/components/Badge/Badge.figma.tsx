import React from "react";
import figma from "@figma/code-connect";
import { Badge } from "./Badge";

figma.connect(
  Badge,
  "https://www.figma.com/design/EAv9Vx2mFoBo4wXTVzP0Lv/x?node-id=2-2154",
  {
    props: {
      variant: figma.enum("variant", {
        solid: "solid",
        soft: "soft",
        outline: "outline",
        dot: "dot",
      }),
      tone: figma.enum("tone", {
        neutral: "neutral",
        brand: "brand",
        info: "info",
        success: "success",
        warning: "warning",
        danger: "danger",
      }),
      size: figma.enum("size", { xs: "xs", sm: "sm", md: "md" }),
      withDot: figma.boolean("hasDot"),
    },
    example: ({ variant, tone, size, withDot }) => (
      <Badge variant={variant} tone={tone} size={size} withDot={withDot}>
        Label
      </Badge>
    ),
  }
);
