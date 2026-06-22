---
name: kijani-component-generator
description: Convert a Figma organism/component into a dev-ready @kijani component. Interviews you for the gaps Figma can't show, writes {Name}.spec.json, runs the deterministic scaffolder, builds the Figma designer spec frame, verifies, and commits — pausing at approve-gates. Use when turning a Figma node into a coded component, building an organism, reconciling a Figma component into code, or when the user says "Kijani component generator", "generate a component", "build this Figma component", "new organism", or pastes a Figma component URL to implement.
---

# Kijani Component Generator — Figma → dev-ready @kijani component

Orchestrates the D19 intake gate + D20 spec frame. The **deterministic** work is done by
the scaffolder (`tools/kijani-component-generator/scaffold.mjs`); you (the agent) do only the judgment
bits and stop at the three approve-gates. The DesignSync plugin is NOT involved in
generation — it only does drift + Code Connect (D5).

## Input
A Figma node URL for a design file (`/design/{fileKey}/...?node-id={id}`).

## Steps

1. **Read Figma.** Load `figma-use` only if you'll write to Figma later. Call the read
   tools on the node: `get_metadata`, `get_design_context`, `get_variable_defs`,
   `get_code_connect_map`. Note token bindings, variants, nested Code-Connected
   instances, and what is *chrome* (belongs to a container) vs *content*.

2. **Classify.** tier (atom / molecule / organism-generic / pattern / template), domain
   (generic → `@kijani`, product → app), platform(s). This sets `meta.location`.

3. **Dedup — APPROVE-GATE 1.** Search `packages/*/src/components`. Is this genuinely new,
   or a variant/extension of an existing component? If it's a variant, STOP and extend the
   existing one. Surface the call to the user before continuing.

4. **Interview the gaps.** Using `docs/ai/component-intake.md` + the schema
   (`docs/ai/component-spec.schema.json`), auto-prefill everything you can from the node,
   then ask the user ONLY the unknowns (behaviour, control model, states, loading, edge
   cases, a11y, tone, slots) via AskUserQuestion.

5. **Write the spec.** Assemble `{Name}.spec.json` (must validate against the schema).
   This is the single source of truth for the rest of the flow.

6. **Design the API — APPROVE-GATE 2.** Props mirror the *data model*, not the Figma
   variant matrix; keep continuous values continuous; compose real primitives; no
   redundant props. Confirm the prop list with the user.

7. **Scaffold (deterministic).**
   `node tools/kijani-component-generator/scaffold.mjs --spec {path-to-spec.json}`
   Emits types, a compiling component shell, the barrel, a Code Connect stub, and a test
   file (smoke test + `it.todo` per `spec.tests`); appends the library export; regenerates
   the manifest. Respects `updateModel` — won't clobber hand-maintained files without
   `--force`.

8. **Implement the body.** Fill `{Name}.tsx` from the Figma node + spec: real behaviour,
   states, loading, accessibility (roles, focus, live region), tokens only (no hardcoded
   values), light + dark. Replace each `it.todo` with a real test. Map props in
   `{Name}.figma.tsx`.

9. **Verify.** `cd packages/{platform} && npx tsc --noEmit && npx jest {Name}`, then
   `node scripts/build-manifest.mjs && node scripts/check-manifest.mjs`. Fix until green.

10. **Designer spec frame (D20) — MANDATORY, never skip.** As soon as the dev component is
    created and verified, build its spec frame: load `figma-use`, then via `use_figma`
    create the frame beside the component in its source Figma file (anatomy / options /
    states / do-don't / handoff). This runs for EVERY component the generator produces —
    organisms, patterns, templates — including product patterns and shakedowns. Record
    `figma.specFrameNodeId` + `definitionOfDone.figmaSpecFrame` in the spec.

11. **Demo.** Add the component to `packages/mobile/demo/screens/DemoScreens.tsx`.

12. **Commit — APPROVE-GATE 3.** Commit on a feature branch; surface the diff; let the
    user push / open the PR / merge.

## Guardrails
- Generation is an **assisted bootstrap** (D19): the scaffolder + Figma give the shell;
  you design the API + behaviour. Never claim push-button parity.
- Tokens only — no hardcoded colours/spacing/radius/type (golden rule #1).
- Spec frame is **mandatory** for every generated component (organisms, patterns, templates), on create *and* update (D20) — build it as soon as the component is created/verified; never skip it.
