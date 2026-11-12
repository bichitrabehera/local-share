
import { clearTransfers, listTransfers } from "@/lib/database"
import { TransferListQuerySchema } from "@/lib/validation"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const validated = TransferListQuerySchema.safeParse({
    page: searchParams.get("page") ?? undefined,
    pageSize: searchParams.get("pageSize") ?? undefined,
    search: searchParams.get("search") || undefined,
    status: searchParams.get("status") || undefined,
    direction: searchParams.get("direction") || undefined,
    sort: searchParams.get("sort") || undefined,
    dir: searchParams.get("dir") || undefined,
  })
  if (!validated.success) {
    return Response.json({ error: "invalid query" }, { status: 400 })
  }

  const { transfers, total } = listTransfers(validated.data)
  return Response.json({
    transfers,
    total,
    page: validated.data.page,
    pageSize: validated.data.pageSize,
  })
}

export async function DELETE() {
  const cleared = clearTransfers()
  return Response.json({ ok: true, cleared })
}