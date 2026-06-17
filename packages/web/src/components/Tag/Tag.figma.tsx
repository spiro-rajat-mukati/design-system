import React from "react";
import figma from "@figma/code-connect";
import { Tag } from "./Tag";

figma.connect(
  Tag,
  "https://www.figma.com/design/EAv9Vx2mFoBo4wXTVzP0Lv/x?node-id=2-3813",
  {
    props: {
      variant: figma.enum("variant", {
        solid: "solid",
        soft: "soft",
        outline: "outline",
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
      removable: figma.boolean("removable"),
    },
    example: ({ variant, tone, size, removable }) => (
      <Tag variant={variant} tone={tone} size={size} removable={removable}>
        Label
      </Tag>
    ),
  }
);
