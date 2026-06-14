# Role guide — Designers

> Your two-minute orientation to using AI inside the Kijani Design System. **You'll spend most of your AI time on intent-to-frames and on handoff specs. The Figma library is your source of truth; AI plugs into it, not around it.**

## The shape of your day with AI

_Three short paragraphs:_

1. **Intent-to-frames.** Cowork / Lovable can stand up rough flows from prose. Use them to argue with yourself before committing to a direction — not as a substitute for the design pass.
2. **Composing inside Figma.** The custom Figma plugin (`figma-plugin/`) syncs tokens, Text Styles, and components from this repo. Stay inside the library and inside Variables — that's how AI downstream can read your work.
3. **Writing specs for handoff.** Once frames are done, AI is excellent at turning them into the written spec a dev (or Claude Code) needs. See template 3 in the [prompting library](../prompting.md).

## What "library-clean" frames look like

_Bulleted contract:_

- Every visible element is a Kijani library component instance.
- Every visual value (colour, type, spacing) is a Variable / Text Style — not a hand-picked value.
- Light and dark modes switch correctly when you flip them at the frame level (mobile: light/dark × platform).
- Zero detached instances. (If you detached to "make it work", that's the signal we need a new variant — file an RFC, don't ship the detach.)
- Empty / loading / error / RTL frames present alongside the happy path.

## Templates you'll use most

_Pointer:_

The [prompting library](../prompting.md) has six templates. The three you'll use most are:

- _"Turn this Figma frame into a spec"_
- _"Explore a flow"_
- _"Generate a component variant"_ (when proposing a library change)

## How AI reads your work

_Two paragraphs:_

- _When you write a spec from your Figma frames, the dev's AI agent reads your spec first and your frames second. If the spec is sparse, the AI fills the gaps with guesses. Spend the time on the spec — that's where AI quality is decided._
- _The Figma plugin keeps the library in sync with code. When you propose a new variant, the RFC lives in this repo, not in a separate doc. The library is the contract._

## Anti-patterns

_Bulleted:_

- Designing pixel-perfect mocks of components that already exist in the library. That's drift; use the instance.
- Specifying colours by hex. Use the Variable; the hex will rebind on mode switch and you'll lose dark mode for free.
- Treating the AI prototype as the design. Prototypes are exploration; designs are decisions.
- Annotating prop values as colours / sizes rather than as the component's prop names. Devs and AI agents both read prop names.

## What to escalate, and to whom

_Two paragraphs:_

- _A library component is missing a variant_ → RFC in GitHub, both leads review.
- _A token feels off_ → file the proposed change in `packages/tokens/source/`; both leads review.
- _Something doesn't fit in any existing component_ → don't fork in Figma. Propose the component.
