import React, { useState } from "react";
import { View, Text, ScrollView, StyleSheet, Pressable } from "react-native";
import {
  useTheme,
  SafeAreaWrapper,
  Tabs,
  Field,
  TextInput,
  Select,
  Checkbox,
  Button,
  ListItem,
  Badge,
  ProgressBar,
  BottomSheet,
  ErrorState,
  WarningState,
  BatteryCard,
} from "../../src/index";

/**
 * Composed demo SCREENS — for testing component composition and (later) organisms,
 * as opposed to the per-component kitchen sink in App.tsx.
 *
 * Add a new screen function + a Tabs entry below as each organism / screen lands
 * (e.g. the upcoming ErrorState-in-BottomSheet). This is the organism test bed.
 */

function AccountScreen() {
  const { theme } = useTheme();
  return (
    <ScrollView contentContainerStyle={s.body} keyboardShouldPersistTaps="handled">
      <Text style={[s.h1, { color: theme.color.text.primary }]}>Create account</Text>
      <Text style={[s.sub, { color: theme.color.text.secondary }]}>
        Field + inputs + Select + Checkbox + Button composed into a real screen.
      </Text>
      <View style={{ height: 20 }} />

      <Field label="Full name">
        <TextInput placeholder="Ada Lovelace" />
      </Field>
      <View style={{ height: 12 }} />

      <Field label="Email" helperText="We'll never share it.">
        <TextInput placeholder="ada@example.com" keyboardType="email-address" autoCapitalize="none" />
      </Field>
      <View style={{ height: 12 }} />

      <Field label="Country">
        <Select
          options={[
            { value: "in", label: "India" },
            { value: "us", label: "United States" },
            { value: "uk", label: "United Kingdom" },
          ]}
          placeholder="Choose…"
        />
      </Field>
      <View style={{ height: 16 }} />

      <Checkbox label="I agree to the terms & privacy policy" />
      <View style={{ height: 24 }} />

      <Button fullWidth>Create account</Button>
    </ScrollView>
  );
}

function SettingsScreen() {
  const { theme } = useTheme();
  return (
    <ScrollView contentContainerStyle={s.body}>
      <Text style={[s.h1, { color: theme.color.text.primary }]}>Settings</Text>
      <View style={{ height: 16 }} />

      <ListItem
        title="Account"
        description="Profile, email, password"
        trailingContent={<Text style={{ color: theme.color.text.tertiary, fontSize: 18 }}>›</Text>}
        showDivider
        onPress={() => {}}
      />
      <ListItem
        title="Notifications"
        trailingContent={<Badge tone="brand" variant="solid" count={3} />}
        showDivider
        onPress={() => {}}
      />
      <ListItem title="Storage" description="3.2 GB of 5 GB used" showDivider />
      <View style={{ paddingHorizontal: 16, paddingTop: 4, paddingBottom: 8 }}>
        <ProgressBar tone="brand" value={64} />
      </View>
      <ListItem title="Sign out" onPress={() => {}} />
    </ScrollView>
  );
}

function ErrorSheetScreen() {
  const { theme } = useTheme();
  const [open, setOpen] = useState(false);
  const [retrying, setRetrying] = useState(false);
  return (
    <ScrollView contentContainerStyle={s.body}>
      <Text style={[s.h1, { color: theme.color.text.primary }]}>Error sheet</Text>
      <Text style={[s.sub, { color: theme.color.text.secondary }]}>
        The ErrorState organism composed inside a BottomSheet — close button + retry loading.
      </Text>
      <View style={{ height: 20 }} />
      <Button fullWidth onPress={() => setOpen(true)}>
        Show error sheet
      </Button>

      <BottomSheet
        visible={open}
        onClose={() => setOpen(false)}
        showCloseButton
        snapPoints={["55%"]}
      >
        <ErrorState
          title="Couldn't submit details"
          description="Looks like we hit a temporary issue while submitting the details. Please try again."
          primaryAction={{
            label: "Try Again",
            loading: retrying,
            onPress: () => {
              setRetrying(true);
              setTimeout(() => {
                setRetrying(false);
                setOpen(false);
              }, 1200);
            },
          }}
          secondaryAction={{ label: "Go Back", onPress: () => setOpen(false) }}
        />
      </BottomSheet>
    </ScrollView>
  );
}

