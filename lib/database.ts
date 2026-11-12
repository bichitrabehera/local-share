import Database from "better-sqlite3"
import path from "node:path"
import fs from "node:fs"

const DB_PATH = process.env.LOCALDROP_DATABASE_PATH || "./data/localdrop.db"

let dbInstance: Database.Database | null = null

export interface FileRow {
  id: string
  original_name: string
  stored_name: string
  mime_type: string | null
  size: number
  created_at: string
  expires_at: string | null
}

export interface TransferRow {
  id: string
  file_id: string | null
  filename: string
  size: number
  direction: string
  status: string
  created_at: string
  completed_at: string | null
  error_message: string | null
}

export function getDatabase(): Database.Database {
  if (dbInstance) return dbInstance
  const dir = path.dirname(DB_PATH)
  if (dir) fs.mkdirSync(dir, { recursive: true })
  const db = new Database(DB_PATH)
  db.pragma("journal_mode = WAL")
  db.pragma("foreign_keys = ON")
  initializeSchema(db)
  dbInstance = db
  return db
}

export function closeDatabase(): void {
  if (dbInstance) {
    dbInstance.close()
    dbInstance = null
  }
}

function initializeSchema(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS files (
      id TEXT PRIMARY KEY,
      original_name TEXT NOT NULL,
      stored_name TEXT NOT NULL,
      mime_type TEXT,
      size INTEGER NOT NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      expires_at DATETIME
    );

    CREATE TABLE IF NOT EXISTS transfers (
      id TEXT PRIMARY KEY,
      file_id TEXT,
      filename TEXT NOT NULL,
      size INTEGER NOT NULL,
      direction TEXT NOT NULL,
      status TEXT NOT NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      completed_at DATETIME,
      error_message TEXT,
      FOREIGN KEY (file_id) REFERENCES files(id)
    );

    CREATE INDEX IF NOT EXISTS idx_files_created_at ON files(created_at);
    CREATE INDEX IF NOT EXISTS idx_transfers_created_at ON transfers(created_at);
    CREATE INDEX IF NOT EXISTS idx_transfers_status ON transfers(status);
    CREATE INDEX IF NOT EXISTS idx_transfers_direction ON transfers(direction);
    CREATE INDEX IF NOT EXISTS idx_transfers_file_id ON transfers(file_id);
  `)
}

export function insertFile(row: {
  id: string
  originalName: string
  storedName: string
  mimeType: string | null
  size: number
  expiresAt: string | null
}): FileRow {
  const db = getDatabase()
  const stmt = db.prepare(
    `INSERT INTO files (id, original_name, stored_name, mime_type, size, created_at, expires_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  )
  const now = new Date().toISOString()
  stmt.run(
    row.id,
    row.originalName,
    row.storedName,
    row.mimeType,
    row.size,
    now,
    row.expiresAt
  )
  return getFileById(row.id)!
}

export function getFileById(id: string): FileRow | null {
  const db = getDatabase()
  const row = db
    .prepare(`SELECT * FROM files WHERE id = ?`)
    .get(id) as FileRow | undefined
  return row ?? null
}

export function listFiles({
  page = 1,
  pageSize = 50,
  search,
  sort = "created_at",
  dir = "desc",
  mimeType,
}: {
  page?: number
  pageSize?: number
  search?: string
  sort?: string
  dir?: "asc" | "desc"
  mimeType?: string
}): { files: FileRow[]; total: number } {
  const db = getDatabase()
  let where = "1=1"
  const params: unknown[] = []

  if (search) {
    where += " AND original_name LIKE ?"
    params.push(`%${search}%`)
  }
  if (mimeType) {
    where += " AND mime_type LIKE ?"
    params.push(`${mimeType}%`)
  }

  const allowedSorts = ["created_at", "original_name", "size"]
  const sortCol = allowedSorts.includes(sort) ? sort : "created_at"
  const sortDir = dir === "asc" ? "ASC" : "DESC"

  const countStmt = db.prepare(
    `SELECT COUNT(*) as c FROM files WHERE ${where}`
  )
  const total = (countStmt.get(params) as { c: number }).c

  const offset = (page - 1) * pageSize
  const rows = db
    .prepare(
      `SELECT * FROM files WHERE ${where} ORDER BY ${sortCol} ${sortDir} LIMIT ? OFFSET ?`
    )
    .all(...params, pageSize, offset) as FileRow[]

  return { files: rows, total }
}

