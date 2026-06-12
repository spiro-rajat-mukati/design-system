import React, { useState } from "react";
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Pressable,
  StatusBar,
} from "react-native";
import {
  ThemeProvider,
  useTheme,
  Button,
  Badge,
  Tag,
  Field,
  TextInput,
  Textarea,
  Checkbox,
  CheckboxGroup,
  Radio,
  RadioGroup,
  type ThemeName,
} from "../src/index";

// ─── Section wrapper ────────────────────────────────────────────────────────

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const { theme } = useTheme();
  return (
    <View style={[styles.section, { borderBottomColor: theme.color.border.subtle }]}>
      <Text
        style={[
          styles.sectionTitle,
          {
            color: theme.color.text.tertiary,
            borderBottomColor: theme.color.border.subtle,
          },
        ]}
      >
        {title}
      </Text>
      {children}
    </View>
  );
}

function Row({ children }: { children: React.ReactNode }) {
  return <View style={styles.row}>{children}</View>;
}

// ─── Showcase screen ────────────────────────────────────────────────────────

function Showcase({ onToggleTheme }: { onToggleTheme: () => void }) {
  const { theme, themeName } = useTheme();
  const bg = theme.color.surface.default;
  const fg = theme.color.text.primary;

  const [textValue, setTextValue] = useState("");
  const [textareaValue, setTextareaValue] = useState("");
  const [checks, setChecks] = useState<string[]>(["b"]);
  const [radio, setRadio] = useState("b");

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: bg }]}>
      <StatusBar barStyle={themeName === "dark" ? "light-content" : "dark-content"} />

      {/* Theme toggle bar */}
      <View style={[styles.themeBar, { backgroundColor: theme.color.surface.raised, borderBottomColor: theme.color.border.subtle }]}>
        <Text style={[styles.appTitle, { color: fg }]}>Kijani Mobile</Text>
        <Pressable
          onPress={onToggleTheme}
          style={[styles.toggleBtn, { backgroundColor: theme.color.action.secondary.bg }]}
          accessibilityRole="button"
          accessibilityLabel={`Switch to ${themeName === "light" ? "dark" : "light"} mode`}
        >
          <Text style={{ color: theme.color.action.secondary.fg, fontSize: 13 }}>
            {themeName === "light" ? "🌙 Dark" : "☀️ Light"}
          </Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={[styles.scroll, { backgroundColor: bg }]}>

        {/* ── Button ───────────────────────────────────────────────────── */}
        <Section title="Button — variants">
          <Row>
            <Button variant="primary" size="md">Primary</Button>
            <Button variant="secondary" size="md">Secondary</Button>
            <Button variant="tertiary" size="md">Tertiary</Button>
          </Row>
          <Row>
            <Button variant="destructive" size="md">Delete</Button>
            <Button variant="destructive-secondary" size="md">Cancel</Button>
            <Button variant="link" size="md">Learn more</Button>
          </Row>
        </Section>

        <Section title="Button — sizes">
          <Row>
            <Button size="xs">XS</Button>
            <Button size="sm">SM</Button>
            <Button size="md">MD</Button>
            <Button size="lg">LG</Button>
            <Button size="xl">XL</Button>
          </Row>
        </Section>

        <Section title="Button — states">
          <Row>
            <Button loading>Saving…</Button>
            <Button disabled>Disabled</Button>
            <Button fullWidth>Full width</Button>
          </Row>
        </Section>

        {/* ── Badge ────────────────────────────────────────────────────── */}
        <Section title="Badge — soft tones">
          <Row>
            {(["neutral","brand","success","warning","danger","info"] as const).map(t => (
              <Badge key={t} tone={t} variant="soft">{t}</Badge>
            ))}
          </Row>
        </Section>

        <Section title="Badge — solid tones">
          <Row>
            {(["neutral","brand","success","warning","danger","info"] as const).map(t => (
              <Badge key={t} tone={t} variant="solid">{t}</Badge>
            ))}
          </Row>
        </Section>

        <Section title="Badge — outline / dot">
          <Row>
            <Badge variant="outline" tone="brand">outline</Badge>
            <Badge variant="dot" tone="danger" accessibilityLabel="3 unread" />
            <Badge count={5} tone="brand" variant="solid" />
            <Badge count={150} tone="danger" variant="solid" />
            <Badge withDot tone="success">Live</Badge>
          </Row>
        </Section>

        {/* ── Tag ──────────────────────────────────────────────────────── */}
        <Section title="Tag — tones">
          <Row>
            {(["neutral","brand","success","warning","danger","info"] as const).map(t => (
              <Tag key={t} label={t} tone={t} />
            ))}
          </Row>
        </Section>

        <Section title="Tag — variants & actions">
          <Row>
            <Tag label="soft" tone="brand" variant="soft" />
            <Tag label="outline" tone="brand" variant="outline" />
            <Tag label="solid" tone="brand" variant="solid" />
          </Row>
          <Row>
            <Tag label="removable" tone="success" removable onRemove={() => {}} />
            <Tag label="pressable" tone="info" onPress={() => {}} />
            <Tag label="disabled" tone="danger" removable disabled />
          </Row>
        </Section>

        {/* ── Field + TextInput ─────────────────────────────────────────── */}
        <Section title="TextInput">
          <Field label="Email" helperText="We'll never share your email.">
            <TextInput
              value={textValue}
              onChangeText={setTextValue}
              placeholder="you@example.com"
              clearable
              onClear={() => setTextValue("")}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </Field>

          <View style={{ height: 12 }} />

          <Field label="Website" description="Include https://">
            <TextInput
              placeholder="example.com"
              prefix="https://"
              suffix=".com"
            />
          </Field>

          <View style={{ height: 12 }} />

          <Field label="Password" errorText="Must be at least 8 characters.">
            <TextInput placeholder="••••••••" secureTextEntry />
          </Field>

          <View style={{ height: 12 }} />

          <Field label="Disabled field">
            <TextInput placeholder="Can't touch this" disabled />
          </Field>
        </Section>

        {/* ── Textarea ─────────────────────────────────────────────────── */}
        <Section title="Textarea">
          <Field label="Notes" helperText="Max 200 characters.">
            <Textarea
              value={textareaValue}
              onChangeText={setTextareaValue}
              placeholder="Start typing…"
              rows={4}
              maxLength={200}
              showCount
            />
          </Field>
        </Section>

        {/* ── Checkbox ─────────────────────────────────────────────────── */}
        <Section title="Checkbox">
          <Row>
            <Checkbox label="Unchecked" />
            <Checkbox label="Checked" defaultChecked />
            <Checkbox label="Indeterminate" indeterminate />
            <Checkbox label="Disabled" disabled />
          </Row>

          <View style={{ height: 16 }} />

          <Text style={[styles.subsectionLabel, { color: theme.color.text.secondary }]}>
            CheckboxGroup
          </Text>
          <CheckboxGroup
            options={[
              { value: "a", label: "Apple", description: "A fruity choice" },
              { value: "b", label: "Banana" },
              { value: "c", label: "Cherry" },
              { value: "d", label: "Disabled option", disabled: true },
            ]}
            value={checks}
            onChange={setChecks}
          />
          <Text style={{ color: theme.color.text.muted, fontSize: 12, marginTop: 8 }}>
            Selected: {checks.join(", ") || "none"}
          </Text>
        </Section>

        {/* ── Radio ────────────────────────────────────────────────────── */}
        <Section title="Radio">
          <Row>
            <Radio label="Unchecked" value="x" />
            <Radio label="Checked" value="y" checked />
            <Radio label="Disabled" value="z" disabled />
          </Row>

          <View style={{ height: 16 }} />

          <Text style={[styles.subsectionLabel, { color: theme.color.text.secondary }]}>
            RadioGroup
          </Text>
          <RadioGroup
            options={[
              { value: "a", label: "Option A", description: "Great choice" },
              { value: "b", label: "Option B" },
              { value: "c", label: "Option C (disabled)", disabled: true },
            ]}
            value={radio}
            onChange={setRadio}
          />
          <Text style={{ color: theme.color.text.muted, fontSize: 12, marginTop: 8 }}>
            Selected: {radio}
          </Text>
        </Section>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Root ────────────────────────────────────────────────────────────────────

export default function App() {
  const [theme, setTheme] = useState<ThemeName>("light");
  return (
    <ThemeProvider forcedTheme={theme}>
      <Showcase onToggleTheme={() => setTheme(t => t === "light" ? "dark" : "light")} />
    </ThemeProvider>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1 },
  themeBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  appTitle: {
    fontSize: 17,
    fontWeight: "600",
  },
  toggleBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  scroll: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 40,
  },
  section: {
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 12,
  },
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    alignItems: "center",
    marginBottom: 8,
  },
  subsectionLabel: {
    fontSize: 13,
    fontWeight: "500",
    marginBottom: 8,
  },
});