function WarningSheetScreen() {
  const { theme } = useTheme();
  const [open, setOpen] = useState(false);
  return (
    <ScrollView contentContainerStyle={s.body}>
      <Text style={[s.h1, { color: theme.color.text.primary }]}>Warning sheet</Text>
      <Text style={[s.sub, { color: theme.color.text.secondary }]}>
        WarningState with a “what to do next” steps list, inside a BottomSheet.
      </Text>
      <View style={{ height: 20 }} />
      <Button fullWidth onPress={() => setOpen(true)}>
        Show warning sheet
      </Button>

      <BottomSheet
        visible={open}
        onClose={() => setOpen(false)}
        showCloseButton
        snapPoints={["80%"]}
      >
        <WarningState
          title="Warning Headline"
          description="You can mark this battery as faulty only if it is mapped to your station"
          steps={[
            "Continue with the faulty battery mapping without this battery",
            "After submitting the faulty battery list, scan this battery again & re-map it to your station first",
            "After successful re-mapping, mark this battery as faulty again",
          ]}
          primaryAction={{ label: "Go Back & Review", onPress: () => setOpen(false) }}
          secondaryAction={{ label: "Continue", onPress: () => setOpen(false) }}
        />
      </BottomSheet>
    </ScrollView>
  );
}

function BatteryDemoScreen() {
  const { theme } = useTheme();
  return (
    <ScrollView contentContainerStyle={s.body}>
      <Text style={[s.h1, { color: theme.color.text.primary }]}>Battery card</Text>
      <Text style={[s.sub, { color: theme.color.text.secondary }]}>
        Generated via the kijani-component-generator shakedown — closest Kijani primitives, not exact product art.
      </Text>
      <View style={{ height: 16 }} />
      <BatteryCard name="U7B1LBNL36300660" level={7} context="bike" status="error" />
      <View style={{ height: 16 }} />
      <BatteryCard name="U7B1LBNL36300660" level={64} context="station" status="in-progress" />
      <View style={{ height: 16 }} />
      <BatteryCard name="U7B1LBNL36300660" level="unknown" context="bike" onRemap={() => {}} />
    </ScrollView>
  );
}

export function DemoScreens({ onClose }: { onClose: () => void }) {
  const { theme } = useTheme();
  const [screen, setScreen] = useState("account");
  return (
    <SafeAreaWrapper surface="default" style={{ flex: 1 }}>
      <View
        style={[
          s.bar,
          { borderBottomColor: theme.color.border.subtle, backgroundColor: theme.color.surface.raised },
        ]}
      >
        <Text style={[s.barTitle, { color: theme.color.text.primary }]}>Demo screens</Text>
        <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel="Back to components">
          <Text style={{ color: theme.color.text.link, fontSize: 15 }}>← Components</Text>
        </Pressable>
      </View>

      <View style={{ paddingHorizontal: 16, paddingTop: 12 }}>
        <Tabs
          items={[
            { value: "account", label: "Account" },
            { value: "settings", label: "Settings" },
            { value: "error", label: "Error" },
            { value: "warning", label: "Warning" },
            { value: "battery", label: "Battery" },
          ]}
          value={screen}
          onChange={setScreen}
          variant="pill"
        />
      </View>

      {screen === "account" ? (
        <AccountScreen />
      ) : screen === "settings" ? (
        <SettingsScreen />
      ) : screen === "error" ? (
        <ErrorSheetScreen />
      ) : screen === "warning" ? (
        <WarningSheetScreen />
      ) : (
        <BatteryDemoScreen />
      )}
    </SafeAreaWrapper>
  );
}

const s = StyleSheet.create({
  bar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  barTitle: { fontSize: 17, fontWeight: "600" },
  body: { padding: 16, paddingBottom: 48 },
  h1: { fontSize: 24, fontWeight: "600" },
  sub: { fontSize: 14, marginTop: 4, lineHeight: 20 },
});
