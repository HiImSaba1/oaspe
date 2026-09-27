import "server-only";
import { readdir } from "node:fs/promises";
import { join } from "node:path";
import type { RowDataPacket } from "mysql2/promise";
import { getDatabase, isDatabaseConfigured } from "@/lib/database";

export type PageSection = { pageKey: string; sectionKey: string; title: string; body: string; imagePath: string; position: number };
type SectionRow = RowDataPacket & { page_key: string; section_key: string; title: string; body: string; image_path: string; position: number };
type MessageRow = RowDataPacket & { id: string; name: string; email: string; subject: string; message: string; delivery_status: string; read_at: Date | null; created_at: Date };

export async function listPageSections() {
  if (!isDatabaseConfigured()) return [];
  const [rows] = await getDatabase().query<SectionRow[]>("SELECT page_key, section_key, title, body, image_path, position FROM oaspe_page_sections ORDER BY page_key, position");
  return rows.map((row) => ({ pageKey: row.page_key, sectionKey: row.section_key, title: row.title, body: row.body, imagePath: row.image_path, position: Number(row.position) }));
}

export async function getPageSection(pageKey: string, sectionKey: string) {
  if (!isDatabaseConfigured()) return null;
  try {
    const [rows] = await getDatabase().query<SectionRow[]>("SELECT page_key, section_key, title, body, image_path, position FROM oaspe_page_sections WHERE page_key=? AND section_key=? LIMIT 1", [pageKey, sectionKey]);
    const row = rows[0];
    return row ? { pageKey: row.page_key, sectionKey: row.section_key, title: row.title, body: row.body, imagePath: row.image_path, position: Number(row.position) } : null;
  } catch { return null; }
}

export async function savePageSection(section: PageSection) {
  await getDatabase().execute("INSERT INTO oaspe_page_sections (page_key, section_key, title, body, image_path, position) VALUES (?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE title=VALUES(title), body=VALUES(body), image_path=VALUES(image_path), position=VALUES(position)", [section.pageKey, section.sectionKey, section.title, section.body, section.imagePath, section.position]);
}

export async function listMediaLibrary() {
  const root = join(process.cwd(), "public", "images", "wordpress");
  async function imagesBelow(directory: string): Promise<string[]> {
    const entries = await readdir(directory, { withFileTypes: true });
    return (await Promise.all(entries.map((entry) => {
      const target = join(directory, entry.name);
      if (entry.isDirectory()) return imagesBelow(target);
      return /\.(avif|gif|jpe?g|png|webp)$/i.test(entry.name) ? [target] : [];
    }))).flat();
  }
  const marker = `${join(process.cwd(), "public")}\\`;
  return (await imagesBelow(root)).map((item) => `/${item.replace(marker, "").replaceAll("\\", "/")}`).sort();
}

export async function listContactMessages() {
  if (!isDatabaseConfigured()) return [];
  const [rows] = await getDatabase().query<MessageRow[]>("SELECT id, name, email, subject, message, delivery_status, read_at, created_at FROM oaspe_contact_messages ORDER BY created_at DESC LIMIT 200");
  return rows;
}
