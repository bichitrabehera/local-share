
import { getTransferById } from "@/lib/database"

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const transfer = getTransferById(id)
  if (!transfer) {
    return Response.json({ error: "transfer not found" }, { status: 404 })
  }
  return Response.json(transfer)
}