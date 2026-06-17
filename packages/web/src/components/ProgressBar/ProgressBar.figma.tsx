import React from "react";
import figma from "@figma/code-connect";
import { ProgressBar } from "./ProgressBar";

figma.connect(
  ProgressBar,
  "https://www.figma.com/design/EAv9Vx2mFoBo4wXTVzP0Lv/x?node-id=2-5871",
  {
    props: {
      size: figma.enum("size", { xs: "xs", sm: "sm", md: "md", lg: "lg" }),
      tone: figma.enum("tone", {
        brand: "brand",
        success: "success",
        warning: "warning",
        danger: "danger",
      }),
      showPercentage: figma.boolean("showPercentage"),
    },
    example: ({ size, tone, showPercentage }) => (
      <ProgressBar
        size={size}
        tone={tone}
        showPercentage={showPercentage}
        label="Loading"
        value={75}
        max={100}
      />
    ),
  }
);
