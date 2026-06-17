import React from "react";
import figma from "@figma/code-connect";
import { ToastProvider, useToast } from "./Toast";

// Toast is triggered imperatively. Map the Figma component set to ToastProvider
// so Dev Mode shows the setup wrapper + hook usage.
figma.connect(
  ToastProvider,
  "https://www.figma.com/design/EAv9Vx2mFoBo4wXTVzP0Lv/x?node-id=2-4493",
  {
    props: {
      tone: figma.enum("Tone", {
        Info: "info",
        Success: "success",
        Warning: "warning",
        Danger: "danger",
        Neutral: "neutral",
      }),
      dismissible: figma.boolean("Dismissible"),
      title: figma.string("Title"),
    },
    example: ({ tone, title }) => (
      // Wrap your app with ToastProvider; call useToast() to trigger toasts.
      <ToastProvider>
        {/* useToast().toast({ tone, title }) */}
      </ToastProvider>
    ),
  }
);
