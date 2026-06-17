import React from "react";
import figma from "@figma/code-connect";
import { Menu } from "./Menu";
import { Button } from "../Button/Button";

figma.connect(
  Menu,
  "https://www.figma.com/design/EAv9Vx2mFoBo4wXTVzP0Lv/x?node-id=2-5608",
  {
    props: {},
    example: () => (
      <Menu
        trigger={<Button>Open menu</Button>}
        items={[
          { kind: "item", id: "action", label: "Action", onSelect: () => {} },
          { kind: "divider", id: "div" },
          { kind: "item", id: "delete", label: "Delete", destructive: true, onSelect: () => {} },
        ]}
      />
    ),
  }
);
