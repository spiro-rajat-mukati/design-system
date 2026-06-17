import React from "react";
import figma from "@figma/code-connect";
import { ButtonGroup } from "./ButtonGroup";
import { Button } from "../Button/Button";

figma.connect(
  ButtonGroup,
  "https://www.figma.com/design/EAv9Vx2mFoBo4wXTVzP0Lv/x?node-id=2-2877",
  {
    props: {
      variant: figma.enum("Variant", {
        Primary: "primary",
        Secondary: "secondary",
        Tertiary: "tertiary",
      }),
      size: figma.enum("Size", {
        XS: "xs",
        SM: "sm",
        MD: "md",
        LG: "lg",
        XL: "xl",
      }),
    },
    example: ({ variant, size }) => (
      <ButtonGroup variant={variant} size={size}>
        <Button>Action</Button>
        <Button>Action</Button>
      </ButtonGroup>
    ),
  }
);
