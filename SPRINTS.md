# OASPE Delivery Sprints

## Sprint 00 — Evidence and architecture

WXR inventory, checksum, content map, architecture, design contract and owner-run verifier.

Status: passed on 2026-09-23. Artifact: `.artifacts/sprint00/result.log`.

## Sprint 01 — Design system and application shell

Inverted Sabaweb-derived tokens, fixed header, accessible full-screen menu, SplitText, Lenis, ParallaxImage, responsive behavior and reduced motion.

Status: passed on 2026-09-23. Artifact: `.artifacts/sprint01/result.log`.

## Sprint 01B — OASPE editorial redesign

Refine the public visual language using the Moumkas project as an editorial-pattern reference while retaining OASPE identity and content.

Scope:

- Preserve the approved OASPE header, image logo, homepage hero, hero interaction, preloader and page transition.
- Replace heavy display typography below the hero with lighter serif editorial typography and restrained weights.
- Give section titles the full available content width instead of character-based maximum widths.
- Let section padding, content and media determine height; avoid decorative minimum-height rules outside heroes.
- Retain the three-column article-card requirement while reducing shadows, borders and hover movement.
- Use warm off-white, ink black, muted text and thin rules; no yellow, fluorescent or neon accents.
- Keep images contained throughout the site, with `cover` reserved for full-bleed hero backgrounds.
- Verify desktop and mobile width, card columns, reduced motion, menu keyboard behavior and page transitions.

Status: foundation implemented; visual review and owner-run browser certification pending.

## Sprint 02 — Safe WXR importer

Streaming inspection, sanitization, quarantine, dry-run import plan and reconciliation.

Status: passed on 2026-09-23. Artifact: `.artifacts/sprint02/result.log`. Reconciliation: 1,466 of 1,466 records, with no database writes, media downloads or publication.

## Sprint 03 — Editorial works bridge

Bring the XML-derived portfolio into the homepage with a Moumkas-informed, OASPE-specific editorial grid.

Scope:

- Preserve the approved header, hero, preloader and page transition.
- Add three selected works to the homepage using the existing six-item XML portfolio dataset.
- Use asymmetric image rhythm, fine rules, restrained serif type and contained media.
- Keep direct, accessible routes to each project and to the complete works archive.
- Certify desktop/mobile layout, route integrity, overflow, reduced motion and existing shell behavior.

Status: passed on 2026-09-23. Artifact: `.artifacts/sprint03/result.log`.

## Sprint 04 — Editorial public pages

Transform the About, Purpose and Donations records from the WXR into structured public storytelling pages.

Scope:

- Preserve the approved full-screen page heroes and global motion shell.
- Use the WXR text and media as source material without rendering legacy Elementor markup.
- Apply asymmetric editorial galleries, 90%-width headings, numbered statements and restrained typography.
- Keep all images contained and all calls to action on internal transition links.
- Verify the new content on desktop and mobile Chromium.

Status: passed on 2026-09-23. Artifact: `.artifacts/sprint04/result.log`.

## Sprint 05 — Editorial article archive

Create a reviewed article archive and detail experience from legitimate WXR records.

Scope:

- Quarantine the injected 2026 casino and SEO-spam records from public output.
- Publish a reviewed six-article static slice from the legitimate OASPE archive.
- Add three-column editorial cards and dedicated article routes.
- Preserve contained parallax media, transition links and the approved page heroes.
- Verify archive count, spam exclusion, detail navigation and responsive behavior.

Status: certified as part of the clean Sprint 08 browser suite on 2026-09-23.

## Sprint 06 — Local database environment

Prepare a secret-safe MySQL/MariaDB environment contract for the owner-created `next_oaspe` database.

Scope:

- Use the Moumkas database environment shape without copying any credential values.
- Prompt securely for the local database and admin passwords.
- Generate fresh admin, Auth.js and NextAuth session secrets.
- Keep outbound SMTP disabled and make no database or schema changes.
- Verify required keys and secret strength without printing credentials.

Status: passed on 2026-09-23. Local environment contract verified for `next_oaspe`; credential values were not logged.

## Sprint 07 — Database and controlled import

Drizzle schema, migrations, idempotent staged import and rollback evidence.

Scope:

- Add the MySQL driver and an additive, namespaced staging schema.
- Refuse connections to any database except `next_oaspe`.
- Extend quarantine detection to the evidence-backed injected 2026 bulk-post cluster.
- Import all 1,466 WXR records idempotently as `staged` or `quarantined`.
- Keep `approved` at zero and leave all public routes on reviewed static data.
- Reconcile database counts without printing credentials.

Status: passed on 2026-09-23. Artifact: `.artifacts/sprint07/result.log`. Reconciliation: 1,466 total, 464 staged, 1,002 quarantined, 0 approved.

## Sprint 08 — Remaining public pages

XML-backed home, about, purpose, six-item works portfolio with detail routes, articles, donations, contact and legal pages.

Scope completed in this sprint:

- Add structured Terms/Privacy and Cookie content beneath the approved heroes.
- Remove legacy `goldencup.gr` branding and obsolete WordPress shortcode remnants from public output.
- Preserve the subject matter of the WXR while flagging formal legal review before launch.
- Use a sticky index, 90%-width statement and numbered long-form sections.
- Route privacy requests to the existing OASPE contact page.
- Strengthen every hero as a full-bleed parallax background while retaining reduced-motion behavior.
- Increase header and contained logo scale across desktop and mobile.
- Make internal button/link transitions reliable and use an off-white curtain with dark editorial type.

