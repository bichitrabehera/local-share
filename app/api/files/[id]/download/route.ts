export const runtime = "nodejs"

import { getFileById } from "@/lib/database"
import { readFileStream } from "@/lib/storage"

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const file = getFileById(id)
  if (!file) {
    return Response.json({ error: "file not found" }, { status: 404 })
  }

  try {
    const stream = readFileStream(file.stored_name)
    return new Response(stream as any, {
      headers: {
        "Content-Disposition": `attachment; filename="${file.original_name}"`,
        "Content-Type": file.mime_type || "application/octet-stream",
        "Content-Length": String(file.size),
      },
    })
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : "read failed" },
      { status: 500 }
    )
  }
}