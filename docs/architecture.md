# Architecture — Milestone 1

## Runtime shape

- React + TypeScript + Vite PWA frontend.
- Supabase Auth and PostgreSQL as the application data layer.
- Server-side Edge Functions for provider adapters, verification, XP calculation, reward accounting and Discord interactions.
- Discord bot calls the same backend services; it never writes wallet balances directly.
- Vercel hosts the frontend. Supabase hosts database and server-side functions.

## Trust boundaries

1. Browser: presentation and user-initiated requests only. Never trusted to calculate XP, confirm achievements or issue Reward Credits.
2. Backend: validates identity, consent, provider payloads, event uniqueness, eligibility and fraud signals.
3. Provider adapters: Xbox/PlayStation access remains disabled until approved access routes and commercial terms are documented.
4. Financial ledger: append-only records. Corrections use compensating entries; no silent balance edits.
5. Reward fulfilment: disabled until funding, provider terms, legal review and reserve rules are approved.

## Data flow

Provider event -> ingestion adapter -> raw verification event -> deduplication -> eligibility/fraud checks -> Gaming XP transaction.

Reward Credits have a separate path: cleared approved revenue -> funding allocation/reserve -> reward budget -> approved campaign issuance -> redemption/fulfilment -> ledger reconciliation.

## Security requirements

- OAuth tokens and provider secrets are server-side only, encrypted at rest, and never logged.
- RLS enabled on user-owned data. Service-role credentials are never exposed to the browser.
- Every account link records consent scope, timestamp, provider, revocation state and policy version.
- Disconnect must revoke provider access where supported and stop future sync.
- Rate limits, idempotency keys, audit events and fraud flags are required.
- Never infer exact playtime from a presence heartbeat or status snapshot.
- No reverse-engineered PlayStation endpoints in production.

## Deployment separation

This is a standalone repository and must use a dedicated Supabase project and environment variables. Do not import credentials, migrations or runtime configuration from PukeTownInc/ptcl.
