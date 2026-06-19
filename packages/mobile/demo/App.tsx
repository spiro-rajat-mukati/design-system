import React, { useState } from "react";
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  Pressable,
  StatusBar,
} from "react-native";
import {
  ThemeProvider,
  useTheme,
  Button,
  Badge,
  Tag,
  ProgressBar,
  NumericInput,
  SegmentedControl,
  Tabs,
  ToastProvider,
  useToast,
  Select,
  MultiSelect,
  ActionSheet,
  SafeAreaWrapper,
  ListItem,
  BottomSheet,
  Field,
  TextInput,
  Textarea,
  Checkbox,
  CheckboxGroup,
  Radio,
  RadioGroup,
  type ThemeName,
} from "../src/index";
import { DemoScreens } from "./screens/DemoScreens";

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

function ToastTriggerSection() {
  const { show } = useToast();
  return (
    <Section title="Toast">
      <Row>
        {(["neutral", "info", "success", "warning", "danger"] as const).map((tone) => (
          <Button
            key={tone}
            size="sm"
            variant="secondary"
            onPress={() => show({ tone, message: `${tone} toast`, title: tone.charAt(0).toUpperCase() + tone.slice(1) })}
          >
            {tone}
          </Button>
        ))}
      </Row>
    </Section>
  );
}

function BottomSheetDemo() {
  const { theme } = useTheme();
  const [sheet1, setSheet1] = useState(false);
  const [sheet2, setSheet2] = useState(false);
  return (
    <Section title="BottomSheet">
      <Row>
        <Button size="sm" onPress={() => setSheet1(true)}>Two snap points</Button>
        <Button size="sm" variant="secondary" onPress={() => setSheet2(true)}>No handle</Button>
      </Row>

      <BottomSheet
        visible={sheet1}
        onClose={() => setSheet1(false)}
        snapPoints={["40%", "80%"]}
        title="Snap points"
        testID="demo-bs-1"
      >
        <View style={{ padding: 16 }}>
          <Text style={{ color: theme.color.text.primary, marginBottom: 8 }}>
            Drag the handle up to expand to 80%, or down to snap back to 40%. Drag below 40% to close.
          </Text>
          <Button onPress={() => setSheet1(false)}>Close</Button>
        </View>
      </BottomSheet>

      <BottomSheet
        visible={sheet2}
        onClose={() => setSheet2(false)}
        showHandle={false}
        snapPoints={["60%"]}
        title="No handle — tap backdrop to close"
        testID="demo-bs-2"
      >
        <View style={{ padding: 16 }}>
          <Text style={{ color: theme.color.text.secondary, fontSize: 13 }}>
            closeOnBackdrop=true (default). Tap outside to dismiss.
          </Text>
        </View>
      </BottomSheet>
    </Section>
  );
}

