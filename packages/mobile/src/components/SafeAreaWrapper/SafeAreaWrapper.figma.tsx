import React from "react";
import figma from "@figma/code-connect";
import { SafeAreaWrapper } from "./SafeAreaWrapper";

figma.connect(
  SafeAreaWrapper,
  "https://www.figma.com/design/VQ49OXLtAbwlBBFABLEjrN/x?node-id=106-135",
  {
    props: {},
    example: () => (
      <SafeAreaWrapper edges={["top", "bottom"]}>
        {null}
      </SafeAreaWrapper>
    ),
  }
);
