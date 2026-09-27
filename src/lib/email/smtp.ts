import "server-only";

import nodemailer from "nodemailer";

function required(name: string) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is not configured.`);
  return value;
}

export function smtpEnabled() {
  return process.env.SMTP_ENABLED === "true";
}

export function getSmtpTransport() {
  const host = required("SMTP_HOST");
  const port = Number(process.env.SMTP_PORT ?? 465);
  const secure = process.env.SMTP_SECURE !== "false";
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error("SMTP_PORT is invalid.");
  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user: required("SMTP_USERNAME"), pass: required("SMTP_PASSWORD") },
    connectionTimeout: 15_000,
    greetingTimeout: 15_000,
    socketTimeout: 30_000,
    tls: { servername: host, minVersion: "TLSv1.2", rejectUnauthorized: process.env.SMTP_REJECT_UNAUTHORIZED !== "false" },
    disableFileAccess: true,
    disableUrlAccess: true,
  });
}

export function getContactMailbox() {
  return process.env.CONTACT_TO_EMAIL?.trim() || required("SMTP_USERNAME");
}

export function getFromAddress() {
  const address = process.env.SMTP_FROM_EMAIL?.trim() || required("SMTP_USERNAME");
  return `ΟΑΣΠΕ <${address}>`;
}

export const escapeHtml = (value: string) => value.replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[character]!);