Status: passed on 2026-09-23. Artifact: `.artifacts/sprint08/result.log`.

## Sprint 09 — Full articles and media

Archives, detail routes, taxonomies, authors, local media, image optimization and redirects.

Scope for the reviewed public slice:

- Add taxonomy navigation to the six certified archive records.
- Extend detail pages with reading context, a large editorial pull quote and related stories.
- Download only reviewed article media; never fetch media referenced solely by quarantined records.
- Resolve the Easter Golden Cup story to its WXR featured attachment (`1461`) instead of the stale legacy inline-image URL.
- Prefer verified local media automatically, with remote fallback before preparation.
- Keep media preparation separate from lint, TypeScript and browser verification.

Status: media preparation passed on 2026-09-23; final browser certification is carried into Sprint 10.

## Sprint 10 — Sabaweb interaction parity

- Match the Sabaweb cursor-following service preview, viewport clamping, image switching and directional tilt.
- Preserve inline service images for touch/coarse-pointer devices.
- Convert the full-screen menu to an off-white field with dark typography and remove its bottom logo block.
- Port Sabaweb's split-letter menu hover hook and magnetic expanding-fill button behavior.
- Port Sabaweb's exact SplitText/card preloader timeline, using an off-white OASPE treatment, a three-line organization title and a larger bottom-right counter.
- Re-run reviewed-media validation, lint, TypeScript and desktop/mobile Playwright.

Status: passed on 2026-09-23 as part of the clean Sprint 11 verification suite.

## Sprint 11 — Contact and SMTP

Nodemailer transport, Papaki-compatible TLS configuration, rate limiting and explicit delivery smoke test.

- Restyle the contact form with the restrained Moumkas line-field pattern and OASPE typography.
- Validate and size-limit JSON requests, retain the honeypot and rate-limit by forwarded client IP.
- Use server-only Nodemailer with TLS 1.2+, configurable certificate verification and port 465 defaults.
- Pin Nodemailer 7.0.13 for compatibility with the existing NextAuth 4 peer contract while retaining the Moumkas transport settings.
- Deliver to the configured OASPE mailbox with the visitor address as `Reply-To`; escape all HTML content.
- Keep SMTP disabled by default. Sprint verification never sends an email.
- Provide a secret-safe local configurator that combines the commented OASPE mailbox credentials with the Moumkas SMTP host/port contract without logging values.

Status: passed on 2026-09-23. Artifact: `.artifacts/sprint11/result.log`. Live SMTP delivery remains a separate explicit gate.

## Sprint 12 — SEO and accessibility

Metadata, sitemap, structured data, keyboard behavior, contrast and motion audit.

- Add canonical, Open Graph and Twitter metadata through a shared Greek-first contract.
- Publish `robots.txt` and `sitemap.xml`, excluding `/admin` and `/api` from crawler access.
- Apply metadata-level `noindex`, `nofollow` and `nocache` to the complete admin segment.
- Publish Organization JSON-LD using production-safe public values only.
- Verify that every live image reference resolves locally and no removable WordPress derivative remains referenced.
- Re-certify keyboard menu behavior, reduced motion, page transitions and desktop/mobile rendering.

Status: passed on 2026-09-23. Artifact: `.artifacts/sprint12/result.log`.

Media preparation begins with the owner-run `npm run media:download`, which mirrors every current production image under `public/images/wp-content/uploads/YYYY/MM` and records the result in a manifest. The broader WXR archive remains available separately through `npm run media:download:wxr`.

The About hero uses the WXR-authoritative `2016/02/oaspe_2.jpg`; the stale `oaspe_3.jpg` reference was removed after the source server returned HTTP 500 and the export confirmed no such attachment.

## Sprint 13 — Browser and performance certification

Owner-run Playwright, responsive checks, production build and performance evidence.

- Pin the Papaki application to Node.js 22 and provide a Plesk-compatible `start.js`.
- Use the Webpack production builder with a single build CPU for shared-host stability.
- Add a secret-safe database health endpoint and production environment/schema preflights.
- Remove runtime dependence on local absolute-path media manifests.
- Generate a source-only Papaki ZIP and SHA-256 checksum with secrets, builds, dependencies and test artifacts excluded.
- Provide a rollback-aware Papaki deployment runbook with database, build, SMTP and cutover as separate gates.
- Apply the menu's split-letter hover language to shared navigation links, footer links and button labels.
- Keep footer hover states high-contrast with an off-white field and dark text.
- Route all internal links through the page curtain and reset native/Lenis scroll to the top before each destination is revealed.
- Give every public route a specific title, description, canonical URL and approved local Open Graph/Twitter image; expose article dates, sections and authors as article metadata.
- Verify that every primary route's social image exists and is publicly reachable before packaging.

Playwright uses its own fresh Next.js development server on `127.0.0.1:3100`. It must not reuse the owner’s long-running `localhost:3000` process because stale HMR state invalidates animation and readiness checks.

Status: verification passed on 2026-09-23. Artifact: `.artifacts/sprint13/result.log`. Release archive preparation remains the entry gate for Sprint 14.

Post-certification mobile refinement: compact heading scale, corrected header/logo gutters, full-width service rows, denser works cards, larger labels and action text, smaller menu typography, and a two-column mobile footer with legal links above the contact action. This refinement requires a fresh Sprint 13 verification and release checksum before upload.

## Sprint 14 — Deployment and cutover

Backups, environment configuration, database migration, redirect activation, smoke tests and rollback.
