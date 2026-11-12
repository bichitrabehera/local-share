import fs from "node:fs"
import path from "node:path"
import { pipeline } from "node:stream"
import { promisify } from "node:util"

const streamPipeline = promisify(pipeline)

const STORAGE_DIR = process.env.LOCALDROP_STORAGE_DIR || "./data/uploads"

export function getStorageDir(): string {
  return STORAGE_DIR
}

export function ensureStorageDir(): void {
  fs.mkdirSync(STORAGE_DIR, { recursive: true })
}

/**
 * Generate a unique storage filename to prevent collisions and path traversal.
 * Preserves the original file extension when safe.
 */
export function generateStoredName(originalName: string): string {
  const [, ext = ""] = originalName.split(/(?=\.[^.]+$)/)
  const safeExt = /^[A-Za-z0-9._-]+$/.test(ext) ? ext : ""
  return `${crypto.randomUUID()}${safeExt}`
}

/**
 * Resolve a stored filename to a path strictly inside the storage directory.
 * Throws if the resolved path escapes the storage directory (path traversal).
 */
export function resolveStoragePath(storedName: string): string {
  const storageDir = path.resolve(STORAGE_DIR)
  // Reject any path separators or traversal in storedName
  if (
    storedName.includes("..") ||
    storedName.includes("/") ||
    storedName.includes("\\")
  ) {
    throw new Error("Invalid stored filename")
  }
  const resolved = path.resolve(storageDir, storedName)
  if (!resolved.startsWith(storageDir + path.sep) && resolved !== storageDir) {
    throw new Error("Path traversal detected")
  }
  return resolved
}

export async function saveFileStream(
  stream: NodeJS.ReadableStream,
  storedName: string
): Promise<{ size: number }> {
  ensureStorageDir()
  const destPath = resolveStoragePath(storedName)
  const dest = fs.createWriteStream(destPath)
  let size = 0
  const { Transform } = require("node:stream")
  const countingStream = new Transform({
    transform(chunk: Buffer, encoding: string, callback: (err?: Error | null) => void) {
      size += chunk.length
      this.push(chunk)
      callback()
    },
  })
  await streamPipeline(stream, countingStream, dest)
  return { size }
}

export function deleteFile(storedName: string): void {
  const filePath = resolveStoragePath(storedName)
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath)
  }
}

export function fileExists(storedName: string): boolean {
  try {
    return fs.existsSync(resolveStoragePath(storedName))
  } catch {
    return false
  }
}

export function readFileStream(storedName: string): fs.ReadStream {
  const filePath = resolveStoragePath(storedName)
  return fs.createReadStream(filePath)
}

export function getFileSize(storedName: string): number {
  try {
    return fs.statSync(resolveStoragePath(storedName)).size
  } catch {
    return 0
  }
}