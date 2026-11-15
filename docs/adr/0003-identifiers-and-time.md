# ADR 0003: Identifiers and time semantics

- Status: Accepted
- Date: 2026-11-15

## Context

Offline operations need stable IDs before synchronization. Server, phone and dairy may use different timezones.

## Decision

- Use UUIDs for externally addressed resources and UUIDv4 for client-created/offline records initially.
- Never expose sequential database IDs as public identifiers.
- Store absolute instants in PostgreSQL timestamptz and serialize UTC RFC 3339 with a Z suffix.
- Store each dairy's IANA timezone. Use Asia/Kolkata for the initial India pilot unless configured otherwise.
- Compute dairy-local business dates with the dairy timezone, never implicit server/device timezone.
- Keep event time separate from backend receive/sync time.

## Consequences

Offline-created records keep stable identity and trip events remain comparable across devices while reports follow the dairy-local calendar.
