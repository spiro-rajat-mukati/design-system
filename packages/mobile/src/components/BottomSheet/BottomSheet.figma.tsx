import React from "react";
import figma from "@figma/code-connect";
import { BottomSheet } from "./BottomSheet";

figma.connect(
  BottomSheet,
  "https://www.figma.com/design/VQ49OXLtAbwlBBFABLEjrN/x?node-id=106-129",
  {
    props: {},
    example: () => (
      <BottomSheet
        visible={true}
        onClose={() => {}}
        title="Title"
        snapPoints={["50%", "90%"]}
      >
        {null}
      </BottomSheet>
    ),
  }
);
