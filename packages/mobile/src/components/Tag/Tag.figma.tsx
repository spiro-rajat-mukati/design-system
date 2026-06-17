import React from "react";
import figma from "@figma/code-connect";
import { Tag } from "./Tag";

figma.connect(
  Tag,
  "https://www.figma.com/design/VQ49OXLtAbwlBBFABLEjrN/x?node-id=89-114",
  {
    props: {
      variant: figma.enum("Variant", {
        Soft: "soft",
        Outline: "outline",
        Solid: "solid",
      }),
      tone: figma.enum("Tone", {
        Neutral: "neutral",
        Brand: "brand",
        Success: "success",
        Warning: "warning",
        Danger: "danger",
        Info: "info",
      }),
      size: figma.enum("Size", { SM: "sm", MD: "md" }),
      removable: figma.boolean("Removable"),
      disabled: figma.boolean("Disabled"),
      label: figma.string("Label"),
    },
    example: ({ variant, tone, size, removable, disabled, label }) => (
      <Tag
        variant={variant}
        tone={tone}
        size={size}
        removable={removable}
        disabled={disabled}
        label={label}
      />
    ),
  }
);
