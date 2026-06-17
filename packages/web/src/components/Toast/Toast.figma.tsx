import React from "react";
import figma from "@figma/code-connect";
import { ToastProvider } from "./Toast";

figma.connect(
  ToastProvider,
  "https://www.figma.com/design/EAv9Vx2mFoBo4wXTVzP0Lv/x?node-id=2-4493",
  {
    props: {
      tone: figma.enum("tone", {
        info: "info",
        success: "success",
        warning: "warning",
        danger: "danger",
        neutral: "neutral",
      }),
      dismissible: figma.boolean("dismissible"),
    },
    example: ({ tone, dismissible }) => (
      <ToastProvider>
        {null}
      </ToastProvider>
    ),
  }
);
