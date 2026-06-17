import React from "react";
import figma from "@figma/code-connect";
import { ProgressBar } from "./ProgressBar";

figma.connect(
  ProgressBar,
  "https://www.figma.com/design/VQ49OXLtAbwlBBFABLEjrN/x?node-id=92-114",
  {
    props: {
      tone: figma.enum("Tone", {
        brand: "brand",
        success: "success",
        warning: "warning",
        danger: "danger",
      }),
      size: figma.enum("Size", { xs: "xs", sm: "sm", md: "md", lg: "lg" }),
      showValue: figma.boolean("Show value"),
      label: figma.string("Label"),
    },
    example: ({ tone, size, showValue, label }) => (
      <ProgressBar
        tone={tone}
        size={size}
        showValue={showValue}
        label={label}
        value={60}
        max={100}
      />
    ),
  }
);
