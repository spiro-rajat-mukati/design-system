import React from "react";
import figma from "@figma/code-connect";
import { Tag } from "./Tag";

figma.connect(
  Tag,
  "https://www.figma.com/design/EAv9Vx2mFoBo4wXTVzP0Lv/x?node-id=2-3813",
  {
    props: {
      variant: figma.enum("Variant", {
        Solid: "solid",
        Soft: "soft",
        Outline: "outline",
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
      removable: figma.boolean("Removable"),
      selected: figma.boolean("Selected"),
      leadingIcon: figma.instance("Leading icon"),
      children: figma.string("Label"),
    },
    example: ({ variant, tone, size, removable, selected, leadingIcon, children }) => (
      <Tag
        variant={variant}
        tone={tone}
        size={size}
        removable={removable}
        selected={selected}
        leadingIcon={leadingIcon}
      >
        {children}
      </Tag>
    ),
  }
);
