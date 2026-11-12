export const runtime = "nodejs"

import fs from "node:fs"
import { Readable } from "node:stream"
import Busboy from "busboy"
import type { IncomingHttpHeaders } from "node:http"
import { nanoid } from "nanoid"

import { insertFile, insertTransfer, updateTransferStatus } from "@/lib/database"
import { generateStoredName, ensureStorageDir, resolveStoragePath } from "@/lib/storage"
import { createTransfer, updateTransferProgress, failTransfer, completeTransfer, isCancelled, removeTransfer, listActiveTransfers } from "@/lib/transfer-manager"
import { validatePairing } from "@/lib/auth"

const MAX_FILE_SIZE = Number(process.env.LOCALDROP_MAX_FILE_SIZE) || 1073741824
const MAX_CONCURRENT_UPLOADS = Number(process.env.LOCALDROP_MAX_CONCURRENT_UPLOADS) || 3
const PAIRING_REQUIRED = process.env.LOCALDROP_PAIRING_REQUIRED !== "false"

export async function POST(req: Request) {
  // Pairing authorization
  if (PAIRING_REQUIRED) {
    const pairing = validatePairing({
      token: req.headers.get("x-pairing-token") || undefined,
      pin: req.headers.get("x-pairing-pin") || undefined,
    })
    if (!pairing.valid) {
      return Response.json({ error: pairing.reason }, { status: 401 })
    }
  }

  const contentType = req.headers.get("content-type") || ""
  if (!contentType.includes("multipart/form-data")) {
    return Response.json({ error: "Expected multipart/form-data" }, { status: 400 })
  }

  const concurrency = listActiveTransfers().length
  if (concurrency >= MAX_CONCURRENT_UPLOADS) {
    return Response.json(
      { error: `Maximum ${MAX_CONCURRENT_UPLOADS} concurrent uploads` },
      { status: 429 }
    )
  }

  ensureStorageDir()

  const headersRecord: Record<string, string> = {}
  req.headers.forEach((value, key) => {
    headersRecord[key] = value
  })

  const busboy = Busboy({
    headers: headersRecord as unknown as IncomingHttpHeaders,
  })
  const results: Array<{
    id: string
    originalName: string
    storedName: string
    mimeType: string | null
    size: number
    status: "completed" | "failed"
    error?: string
  }> = []

  const filePromises: Promise<void>[] = []

  await new Promise<void>((resolve, reject) => {
    busboy.on(
      "file",
      (
        fieldname: string,
        file: NodeJS.ReadableStream,
        info: { filename: string; encoding: string; mimeType: string }
      ) => {
        const transferId = nanoid()
        const originalName = info.filename || "unknown"
        const mimeType = info.mimeType || ""
        const storedName = generateStoredName(originalName)

        // Validate size up front via a wrapper; we enforce during stream
        createTransfer(transferId, 0)

        const filePath = resolveStoragePath(storedName)
        const out = fs.createWriteStream(filePath)
        let size = 0
        let failed = false
        let settled = false
        let failError = ""

        let settle!: () => void
        const finished = new Promise<void>((r) => {
          settle = r
        })
        filePromises.push(finished)

        const settleOnce = (fn: () => void) => {
          if (settled) return
          settled = true
          fn()
          settle()
        }

        const recordFailure = () => {
          removeTransfer(transferId)
          results.push({
            id: transferId,
            originalName,
            storedName,
            mimeType: mimeType || null,
            size,
            status: "failed",
            error: failError,
          })
        }

        const fail = (reason: string) => {
          if (failed) return
          failed = true
          failError = reason
          out.destroy()
          ;(file as any).destroy?.()
          failTransfer(transferId, reason)
        }

        file.on("data", (chunk: Buffer) => {
          if (failed) return
          if (isCancelled(transferId)) {
            fail("cancelled")
            settleOnce(recordFailure)
            return
          }
          size += chunk.length
          if (size > MAX_FILE_SIZE) {
            try {
              fs.unlinkSync(filePath)
            } catch {}
            fail("file exceeds maximum size")
            settleOnce(recordFailure)
            return
          }
          updateTransferProgress(transferId, size)
          out.write(chunk)
        })

        file.on("end", () => {
          if (failed) {
            settleOnce(recordFailure)
            return
          }
          out.end()
        })

        file.on("error", (err) => {
          fail(err instanceof Error ? err.message : "read error")
          settleOnce(recordFailure)
        })

        file.on("close", () => {
          // Safety net for streams destroyed before they emit "end".
          if (failed) settleOnce(recordFailure)
        })

        out.on("finish", () => {
          settleOnce(() => {
            if (failed) return
            completeTransfer(transferId)
            try {
              insertFile({
                id: transferId,
                originalName,
                storedName,
                mimeType: mimeType || null,
                size,
                expiresAt: null,
              })
              insertTransfer({
                id: transferId,
                fileId: transferId,
                filename: originalName,
                size,
                direction: "upload",
                status: "completed",
                errorMessage: null,
              })
              results.push({
                id: transferId,
                originalName,
                storedName,
                mimeType: mimeType || null,
                size,
                status: "completed",
              })
            } catch (err) {
              removeTransfer(transferId)
              failTransfer(transferId, err instanceof Error ? err.message : "db error")
              results.push({
                id: transferId,
                originalName,
                storedName,
                mimeType: mimeType || null,
                size,
                status: "failed",
                error: err instanceof Error ? err.message : "db error",
              })
            }
          })
        })

        out.on("error", (err) => {
          fail(err instanceof Error ? err.message : "write error")
          settleOnce(recordFailure)
        })
      }
    )

    busboy.on("finish", () => {
      Promise.all(filePromises).then(() => resolve())
    })

    busboy.on("error", (err) => {
      reject(err)
    })

    if (req.body) {
      Readable.fromWeb(
        req.body as unknown as import("node:stream/web").ReadableStream
      ).pipe(busboy)
    } else {
      resolve()
    }
  })

  const hasFailure = results.some((r) => r.status === "failed")
  const status = hasFailure ? 207 : 200

  return Response.json(
    {
      ok: !hasFailure,
      results,
      message: hasFailure
        ? "Some uploads failed"
        : "Uploads completed",
    },
    { status }
  )
}