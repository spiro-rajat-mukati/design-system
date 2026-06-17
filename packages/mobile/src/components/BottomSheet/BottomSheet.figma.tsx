import React from "react";
import figma from "@figma/code-connect";
import { BottomSheet } from "./BottomSheet";

figma.connect(
  BottomSheet,
  "https://www.figma.com/design/VQ49OXLtAbwlBBFABLEjrN/x?node-id=106-129",
  {
    props: {
      showHandle: figma.boolean("Show handle"),
      title: figma.string("Title"),
      showTitle: figma.boolean("Show title"),
    },
    example: ({ showHandle, title }) => (
      <BottomSheet
        visible={true}
        onClose={() => {}}
        showHandle={showHandle}
        title={title}
        snapPoints={["50%", "90%"]}
      >
        {null}
      </BottomSheet>
    ),
  }
);