export function deleteFileRecord(id: string): FileRow | null {
  const db = getDatabase()
  const file = getFileById(id)
  if (!file) return null
  db.prepare(`DELETE FROM transfers WHERE file_id = ?`).run(id)
  db.prepare(`DELETE FROM files WHERE id = ?`).run(id)
  return file
}

export function insertTransfer(row: {
  id: string
  fileId: string | null
  filename: string
  size: number
  direction: "upload" | "download"
  status: string
  errorMessage: string | null
}): TransferRow {
  const db = getDatabase()
  const stmt = db.prepare(
    `INSERT INTO transfers (id, file_id, filename, size, direction, status, created_at, error_message)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  )
  const now = new Date().toISOString()
  stmt.run(
    row.id,
    row.fileId,
    row.filename,
    row.size,
    row.direction,
    row.status,
    now,
    row.errorMessage
  )
  return getTransferById(row.id)!
}

export function getTransferById(id: string): TransferRow | null {
  const db = getDatabase()
  const row = db
    .prepare(`SELECT * FROM transfers WHERE id = ?`)
    .get(id) as TransferRow | undefined
  return row ?? null
}

export function updateTransferStatus(
  id: string,
  status: string,
  completedAt: string | null = null,
  errorMessage: string | null = null
): void {
  const db = getDatabase()
  db.prepare(
    `UPDATE transfers SET status = ?, completed_at = ?, error_message = ? WHERE id = ?`
  ).run(status, completedAt, errorMessage, id)
}

export function listTransfers({
  page = 1,
  pageSize = 50,
  search,
  status,
  direction,
  sort = "created_at",
  dir = "desc",
}: {
  page?: number
  pageSize?: number
  search?: string
  status?: string
  direction?: "upload" | "download"
  sort?: string
  dir?: "asc" | "desc"
}): { transfers: TransferRow[]; total: number } {
  const db = getDatabase()
  let where = "1=1"
  const params: unknown[] = []

  if (search) {
    where += " AND filename LIKE ?"
    params.push(`%${search}%`)
  }
  if (status) {
    where += " AND status = ?"
    params.push(status)
  }
  if (direction) {
    where += " AND direction = ?"
    params.push(direction)
  }

  const allowedSorts = ["created_at", "filename", "size", "status"]
  const sortCol = allowedSorts.includes(sort) ? sort : "created_at"
  const sortDir = dir === "asc" ? "ASC" : "DESC"

  const countStmt = db.prepare(
    `SELECT COUNT(*) as c FROM transfers WHERE ${where}`
  )
  const total = (countStmt.get(params) as { c: number }).c

  const offset = (page - 1) * pageSize
  const rows = db
    .prepare(
      `SELECT * FROM transfers WHERE ${where} ORDER BY ${sortCol} ${sortDir} LIMIT ? OFFSET ?`
    )
    .all(...params, pageSize, offset) as TransferRow[]

  return { transfers: rows, total }
}

export function clearOldTransfers(olderThanDays: number): number {
  const db = getDatabase()
  const cutoff = new Date(Date.now() - olderThanDays * 86400000).toISOString()
  const result = db.prepare(
    `DELETE FROM transfers WHERE created_at < ?`
  ).run(cutoff)
  return result.changes
}

export function clearTransfers(): number {
  const db = getDatabase()
  return db.prepare(`DELETE FROM transfers`).run().changes
}