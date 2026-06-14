import React, { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-webpack5";
import { Field } from "../components/Field/Field.tsx";
import { TextInput } from "../components/TextInput/TextInput.tsx";
import { Textarea } from "../components/Textarea/Textarea.tsx";
import { Select } from "../components/Select/Select.tsx";
import { Checkbox } from "../components/Checkbox/Checkbox.tsx";
import { RadioGroup } from "../components/Radio/Radio.tsx";
import { Button } from "../components/Button/Button.tsx";
import { ButtonGroup } from "../components/ButtonGroup/ButtonGroup.tsx";

const meta: Meta = {
  title: "Design System/Responsive",
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Real form rendered at three viewports (mobile, tablet, desktop).",
      },
    },
  },
};
export default meta;
type Story = StoryObj;

const Form = () => {
  const [country, setCountry] = useState<string | null>("us");
  return (
    <form
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "var(--space-4)",
        maxWidth: 480,
        marginInline: "auto",
        padding: "var(--space-6)",
      }}
      onSubmit={(e) => e.preventDefault()}
    >
      <h2
        style={{
          fontSize: "var(--text-web-display-s-size)",
          lineHeight: "var(--text-web-display-s-line)",
          fontWeight: "var(--text-web-display-s-weight)",
          margin: 0,
        }}
      >
        Create your account
      </h2>

      <Field label="Full name" required>
        <TextInput placeholder="Jane Doe" />
      </Field>

      <Field label="Email" required helperText="We'll send a confirmation link.">
        <TextInput type="email" placeholder="jane@example.com" />
      </Field>

      <Field label="Country" required>
        <Select
          value={country}
          onChange={setCountry}
          options={[
            { value: "us", label: "United States" },
            { value: "uk", label: "United Kingdom" },
            { value: "de", label: "Germany" },
            { value: "in", label: "India" },
          ]}
        />
      </Field>

      <Field label="Plan">
        <RadioGroup
          name="plan"
          defaultValue="pro"
          orientation="horizontal"
          options={[
            { value: "free", label: "Free" },
            { value: "pro",  label: "Pro" },
            { value: "team", label: "Team" },
          ]}
        />
      </Field>

      <Field label="Notes (optional)">
        <Textarea rows={3} placeholder="Anything else we should know?" />
      </Field>

      <Checkbox label="Email me product updates" />

      <ButtonGroup aria-label="Submit">
        <Button variant="secondary" fullWidth>Cancel</Button>
        <Button fullWidth>Create account</Button>
      </ButtonGroup>
    </form>
  );
};

export const Mobile: Story = {
  render: () => <Form />,
  parameters: { viewport: { defaultViewport: "mobile" } },
};

export const Tablet: Story = {
  render: () => <Form />,
  parameters: { viewport: { defaultViewport: "tablet" } },
};

export const Desktop: Story = {
  render: () => <Form />,
  parameters: { viewport: { defaultViewport: "desktop" } },
};

/** Quick visual reference for all token-driven heights. */
export const TouchTargets: Story = {
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)", maxWidth: 360, marginInline: "auto" }}>
      <Field label="Small input"><TextInput size="sm" placeholder="32px" /></Field>
      <Field label="Medium input"><TextInput size="md" placeholder="40px" /></Field>
      <Field label="Large input"><TextInput size="lg" placeholder="48px" /></Field>
      <div style={{ display: "flex", gap: "var(--space-2)", flexWrap: "wrap" }}>
        <Button size="sm">sm</Button>
        <Button size="md">md</Button>
        <Button size="lg">lg</Button>
      </div>
      <p style={{ color: "var(--color-text-tertiary)", fontSize: "var(--font-size-100)", margin: 0 }}>
        Token-driven heights: sm 32px · md 40px · lg 48px.
      </p>
    </div>
  ),
};
