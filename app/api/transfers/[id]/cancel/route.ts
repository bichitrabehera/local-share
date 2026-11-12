
import { cancelTransfer, getTransfer as getActiveTransfer } from "@/lib/transfer-manager"
import { updateTransferStatus, getTransferById } from "@/lib/database"

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const cancelled = cancelTransfer(id)
  if (!cancelled) {
    const dbTransfer = getTransferById(id)
    if (!dbTransfer) {
      return Response.json({ error: "transfer not found" }, { status: 404 })
    }
    return Response.json({ error: "transfer not active or already finished" }, { status: 400 })
  }
  updateTransferStatus(id, "cancelled", new Date().toISOString(), "cancelled by user")
  return Response.json({ ok: true, id, status: "cancelled" })
}