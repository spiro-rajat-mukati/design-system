import React from "react";
import figma from "@figma/code-connect";
import { Tag } from "./Tag";

figma.connect(
  Tag,
  "https://www.figma.com/design/VQ49OXLtAbwlBBFABLEjrN/x?node-id=89-114",
  {
    props: {
      variant: figma.enum("Variant", {
        soft: "soft",
        solid: "solid",
        outline: "outline",
      }),
      tone: figma.enum("Tone", {
        neutral: "neutral",
        brand: "brand",
        success: "success",
        warning: "warning",
        danger: "danger",
        info: "info",
      }),
      size: figma.enum("Size", { sm: "sm", md: "md" }),
      removable: figma.boolean("Removable"),
      label: figma.string("Label"),
    },
    example: ({ variant, tone, size, removable, label }) => (
      <Tag
        variant={variant}
        tone={tone}
        size={size}
        removable={removable}
        label={label}
      />
    ),
  }
);
