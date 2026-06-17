import React from "react";
import figma from "@figma/code-connect";
import { ListItem } from "./ListItem";

figma.connect(
  ListItem,
  "https://www.figma.com/design/VQ49OXLtAbwlBBFABLEjrN/x?node-id=104-150",
  {
    props: {
      variant: figma.enum("Variant", {
        default: "default",
        inset: "inset",
      }),
      showDivider: figma.boolean("Show divider"),
      disabled: figma.boolean("Disabled"),
      title: figma.string("Title"),
      description: figma.string("Description"),
    },
    example: ({ variant, showDivider, disabled, title, description }) => (
      <ListItem
        variant={variant}
        showDivider={showDivider}
        disabled={disabled}
        title={title}
        description={description}
      />
    ),
  }
);
