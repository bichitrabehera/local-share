
import { listFiles } from "@/lib/database"
import { FileListQuerySchema } from "@/lib/validation"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const validated = FileListQuerySchema.safeParse({
    page: searchParams.get("page") ?? undefined,
    pageSize: searchParams.get("pageSize") ?? undefined,
    search: searchParams.get("search") || undefined,
    sort: searchParams.get("sort") || undefined,
    dir: searchParams.get("dir") || undefined,
    mimeType: searchParams.get("mimeType") || undefined,
  })
  if (!validated.success) {
    return Response.json({ error: "invalid query" }, { status: 400 })
  }

  const { files, total } = listFiles(validated.data)
  return Response.json({ files, total, page: validated.data.page, pageSize: validated.data.pageSize })
}
