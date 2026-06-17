import React from "react";
import figma from "@figma/code-connect";
import { Textarea } from "./Textarea";

figma.connect(
  Textarea,
  "https://www.figma.com/design/EAv9Vx2mFoBo4wXTVzP0Lv/x?node-id=2-3511",
  {
    props: {
      invalid: figma.enum("state", { error: true }),
      disabled: figma.enum("state", { disabled: true }),
      showCount: figma.boolean("showCount"),
    },
    example: ({ invalid, disabled, showCount }) => (
      <Textarea invalid={invalid} disabled={disabled} showCount={showCount} />
    ),
  }
);
