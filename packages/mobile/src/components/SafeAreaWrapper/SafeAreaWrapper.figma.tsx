import React from "react";
import figma from "@figma/code-connect";
import { SafeAreaWrapper } from "./SafeAreaWrapper";

figma.connect(
  SafeAreaWrapper,
  "https://www.figma.com/design/VQ49OXLtAbwlBBFABLEjrN/x?node-id=106-135",
  {
    props: {
      surface: figma.enum("Surface", {
        Default: "default",
        Raised: "raised",
        Sunken: "sunken",
        Inverse: "inverse",
        Brand: "brand",
      }),
    },
    example: ({ surface }) => (
      <SafeAreaWrapper surface={surface} edges={["top", "bottom"]}>
        {null}
      </SafeAreaWrapper>
    ),
  }
);
