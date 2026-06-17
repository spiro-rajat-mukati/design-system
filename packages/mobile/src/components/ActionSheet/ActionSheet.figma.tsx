import React from "react";
import figma from "@figma/code-connect";
import { ActionSheet } from "./ActionSheet";

figma.connect(
  ActionSheet,
  "https://www.figma.com/design/VQ49OXLtAbwlBBFABLEjrN/x?node-id=106-114",
  {
    props: {
      title: figma.string("Title"),
      message: figma.string("Message"),
      showTitle: figma.boolean("Show title"),
      showMessage: figma.boolean("Show message"),
      cancelLabel: figma.string("Cancel label"),
    },
    example: ({ title, message, cancelLabel }) => (
      <ActionSheet
        visible={true}
        onClose={() => {}}
        title={title}
        message={message}
        cancelLabel={cancelLabel}
        items={[
          { label: "Action", onPress: () => {} },
        ]}
      />
    ),
  }
);
