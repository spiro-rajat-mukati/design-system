import React from "react";
import figma from "@figma/code-connect";
import { WarningState } from "./WarningState";

// Figma: Kijani — Mobile › "Warning" (node 178:369).
// The Figma component exposes a `helpTips` boolean that toggles the numbered
// steps list — mapped to the presence of the `steps` array. Sheet chrome and
// the close button are intentionally divergent (BottomSheet owns them); the
// Figma buttons are already real <Button> instances. See WarningState.spec.json.
figma.connect(
  WarningState,
  "https://www.figma.com/design/VQ49OXLtAbwlBBFABLEjrN/Kijani-Mobile?node-id=178-369",
  {
    props: {
      helpTips: figma.boolean("helpTips"),
    },
    example: ({ helpTips }) => (
      <WarningState
        title="Warning Headline"
        description="You can mark this battery as faulty only if it is mapped to your station"
        steps={
          helpTips
            ? [
                "Continue with the faulty battery mapping without this battery",
                "After submitting faulty battery list, scan this battery again & re-map it your station first",
                "After successful re-mapping, mark this battery as faulty battery again",
              ]
            : undefined
        }
        primaryAction={{ label: "Go Back & Review", onPress: () => {} }}
        secondaryAction={{ label: "Continue", onPress: () => {} }}
      />
    ),
  },
);
