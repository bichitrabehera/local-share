export const runtime = "nodejs"

import { getFileById } from "@/lib/database"
import { readFileStream } from "@/lib/storage"
import { BulkDownloadSchema } from "@/lib/validation"
import { createWriteStream } from "node:fs"
import { join } from "node:path"
import { pipeline } from "node:stream"
import { promisify } from "node:util"

const streamPipeline = promisify(pipeline)

export async function POST(req: Request) {
  const body = (await req.json()) as unknown
  const validated = BulkDownloadSchema.safeParse(body)
  if (!validated.success) {
    return Response.json({ error: "invalid selection" }, { status: 400 })
  }

  const { ids } = validated.data
  const files = ids.map((id) => getFileById(id)).filter(Boolean) as Array<{
    id: string
    original_name: string
    stored_name: string
    size: number
  }>

  if (files.length === 0) {
    return Response.json({ error: "no valid files" }, { status: 400 })
  }

  const archiverModule = await import("archiver")
  const Archiver = (archiverModule as any).default || archiverModule
  const archive = Archiver("zip", { zlib: { level: 6 } })
  for (const file of files) {
    try {
      const stream = readFileStream(file.stored_name)
      archive.append(stream, { name: file.original_name })
    } catch {
      // skip unreadable files
    }
  }

  archive.finalize()

  return new Response(archive as any, {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="localdrop-bulk-${Date.now()}.zip"`,
    },
  })
}
