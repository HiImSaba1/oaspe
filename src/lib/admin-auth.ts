import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

export const ADMIN_COOKIE_NAME = "oaspe_admin_session";
export const ADMIN_SESSION_SECONDS = 60 * 60 * 12;

function secret() {
  const value = process.env.ADMIN_SESSION_SECRET;
  if (!value || value.length < 32) throw new Error("ADMIN_SESSION_SECRET must contain at least 32 characters.");
  return value;
}

function safeEqual(received: string, expected: string) {
  const left = Buffer.from(received);
  const right = Buffer.from(expected);
  return left.length === right.length && timingSafeEqual(left, right);
}

function signature(expiresAt: string) {
  return createHmac("sha256", secret()).update(`oaspe-admin:${expiresAt}`).digest("base64url");
}

export function createAdminSessionToken() {
  const expiresAt = String(Math.floor(Date.now() / 1000) + ADMIN_SESSION_SECONDS);
  return `${expiresAt}.${signature(expiresAt)}`;
}

export function verifyAdminSessionToken(token?: string) {
  if (!token) return false;
  const [expiresAt, received, extra] = token.split(".");
  if (!expiresAt || !received || extra || !/^\d+$/.test(expiresAt) || Number(expiresAt) <= Date.now() / 1000) return false;
  try { return safeEqual(received, signature(expiresAt)); } catch { return false; }
}

export function credentialsMatch(username: string, password: string) {
  const expectedUsername = process.env.ADMIN_USERNAME ?? "ADMIN";
  const expectedPassword = process.env.ADMIN_PASSWORD ?? "";
  return Boolean(expectedPassword) && safeEqual(username.toLocaleUpperCase("en-US"), expectedUsername.toLocaleUpperCase("en-US")) && safeEqual(password, expectedPassword);
}

export async function isAdminAuthenticated() {
  return verifyAdminSessionToken((await cookies()).get(ADMIN_COOKIE_NAME)?.value);
}

export async function requireAdmin() {
  if (!(await isAdminAuthenticated())) throw new Error("Unauthorized");
}
