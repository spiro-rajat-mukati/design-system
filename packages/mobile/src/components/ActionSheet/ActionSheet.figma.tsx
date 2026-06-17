import React from "react";
import figma from "@figma/code-connect";
import { ActionSheet } from "./ActionSheet";

figma.connect(
  ActionSheet,
  "https://www.figma.com/design/VQ49OXLtAbwlBBFABLEjrN/x?node-id=106-114",
  {
    props: {},
    example: () => (
      <ActionSheet
        visible={true}
        onClose={() => {}}
        title="Title"
        items={[
          { label: "Action", onPress: () => {} },
          { label: "Destructive action", onPress: () => {}, destructive: true },
        ]}
      />
    ),
  }
);
