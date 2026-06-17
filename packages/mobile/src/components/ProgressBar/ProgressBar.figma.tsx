import React from "react";
import figma from "@figma/code-connect";
import { ProgressBar } from "./ProgressBar";

figma.connect(
  ProgressBar,
  "https://www.figma.com/design/VQ49OXLtAbwlBBFABLEjrN/x?node-id=92-114",
  {
    props: {
      tone: figma.enum("Tone", {
        Brand: "brand",
        Success: "success",
        Warning: "warning",
        Danger: "danger",
      }),
      size: figma.enum("Size", { XS: "xs", SM: "sm", MD: "md", LG: "lg" }),
      indeterminate: figma.boolean("Indeterminate"),
      showValue: figma.boolean("Show value"),
      label: figma.string("Label"),
      showLabel: figma.boolean("Show label"),
    },
    example: ({ tone, size, indeterminate, showValue, label }) => (
      <ProgressBar
        tone={tone}
        size={size}
        indeterminate={indeterminate}
        showValue={showValue}
        label={label}
        value={60}
        max={100}
      />
    ),
  }
);
