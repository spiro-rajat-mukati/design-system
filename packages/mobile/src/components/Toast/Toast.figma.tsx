import React from "react";
import figma from "@figma/code-connect";
import { ToastProvider } from "./ToastContext";

figma.connect(
  ToastProvider,
  "https://www.figma.com/design/VQ49OXLtAbwlBBFABLEjrN/x?node-id=100-160",
  {
    props: {
      tone: figma.enum("Tone", {
        neutral: "neutral",
        info: "info",
        success: "success",
        warning: "warning",
        danger: "danger",
      }),
      title: figma.string("Title"),
      message: figma.string("Message"),
    },
    example: () => (
      <ToastProvider>{null}</ToastProvider>
    ),
  }
);
