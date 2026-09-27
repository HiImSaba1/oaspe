import "server-only";
import { randomUUID } from "node:crypto";
import type { RowDataPacket } from "mysql2/promise";
import { portfolioItems, type PortfolioItem } from "@/data/portfolio";
import { getDatabase, isDatabaseConfigured } from "@/lib/database";

type ProjectRow = RowDataPacket & { id: string; slug: string; title: string; year_label: string; summary: string; details_json: string | string[]; image_path: string; position: number };
export type AdminProject = PortfolioItem & { managed: boolean; position: number };

export async function listAdminProjects(): Promise<AdminProject[]> {
  if (!isDatabaseConfigured()) return portfolioItems.map((item, position) => ({ ...item, managed: false, position }));
  let rows: ProjectRow[]; let deletedRows: (RowDataPacket & { slug: string })[];
  try {
    [rows] = await getDatabase().query<ProjectRow[]>("SELECT id, slug, title, year_label, summary, details_json, image_path, position FROM oaspe_portfolio_projects ORDER BY position, created_at");
    [deletedRows] = await getDatabase().query<(RowDataPacket & { slug: string })[]>("SELECT slug FROM oaspe_portfolio_deletions");
  } catch { return portfolioItems.map((item, position) => ({ ...item, managed: false, position })); }
  const deleted = new Set(deletedRows.map((row) => row.slug));
  const managed = rows.map((row) => ({ slug: row.slug, title: row.title, year: row.year_label, summary: row.summary, details: typeof row.details_json === "string" ? JSON.parse(row.details_json) as string[] : row.details_json, image: row.image_path, managed: true, position: Number(row.position) }));
  const overridden = new Set(managed.map((item) => item.slug));
  return [...managed, ...portfolioItems.filter((item) => !overridden.has(item.slug) && !deleted.has(item.slug)).map((item, position) => ({ ...item, managed: false, position: position + 100 }))].sort((a, b) => a.position - b.position);
}

export async function getAdminProject(slug: string) { return (await listAdminProjects()).find((item) => item.slug === slug) ?? null; }
export async function saveAdminProject(input: Omit<AdminProject, "managed"> & { originalSlug?: string }) {
  const existing = input.originalSlug ? await getAdminProject(input.originalSlug) : null;
  await getDatabase().execute("INSERT INTO oaspe_portfolio_projects (id, slug, title, year_label, summary, details_json, image_path, position) VALUES (?, ?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE title=VALUES(title), year_label=VALUES(year_label), summary=VALUES(summary), details_json=VALUES(details_json), image_path=VALUES(image_path), position=VALUES(position)", [existing?.managed ? (await projectId(input.originalSlug!)) : randomUUID(), input.slug, input.title, input.year, input.summary, JSON.stringify(input.details), input.image, input.position]);
  await getDatabase().execute("DELETE FROM oaspe_portfolio_deletions WHERE slug IN (?, ?)", [input.slug, input.originalSlug ?? input.slug]);
}
async function projectId(slug: string) { const [rows] = await getDatabase().query<(RowDataPacket & { id: string })[]>("SELECT id FROM oaspe_portfolio_projects WHERE slug=? LIMIT 1", [slug]); return rows[0]?.id ?? randomUUID(); }
export async function deleteAdminProject(slug: string) { await getDatabase().execute("DELETE FROM oaspe_portfolio_projects WHERE slug=?", [slug]); await getDatabase().execute("INSERT INTO oaspe_portfolio_deletions (slug) VALUES (?) ON DUPLICATE KEY UPDATE deleted_at=CURRENT_TIMESTAMP(3)", [slug]); }
