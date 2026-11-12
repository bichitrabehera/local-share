export const runtime = "nodejs"

import { deleteFileRecord, getFileById } from "@/lib/database"
import { deleteFile as deleteStoredFile } from "@/lib/storage"

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const file = getFileById(id)
  if (!file) {
    return Response.json({ error: "file not found" }, { status: 404 })
  }
  try {
    deleteStoredFile(file.stored_name)
    deleteFileRecord(id)
    return Response.json({ ok: true, id })
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : "delete failed" },
      { status: 500 }
    )
  }
}