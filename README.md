# Puke Town Gaming

Standalone gaming rewards platform for web, Discord and mobile PWA.

## Milestone 1

Foundation only: product specification, architecture, security boundaries and data model. No live Xbox or PlayStation account linking, advertising, reward issuance or financial transactions are enabled.

## Principles

- Gaming XP is progression only and has no cash value.
- Redeemable Reward Credits are separate and may only be issued against verified, cleared and provider-approved revenue.
- No unfunded redemptions or uncontrolled reward liabilities.
- Provider presence data is not treated as proof of play unless the provider explicitly supports that conclusion.
- The existing `PukeTownInc/ptcl` repository must not be modified.

## Planned stack

React, TypeScript, Vite, Tailwind CSS, Supabase Auth/PostgreSQL and server-side Edge Functions, Vercel hosting, and a Discord bot using the same backend.

## Launch blockers

Written approval for commercial Xbox data use, an approved PlayStation data access route, advertising-provider reward-model approval, and UK legal/privacy/financial review are required before live integrations or reward issuance.
