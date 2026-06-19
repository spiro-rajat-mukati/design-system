import React from "react";
import figma from "@figma/code-connect";
import { ErrorState } from "./ErrorState";

// Figma: Kijani — Mobile › "Error" (node 169:846).
// The Figma component only exposes a `secondaryAction` boolean. Everything else
// (sheet chrome, buttons) is intentionally divergent — see ErrorState.spec.json
// `codeConnect` for the full mapping + divergences.
figma.connect(
  ErrorState,
  "https://www.figma.com/design/VQ49OXLtAbwlBBFABLEjrN/Kijani-Mobile?node-id=169-846",
  {
    props: {
      secondaryAction: figma.boolean("secondaryAction"),
    },
    example: ({ secondaryAction }) => (
      <ErrorState
        title="Error Headline"
        description="Looks like we hit a temporary issue while submitting the details. Please try again."
        primaryAction={{ label: "Try Again", onPress: () => {} }}
        secondaryAction={
          secondaryAction ? { label: "Go Back", onPress: () => {} } : undefined
        }
      />
    ),
  },
);
