import React from "react";
import figma from "@figma/code-connect";
import { ButtonGroup } from "./ButtonGroup";
import { Button } from "../Button/Button";

figma.connect(
  ButtonGroup,
  "https://www.figma.com/design/EAv9Vx2mFoBo4wXTVzP0Lv/x?node-id=2-2877",
  {
    props: {
      size: figma.enum("size", { sm: "sm", md: "md", lg: "lg" }),
    },
    example: ({ size }) => (
      <ButtonGroup size={size}>
        <Button>Action</Button>
        <Button>Action</Button>
      </ButtonGroup>
    ),
  }
);
