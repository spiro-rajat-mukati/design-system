# AGENTS.md — Kijani Design System

This file exists for AI agents that follow the `AGENTS.md` convention rather than `CLAUDE.md`.

**The canonical guidance lives in [`CLAUDE.md`](./CLAUDE.md).** Read that file first — it contains the golden rules, file map, pipeline summary, and quality bar that apply to every agent working in this repo.

Quick links:

- [`CLAUDE.md`](./CLAUDE.md) — golden rules + file map
- [`docs/ai/pipeline.md`](./docs/ai/pipeline.md) — design-to-dev workflow
- [`docs/ai/component-usage.md`](./docs/ai/component-usage.md) — component rules
- [`docs/ai/token-usage.md`](./docs/ai/token-usage.md) — token rules
- [`docs/ai/prompting.md`](./docs/ai/prompting.md) — prompt library
- [`docs/ai/quality-bar.md`](./docs/ai/quality-bar.md) — production-readiness checklist

If your tool reads `AGENTS.md` exclusively and cannot follow the link to `CLAUDE.md`, treat this paragraph as the minimum viable instruction set: _use Kijani components and tokens; never hardcode visual values; every change must work in light and dark modes (web); light/dark × platform for mobile; accessibility violations are build errors, not follow-ups_.
