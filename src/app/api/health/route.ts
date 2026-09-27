import { getDatabase, isDatabaseConfigured } from "@/lib/database";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!isDatabaseConfigured()) {
    return Response.json({ ok: false, database: "not-configured" }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
  try {
    await getDatabase().query("SELECT 1");
    return Response.json({ ok: true, database: "connected" }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json({ ok: false, database: "unavailable" }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