function Showcase({ onToggleTheme, onOpenDemos }: { onToggleTheme: () => void; onOpenDemos: () => void }) {
  const { theme, themeName } = useTheme();
  const bg = theme.color.surface.default;
  const fg = theme.color.text.primary;

  const [textValue, setTextValue] = useState("");
  const [textareaValue, setTextareaValue] = useState("");
  const [checks, setChecks] = useState<string[]>(["b"]);
  const [radio, setRadio] = useState("b");
  const [sheetVisible, setSheetVisible] = useState(false);

  return (
    <SafeAreaWrapper surface="default" style={styles.safe}>
      <StatusBar barStyle={themeName === "dark" ? "light-content" : "dark-content"} />

      {/* Theme toggle bar */}
      <View style={[styles.themeBar, { backgroundColor: theme.color.surface.raised, borderBottomColor: theme.color.border.subtle }]}>
        <Text style={[styles.appTitle, { color: fg }]}>Kijani Mobile</Text>
        <View style={{ flexDirection: "row", gap: 8 }}>
          <Pressable
            onPress={onOpenDemos}
            style={[styles.toggleBtn, { backgroundColor: theme.color.action.secondary.bg }]}
            accessibilityRole="button"
            accessibilityLabel="Open demo screens"
          >
            <Text style={{ color: theme.color.action.secondary.fg, fontSize: 13 }}>Screens →</Text>
          </Pressable>
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

        {/* ── ProgressBar ──────────────────────────────────────────────── */}
        <Section title="ProgressBar — tones">
          <ProgressBar label="Brand" tone="brand" value={60} showValue />
          <View style={{ height: 10 }} />
          <ProgressBar label="Success" tone="success" value={80} showValue />
          <View style={{ height: 10 }} />
          <ProgressBar label="Warning" tone="warning" value={40} showValue />
          <View style={{ height: 10 }} />
          <ProgressBar label="Danger" tone="danger" value={25} showValue />
        </Section>

        <Section title="ProgressBar — sizes & indeterminate">
          <Row>
            {(["xs","sm","md","lg"] as const).map(s => (
              <View key={s} style={{ flex: 1 }}>
                <Text style={{ color: theme.color.text.muted, fontSize: 11, marginBottom: 4 }}>{s}</Text>
                <ProgressBar size={s} value={65} />
              </View>
            ))}
          </Row>
          <View style={{ height: 10 }} />
          <ProgressBar label="Loading…" indeterminate />
        </Section>

        {/* ── NumericInput ─────────────────────────────────────────────── */}
        <Section title="NumericInput">
          <Field label="Quantity" helperText="Min 1, max 99">
            <NumericInput defaultValue={1} min={1} max={99} />
          </Field>
          <View style={{ height: 12 }} />
          <Field label="Step 5">
            <NumericInput defaultValue={0} step={5} min={0} max={50} />
          </Field>
          <View style={{ height: 12 }} />
          <Field label="Disabled">
            <NumericInput defaultValue={10} disabled />
          </Field>
        </Section>

        {/* ── SegmentedControl ─────────────────────────────────────────── */}
        <Section title="SegmentedControl">
          <SegmentedControl
            options={[
              { value: "all", label: "All" },
              { value: "active", label: "Active" },
              { value: "done", label: "Done" },
            ]}
            defaultValue="all"
          />
          <View style={{ height: 10 }} />
          <SegmentedControl
            options={[
              { value: "day", label: "Day" },
              { value: "week", label: "Week" },
              { value: "month", label: "Month" },
              { value: "year", label: "Year", disabled: true },
            ]}
            defaultValue="week"
            size="sm"
          />
        </Section>

        {/* ── Tabs ─────────────────────────────────────────────────────── */}
        <Section title="Tabs — underline">
          <Tabs
            items={[
              { value: "overview", label: "Overview" },
              { value: "activity", label: "Activity" },
              { value: "settings", label: "Settings" },
              { value: "archive", label: "Archive", disabled: true },
            ]}
            defaultValue="overview"
            variant="underline"
          />
        </Section>

        <Section title="Tabs — pill">
          <Tabs
            items={[
              { value: "day", label: "Day" },
              { value: "week", label: "Week" },
              { value: "month", label: "Month" },
            ]}
            defaultValue="week"
            variant="pill"
          />
        </Section>

        {/* ── Toast ────────────────────────────────────────────────────── */}
        <ToastTriggerSection />

        {/* ── Select ───────────────────────────────────────────────────── */}
        <Section title="Select">
          <Field label="Fruit">
            <Select
              options={[
                { value: "apple", label: "Apple" },
                { value: "banana", label: "Banana" },
                { value: "cherry", label: "Cherry" },
                { value: "durian", label: "Durian (unavailable)", disabled: true },
              ]}
              placeholder="Choose a fruit…"
            />
          </Field>
          <View style={{ height: 12 }} />
          <Field label="Disabled select">
            <Select
              options={[{ value: "x", label: "Option" }]}
              defaultValue="x"
              disabled
            />
          </Field>
        </Section>

        {/* ── MultiSelect ──────────────────────────────────────────────── */}
        <Section title="MultiSelect">
          <Field label="Skills">
            <MultiSelect
              options={[
                { value: "ts", label: "TypeScript" },
                { value: "rn", label: "React Native" },
                { value: "gql", label: "GraphQL" },
                { value: "rust", label: "Rust", disabled: true },
              ]}
              placeholder="Pick skills…"
            />
          </Field>
          <View style={{ height: 12 }} />
          <Field label="Max 2 tags">
            <MultiSelect
              options={[
                { value: "a", label: "Alpha" },
                { value: "b", label: "Beta" },
                { value: "c", label: "Gamma" },
              ]}
              defaultValue={["a"]}
              maxSelections={2}
              placeholder="Pick up to 2…"
            />
          </Field>
        </Section>

        {/* ── ActionSheet ──────────────────────────────────────────────── */}
        <Section title="ActionSheet">
          <Button variant="secondary" onPress={() => setSheetVisible(true)}>
            Open action sheet
          </Button>
          <ActionSheet
            visible={sheetVisible}
            onClose={() => setSheetVisible(false)}
            title="File options"
            message="Choose an action for this file"
            items={[
              { label: "Rename", onPress: () => {} },
              { label: "Move to folder", onPress: () => {} },
              { label: "Share", onPress: () => {} },
              { label: "Delete", onPress: () => {}, destructive: true },
              { label: "Archived (disabled)", onPress: () => {}, disabled: true },
            ]}
          />
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

        {/* ── ListItem ─────────────────────────────────────────────────── */}
        <Section title="ListItem">
          <ListItem
            title="Press me"
            description="This item has a description and a chevron"
            trailingContent={<Text style={{ color: theme.color.text.tertiary, fontSize: 18 }}>›</Text>}
            showDivider
            onPress={() => {}}
          />
          <ListItem
            title="With leading icon"
            leadingContent={<View style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: theme.color.brand["100"], alignItems: "center", justifyContent: "center" }}><Text style={{ color: theme.color.brand["700"] }}>★</Text></View>}
            trailingContent={<Badge tone="success" variant="soft" size="xs">New</Badge>}
            showDivider
            variant="inset"
            onPress={() => {}}
          />
          <ListItem
            title="Static row (no press)"
            description="No onPress, renders as View"
            showDivider
          />
          <ListItem
            title="Disabled row"
            description="Cannot be pressed"
            onPress={() => {}}
            disabled
          />
        </Section>

        {/* ── BottomSheet ──────────────────────────────────────────────── */}
        <BottomSheetDemo />

        {/* ── SafeAreaWrapper ──────────────────────────────────────────── */}
        <Section title="SafeAreaWrapper — surfaces">
          <Text style={{ color: theme.color.text.secondary, fontSize: 13, marginBottom: 10 }}>
            The whole screen is already wrapped in a SafeAreaWrapper (surface=&quot;default&quot;). Below are the available surface tokens:
          </Text>
          <Row>
            {(["default","raised","sunken","brand","inverse"] as const).map(s => (
              <SafeAreaWrapper key={s} surface={s} edges={[]} style={{ paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6, flex: undefined }}>
                <Text style={{ fontSize: 11, fontWeight: "500", color: s === "inverse" || s === "brand" ? theme.color.text.inverse : theme.color.text.secondary }}>
                  {s}
                </Text>
              </SafeAreaWrapper>
            ))}
          </Row>
        </Section>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaWrapper>
  );
}

// ─── Root ────────────────────────────────────────────────────────────────────

export default function App() {
  const [theme, setTheme] = useState<ThemeName>("light");
  const [view, setView] = useState<"components" | "demos">("components");
  return (
    <ThemeProvider forcedTheme={theme}>
      <ToastProvider>
        {view === "components" ? (
          <Showcase
            onToggleTheme={() => setTheme((t) => (t === "light" ? "dark" : "light"))}
            onOpenDemos={() => setView("demos")}
          />
        ) : (
          <DemoScreens onClose={() => setView("components")} />
        )}
      </ToastProvider>
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
