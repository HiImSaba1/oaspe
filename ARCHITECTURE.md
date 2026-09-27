# OASPE Architecture

## Objective

Replace the legacy WordPress/Elementor presentation with a Greek-first Next.js application while preserving source content, URLs, dates, authorship, taxonomy and media relationships.

## Boundaries

- The WXR file is immutable source evidence. Inspection is read-only.
- Import is staged: inspect, sanitize, quarantine, dry-run, reconcile, then explicitly apply.
- Imported records are never made public merely because they exist in the XML.
- SMTP credentials are server-only environment variables and never enter source, logs or browser responses.
- Build, local browser verification, database migration, SMTP receipt and production deployment are separate gates.

## Runtime

- Next.js App Router and React Server Components by default.
- Client components are limited to animation, navigation and form interaction boundaries.
- PostgreSQL through Drizzle is the planned content store.
- Local media will ultimately be served through `next/image`; legacy remote URLs are migration inputs, not the production media strategy.

## Content pipeline

1. Stream and checksum the WXR source.
2. Inventory items by post type and status.
3. Sanitize legacy HTML and quarantine active content.
4. Map WordPress IDs and URLs to stable internal records.
5. Import to staging tables in an idempotent transaction.
6. Reconcile counts and broken relationships.
7. Promote only certified published records.

## Security

- Contact input is validated on both client and server.
- Honeypot, size limits and rate limits precede SMTP delivery.
- The visitor email becomes `Reply-To`; the authenticated mailbox remains `From`.
- Public HTML is sanitized before rendering.
- No secrets or personal form content are written to verification artifacts.
