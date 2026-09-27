# OASPE Papaki / Plesk deployment

Deploy one gate at a time. Do not delete or overwrite the existing WordPress installation until the new site has passed preview and live acceptance.

## Release contract

- Domain: `https://oaspe.org`
- Runtime: Node.js 22
- Startup file: `start.js`
- Build command: `npm run build:plesk`
- Database name expected by the application: `next_oaspe`
- Health endpoint: `/api/health`
- Release archive: `.artifacts/release/oaspe-papaki-release.zip`
- Never upload local `.env*`, `.next`, `node_modules`, XML exports, logs or test artifacts.

## Gate 1 — Local certification

Run locally and stop if it does not end in `STATUS: PASS`:

```powershell
powershell -ExecutionPolicy Bypass -File ".\scripts\oaspe.ps1" -Action Sprint14Verify
```

## Gate 2 — Create the reviewed archive

```powershell
powershell -ExecutionPolicy Bypass -File ".\scripts\oaspe.ps1" -Action Sprint14PrepareRelease
```

Record the displayed SHA-256 value. Upload only the generated ZIP.

## Gate 3 — Backup and preview application

1. Create a Papaki/JetBackup restore point for site files and databases.
2. Keep the WordPress document root unchanged.
3. Create a separate Plesk Node application directory and extract the release ZIP there.
4. Select Node.js 22 and `start.js` as the startup file.
5. Use a temporary/protected preview URL before changing the production domain.

## Gate 4 — Private environment

Create `.env.production.local` in the Node application directory using `.env.example` as the key list. This is the only project file used for Papaki credentials; do not copy or rename the local `.env.local`. Set production values privately in Plesk or this private file. Required URL values are:

Locally, activate the separately supplied Papaki database comments and set the public production values without printing secrets:

```powershell
powershell -ExecutionPolicy Bypass -File ".\scripts\configure-production-env.ps1" -Force
```

```text
NODE_ENV=production
NEXT_PUBLIC_SITE_URL=https://oaspe.org
NEXTAUTH_URL=https://oaspe.org
```

Use the dedicated Papaki database account and fresh production session secrets. Configure Papaki SMTP privately and keep the file outside any downloadable/public directory. `.env.production.local` is excluded from Git and the release ZIP, so transfer or create it separately in the private Plesk application directory.

Verify without printing credentials:

```bash
npm run production:preflight
```

## Gate 5 — Dependencies, schema and build

Run on Papaki/Linux. Do not upload Windows dependencies or build output.

```bash
npm ci
npm run production:migrate
npm run production:schema:check
npm run build:plesk
```

The production migration runner applies only the additive admin/content migrations (`002` and `003`). It does not create or import the local WXR staging archive, and it does not transfer local contact-message data.

## Gate 6 — Start and private acceptance

Start/restart the Plesk Node application, then verify:

1. `/api/health` returns `{"ok":true,"database":"connected"}`.
2. Homepage, About, Purpose, Works, Articles, Donations and Contact render.
3. `/admin` is private and login succeeds with production credentials.
4. Page and project edits persist after restart.
5. Images, favicon, `robots.txt` and `sitemap.xml` load.
6. `/arthra` exposes 58 genuine Greek articles across five pages, and the sitemap contains all 58 article URLs.
7. No injected casino/slots records or legacy WordPress shortcodes are visible or indexed.
8. Mobile navigation, preloader, page transitions and reduced motion remain functional.

## Gate 7 — Explicit SMTP smoke test

Send one real contact submission only after the mailbox settings and recipient have been reviewed. Confirm receipt and Reply-To behavior. This is a separate live-delivery gate; local verification never proves mail delivery.

## Gate 8 — Domain cutover and rollback

Point `oaspe.org` to the verified Node application only after preview acceptance. Recheck HTTPS, canonical URLs, sitemap host, health, admin and contact delivery. Preserve the WordPress files and database as rollback until final acceptance and a fresh backup.

If Papaki reports `fork: Resource temporarily unavailable`, `No child processes`, exit 134 or a build timeout, stop retrying. Preserve the current `.next`, application files and backups, then request a hosting process-limit reset before continuing.
