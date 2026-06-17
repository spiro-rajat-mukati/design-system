import React from "react";
import figma from "@figma/code-connect";
import { ProgressBar } from "./ProgressBar";

figma.connect(
  ProgressBar,
  "https://www.figma.com/design/EAv9Vx2mFoBo4wXTVzP0Lv/x?node-id=2-5871",
  {
    props: {
      shape: figma.enum("Shape", { Linear: "linear", Circular: "circular" }),
      size: figma.enum("Size", { XS: "xs", SM: "sm", MD: "md", LG: "lg" }),
      tone: figma.enum("Tone", {
        Brand: "brand",
        Success: "success",
        Warning: "warning",
        Danger: "danger",
      }),
      showPercentage: figma.boolean("Show percentage"),
      showLabel: figma.boolean("Show label"),
      label: figma.string("Label"),
    },
    example: ({ shape, size, tone, showPercentage, label }) => (
      <ProgressBar
        shape={shape}
        size={size}
        tone={tone}
        showPercentage={showPercentage}
        label={label}
        value={75}
        max={100}
      />
    ),
  }
);
