const required = [
  "NODE_ENV", "NEXT_PUBLIC_SITE_URL", "DB_HOST", "DB_PORT", "DB_NAME", "DB_USER", "DB_PASSWORD",
  "ADMIN_USERNAME", "ADMIN_PASSWORD", "ADMIN_SESSION_SECRET", "AUTH_SECRET", "NEXTAUTH_SECRET",
  "NEXTAUTH_URL", "SMTP_HOST", "SMTP_PORT", "SMTP_USERNAME", "SMTP_PASSWORD",
  "SMTP_FROM_EMAIL", "CONTACT_TO_EMAIL",
] as const;

function fail(message: string): never { throw new Error(message); }

function main() {
  const missing = required.filter((key) => !process.env[key]?.trim());
  if (missing.length) fail(`Missing production variables: ${missing.join(", ")}`);
  if (process.env.NODE_ENV !== "production") fail("NODE_ENV must be production.");
  if (process.env.DB_NAME !== "next_oaspe") fail("DB_NAME must be next_oaspe.");
  for (const key of ["ADMIN_PASSWORD", "ADMIN_SESSION_SECRET", "AUTH_SECRET", "NEXTAUTH_SECRET"] as const) {
    if ((process.env[key]?.length ?? 0) < 12) fail(`${key} is too short.`);
  }
  for (const key of ["NEXT_PUBLIC_SITE_URL", "NEXTAUTH_URL"] as const) {
    const url = new URL(process.env[key]!);
    if (url.protocol !== "https:" || url.hostname !== "oaspe.org") fail(`${key} must use https://oaspe.org in production.`);
  }
  if (process.env.SMTP_ENABLED !== "true") fail("SMTP_ENABLED must be true for production contact delivery.");
  if (process.env.SMTP_SECURE !== "true" || process.env.SMTP_PORT !== "465") fail("Production SMTP must use secure port 465.");
  console.log("Production environment contract: PASS. Secrets were not printed.");
}

try { main(); } catch (error) { console.error(error instanceof Error ? error.message : error); process.exitCode = 1; }
