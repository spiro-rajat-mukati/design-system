# Code Connect — authoritative Figma property map (fix reference)

> The hand-authored `.figma.tsx` mappings (PR #65) do **not** match the live Figma components — wrong enum-value casing, `Disabled`/booleans modeled wrong, and several invented props. **Do not publish them as-is.** Rewrite every `.figma.tsx` against the exact property names + variant option strings below (pulled live from the published components on 2026-06-17). Property names and option strings are **case-sensitive and must match exactly**.

## Mapping rules

- **Use the exact `prop` name** (left of any `#` suffix) and the **exact option strings** shown.
- **VARIANT** → `figma.enum("<Name>", { "<exactOption>": <codeValue>, … })`, mapping **every** option. For two-value `["false","true"]` variants you may use `figma.boolean("<Name>")` (Figma treats `false`/`true` variants as boolean) **or** `figma.enum`.
- **BOOLEAN** → `figma.boolean("<Name>")`. **TEXT** → `figma.string("<Name>")`. **INSTANCE_SWAP** → `figma.instance("<Name>")`.
- **Icons (mobile):** the visible toggle is the BOOLEAN `"Leading icon"` / `"Trailing icon"`; the swappable instance is the INSTANCE_SWAP `"Leading icon swap"` / `"Trailing icon swap"`. Map the code's `leadingIcon`/`trailingIcon` prop to `figma.instance("Leading icon swap")`.
- **Map onto the code `Props` only.** Read each `*.types.ts`. If a Figma prop has no code equivalent, **omit it** — never emit a prop not in the interface. Examples: mobile `TextInput`/`Textarea` carry `Label`/`Show label`/`Help text`/`Show help` in Figma, but the code `TextInput`/`Textarea` have **no** label/help props (those live on `Field`) → omit them. Web `state` has visual-only values (`hover`, `focus`, `active`, `focus-visible`, `read-only`) with no code prop → map only the ones that exist (`disabled`, `loading`, `error`, `success`) and omit the rest.
- **No-prop components** (`ActionSheet`, `BottomSheet`, `SafeAreaWrapper`) have zero Figma properties → emit an `example` with no prop bindings.
- After rewriting: `npx figma connect parse` (syntax) **and** spot-check 2–3 in Dev Mode that variant props resolve (not blank) — parse alone does NOT catch name/casing mismatches.

---

## MOBILE — `@kijani/mobile` (fileKey `VQ49OXLtAbwlBBFABLEjrN`)

| Component | Properties (name : type [options]) |
|---|---|
| Button | Label:TEXT · Leading icon:BOOL · Trailing icon:BOOL · Leading icon swap:INSTANCE_SWAP · Trailing icon swap:INSTANCE_SWAP · Variant:VARIANT[primary, secondary, tertiary, destructive, destructive-secondary, link] · Size:VARIANT[xs, sm, md, lg, xl] · State:VARIANT[Default, Pressed, Disabled, Loading] |
| Badge | Label:TEXT · Leading icon:BOOL · With dot:BOOL · Leading icon swap:INSTANCE_SWAP · Variant:VARIANT[soft, solid, outline, dot] · Tone:VARIANT[neutral, brand, success, warning, danger, info] · Size:VARIANT[xs, sm, md] |
| Checkbox | Label:TEXT · Description:TEXT · Show description:BOOL · State:VARIANT[Unchecked, Checked, Indeterminate] · Disabled:VARIANT[false, true] |
| CheckboxGroup | Orientation:VARIANT[vertical, horizontal] |
| Radio | Label:TEXT · Description:TEXT · Show description:BOOL · State:VARIANT[Unchecked, Checked] · Disabled:VARIANT[false, true] |
| RadioGroup | Orientation:VARIANT[vertical, horizontal] |
| Field | Label:TEXT · Description:TEXT · Show description:BOOL · Footer text:TEXT · Required:BOOL · Status:VARIANT[default, error, success] · Disabled:VARIANT[false, true] |
| TextInput | Label:TEXT · Show label:BOOL · Help text:TEXT · Show help:BOOL · Value:TEXT · Leading icon:BOOL · Leading icon swap:INSTANCE_SWAP · Status:VARIANT[Default, Focus, Error, Success, Disabled] · Size:VARIANT[sm, md, lg] · Masked:VARIANT[false, true] |
| Textarea | Label:TEXT · Show label:BOOL · Help text:TEXT · Show help:BOOL · Value:TEXT · Show count:BOOL · Counter:TEXT · Status:VARIANT[Default, Focus, Error, Success, Disabled] |
| Tag | Label:TEXT · Removable:BOOL · Variant:VARIANT[soft, solid, outline] · Tone:VARIANT[neutral, brand, success, warning, danger, info] · Size:VARIANT[sm, md] |
| ProgressBar | Label:TEXT · Show label:BOOL · Value:TEXT · Show value:BOOL · Tone:VARIANT[brand, success, warning, danger] · Size:VARIANT[xs, sm, md, lg] |
| NumericInput | Value:TEXT · Status:VARIANT[Default, Focus, Error, Disabled] · Size:VARIANT[sm, md, lg] |
| SegmentedControl | Tab 1:TEXT · Tab 2:TEXT · Tab 3:TEXT · Size:VARIANT[sm, md, lg] |
| Tabs | Tab 1:TEXT · Tab 2:TEXT · Tab 3:TEXT · Tab 4:TEXT · Variant:VARIANT[underline, pill] · Size:VARIANT[sm, md, lg] |
| Toast | Title:TEXT · Message:TEXT · Show title:BOOL · Tone:VARIANT[neutral, info, success, warning, danger] |
| Select | Value:TEXT · Status:VARIANT[Default, Error, Disabled] · Size:VARIANT[sm, md, lg] |
| MultiSelect | Status:VARIANT[Default, Error, Disabled] · Size:VARIANT[sm, md, lg] |
| ListItem | Title:TEXT · Description:TEXT · Show description:BOOL · Show leading:BOOL · Show trailing:BOOL · Show divider:BOOL · Variant:VARIANT[default, inset] · Disabled:VARIANT[false, true] |
| ActionSheet | (no component properties — example only) |
| BottomSheet | (no component properties — example only) |
| SafeAreaWrapper | (no component properties — example only) |

## WEB — `@kijani/web` (fileKey `EAv9Vx2mFoBo4wXTVzP0Lv`)

> Web props are **all VARIANT**, with code-aligned lowercase names. There are **no** TEXT or INSTANCE_SWAP props — labels/icons are not parameterized in the web Figma library (they're boolean-ish variants like `hasIcon`). So for web, `children` in the example is a literal string, and `figma.string(...)`/`figma.instance(...)` must NOT be used.

| Component | Properties (name : type [options]) |
|---|---|
| Button | variant:VARIANT[primary, secondary, tertiary, destructive, destructive-secondary, link] · size:VARIANT[xs, sm, md, lg, xl] · state:VARIANT[default, hover, active, focus-visible, disabled, loading] · iconOnly:VARIANT[false, true] · fullWidth:VARIANT[false, true] |
| Badge | variant:VARIANT[solid, soft, outline, dot] · tone:VARIANT[neutral, brand, info, success, warning, danger] · size:VARIANT[xs, sm, md] · hasIcon:VARIANT[false, true] · hasDot:VARIANT[false, true] |
| ButtonGroup | size:VARIANT[sm, md, lg] |
| TextInput | size:VARIANT[sm, md, lg] · state:VARIANT[default, hover, focus, error, success, disabled, read-only] · hasLeadingIcon:VARIANT[false, true] · hasTrailingIcon:VARIANT[false, true] · clearable:VARIANT[false, true] |
| Textarea | state:VARIANT[default, focus, error, disabled] · showCount:VARIANT[false, true] |
| NumericInput | size:VARIANT[sm, md, lg] · state:VARIANT[default, focus, error, disabled] · hasUnit:VARIANT[false, true] |
| Radio | state:VARIANT[default, hover, checked, checked-hover, disabled, checked-disabled, focus-visible] · hasDescription:VARIANT[false, true] |
| Checkbox | state:VARIANT[unchecked, checked, indeterminate, disabled, checked-disabled, focus-visible] · hasDescription:VARIANT[false, true] |
| Tag | variant:VARIANT[solid, soft, outline] · tone:VARIANT[neutral, brand, info, success, warning, danger] · size:VARIANT[xs, sm, md] · removable:VARIANT[false, true] · hasIcon:VARIANT[false, true] |
| Toast | tone:VARIANT[info, success, warning, danger, neutral] · hasDescription:VARIANT[false, true] · hasAction:VARIANT[false, true] · dismissible:VARIANT[false, true] |
| Tabs | variant:VARIANT[underline, pill, segmented, enclosed] · size:VARIANT[sm, md, lg] · state:VARIANT[default, hover, active, disabled] · hasIcon:VARIANT[false, true] · hasBadge:VARIANT[false, true] |
| Select | size:VARIANT[sm, md, lg] · state:VARIANT[default, hover, open, focus, disabled, error] |
| MultiSelect | size:VARIANT[sm, md, lg] · state:VARIANT[default, hover, open, focus, disabled, error] · chipCount:VARIANT[none, few, many] |
| Menu | kind:VARIANT[default, destructive, checkbox, submenu] · state:VARIANT[default, hover, focus-visible, disabled] · hasIcon:VARIANT[false, true] · hasShortcut:VARIANT[false, true] |
| ProgressBar | size:VARIANT[xs, sm, md, lg] · tone:VARIANT[brand, success, warning, danger] · hasLabel:VARIANT[false, true] · showPercentage:VARIANT[false, true] |

---

## Per-component mapping notes (the non-obvious ones)

- **Mobile Button / Web Button:** map `State`/`state` → derive code props: `disabled` from the `Disabled`/`disabled` option, `loading` from `Loading`/`loading`; ignore visual-only states (Pressed, hover, active, focus-visible). Mobile uses the icon-swap props for `leadingIcon`/`trailingIcon`; web Button has no icon/label props → `children` is a literal in the example, `iconOnly`/`fullWidth` map via their boolean variants.
- **Mobile TextInput / Textarea:** omit `Label`/`Show label`/`Help text`/`Show help` — not in the code Props (they belong to `Field`). Map `Masked`→`secureTextEntry`, `Status`→`invalid` (Error) / `disabled` (Disabled), `Value`→`defaultValue`, `Size`→`size`.
- **Mobile Checkbox/Radio/Field/ListItem:** `Disabled` is a `false/true` VARIANT → `figma.boolean("Disabled")`. `Status`/`State` map to the real code props (`checked`/`indeterminate`, `invalid`, `variant`, etc.).
- **Mobile Select/MultiSelect/NumericInput:** `Status` includes `Disabled` → map to `disabled`; `Error` → `invalid`/error. No separate `Disabled` boolean exists.
- **Mobile SegmentedControl/Tabs:** the tab labels are `Tab 1..N` TEXT props; map to the `options`/`items` example array literally (these aren't a single code prop).
- **Web Checkbox/Radio:** state encodes checked/disabled/indeterminate in one axis (e.g. `checked-disabled`) → map to the code's `checked`/`disabled`/`indeterminate` booleans by branching on the option.
- **Web Toast/Tabs/Menu:** several axes (`hasAction`, `hasBadge`, `kind`, etc.) — map only those with a code prop; omit purely-visual ones.
