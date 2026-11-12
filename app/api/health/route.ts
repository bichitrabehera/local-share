
import { getDatabase } from "@/lib/database"
import { closeDatabase } from "@/lib/database"

export async function GET() {
  try {
    const db = getDatabase()
    const fileRow = db
      .prepare(`SELECT COUNT(*) as c FROM files`)
      .get() as { c: number }
    const transferRow = db
      .prepare(`SELECT COUNT(*) as c FROM transfers`)
      .get() as { c: number }
    return Response.json({
      status: "ok",
      app: "localdrop",
      files: fileRow.c,
      transfers: transferRow.c,
      timestamp: new Date().toISOString(),
    })
  } catch (err) {
    return Response.json(
      { status: "error", error: err instanceof Error ? err.message : "unknown" },
      { status: 500 }
    )
  }
}