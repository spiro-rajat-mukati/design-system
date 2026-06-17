import React from "react";
import figma from "@figma/code-connect";
import { ToastProvider } from "./ToastContext";

figma.connect(
  ToastProvider,
  "https://www.figma.com/design/VQ49OXLtAbwlBBFABLEjrN/x?node-id=100-160",
  {
    props: {
      tone: figma.enum("Tone", {
        Neutral: "neutral",
        Info: "info",
        Success: "success",
        Warning: "warning",
        Danger: "danger",
      }),
      title: figma.string("Title"),
      message: figma.string("Message"),
      showMessage: figma.boolean("Show message"),
    },
    example: ({ tone, title, message }) => (
      // Wrap your screen in ToastProvider; call useToast().show({ tone, title, message })
      // to trigger a toast programmatically.
      <ToastProvider>{null}</ToastProvider>
    ),
  }
);
