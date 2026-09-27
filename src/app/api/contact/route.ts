import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { contactSchema } from "@/lib/contact-schema";
import { getDatabase, isDatabaseConfigured } from "@/lib/database";
import { escapeHtml, getContactMailbox, getFromAddress, getSmtpTransport, smtpEnabled } from "@/lib/email/smtp";
import { rateLimit, requestIp } from "@/lib/security/rate-limit";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const limit = rateLimit(`contact:${requestIp(request)}`, 5, 15 * 60 * 1000);
  if (!limit.allowed) return NextResponse.json({ message: "Πάρα πολλές προσπάθειες. Δοκιμάστε ξανά αργότερα." }, { status: 429, headers: { "Retry-After": String(limit.retryAfter) } });
  if (!request.headers.get("content-type")?.toLowerCase().includes("application/json")) return NextResponse.json({ message: "Μη υποστηριζόμενος τύπος αιτήματος." }, { status: 415 });
  const raw = await request.text();
  if (raw.length > 12_000) return NextResponse.json({ message: "Το αίτημα είναι πολύ μεγάλο." }, { status: 413 });
  const body: unknown = (() => { try { return JSON.parse(raw); } catch { return null; } })();
  const parsed = contactSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ message: "Ελέγξτε τα πεδία της φόρμας." }, { status: 400 });
  if (parsed.data.website) return NextResponse.json({ ok: true, message: "Ευχαριστούμε." });
  if (!smtpEnabled()) return NextResponse.json({ message: "Η αποστολή email δεν είναι ακόμη ενεργή. Επικοινωνήστε στο info@oaspe.org." }, { status: 503 });

  const data = parsed.data;
  const messageId = randomUUID();
  if (isDatabaseConfigured()) {
    await getDatabase().execute("INSERT INTO oaspe_contact_messages (id, name, email, subject, message, delivery_status) VALUES (?, ?, ?, ?, ?, 'received')", [messageId, data.name, data.email, data.subject, data.message]).catch((error) => console.error("Contact message archive failed", error instanceof Error ? error.message : "Unknown database failure"));
  }
  try {
    const transport = getSmtpTransport();
    await transport.sendMail({
      from: getFromAddress(),
      to: getContactMailbox(),
      replyTo: data.email,
      subject: `[oaspe.org] ${data.subject}`,
      text: `Ονοματεπώνυμο: ${data.name}\nEmail: ${data.email}\nΘέμα: ${data.subject}\n\n${data.message}`,
      html: `<div style="font-family:Arial,sans-serif;color:#171715;line-height:1.6"><p style="font-size:12px;letter-spacing:.12em;text-transform:uppercase">Νέο μήνυμα από το oaspe.org</p><h1 style="font-size:28px">${escapeHtml(data.subject)}</h1><p><strong>Ονοματεπώνυμο:</strong> ${escapeHtml(data.name)}<br><strong>Email:</strong> ${escapeHtml(data.email)}</p><hr style="border:0;border-top:1px solid #d4d0c8"><p style="white-space:pre-wrap">${escapeHtml(data.message)}</p></div>`,
    });
    if (isDatabaseConfigured()) await getDatabase().execute("UPDATE oaspe_contact_messages SET delivery_status='sent' WHERE id=?", [messageId]).catch(() => undefined);
    return NextResponse.json({ ok: true, message: "Το μήνυμά σας στάλθηκε με επιτυχία." });
  } catch (error) {
    if (isDatabaseConfigured()) await getDatabase().execute("UPDATE oaspe_contact_messages SET delivery_status='failed' WHERE id=?", [messageId]).catch(() => undefined);
    console.error("Contact email delivery failed", error instanceof Error ? error.message : "Unknown SMTP failure");
    return NextResponse.json({ message: "Η αποστολή δεν ολοκληρώθηκε. Επικοινωνήστε στο info@oaspe.org." }, { status: 502 });
  }
}
