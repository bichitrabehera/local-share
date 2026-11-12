export interface ActiveTransfer {
  id: string
  status: "uploading" | "downloading" | "completed" | "failed" | "cancelled"
  progress: number // 0-100
  bytesTransferred: number
  totalBytes: number
  error: string | null
  abortController: AbortController
}

const activeTransfers = new Map<string, ActiveTransfer>()

export function createTransfer(
  id: string,
  totalBytes: number
): ActiveTransfer {
  const transfer: ActiveTransfer = {
    id,
    status: "uploading",
    progress: 0,
    bytesTransferred: 0,
    totalBytes,
    error: null,
    abortController: new AbortController(),
  }
  activeTransfers.set(id, transfer)
  return transfer
}

export function getTransfer(id: string): ActiveTransfer | undefined {
  return activeTransfers.get(id)
}

export function updateTransferProgress(
  id: string,
  bytesTransferred: number
): void {
  const t = activeTransfers.get(id)
  if (!t) return
  t.bytesTransferred = bytesTransferred
  t.progress = t.totalBytes > 0 ? Math.round((bytesTransferred / t.totalBytes) * 100) : 0
}

export function completeTransfer(id: string): void {
  const t = activeTransfers.get(id)
  if (!t) return
  t.status = "completed"
  t.progress = 100
  activeTransfers.delete(id)
}

export function failTransfer(id: string, error: string): void {
  const t = activeTransfers.get(id)
  if (!t) return
  t.status = "failed"
  t.error = error
}

export function cancelTransfer(id: string): boolean {
  const t = activeTransfers.get(id)
  if (!t) return false
  t.abortController.abort()
  t.status = "cancelled"
  return true
}

export function removeTransfer(id: string): void {
  activeTransfers.delete(id)
}

export function listActiveTransfers(): ActiveTransfer[] {
  return Array.from(activeTransfers.values()).filter(
    (t) => t.status === "uploading" || t.status === "downloading"
  )
}

export function isCancelled(id: string): boolean {
  return activeTransfers.get(id)?.abortController.signal.aborted ?? false
}