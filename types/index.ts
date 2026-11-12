export interface FileRecord {
  id: string
  originalName: string
  storedName: string
  mimeType: string | null
  size: number
  createdAt: string
  expiresAt: string | null
}

export interface TransferRecord {
  id: string
  fileId: string | null
  filename: string
  size: number
  direction: "upload" | "download"
  status: string
  createdAt: string
  completedAt: string | null
  errorMessage: string | null
}

export interface NetworkInfo {
  lanIp: string | null
  advertisedUrl: string
  port: number
  connected: boolean
}

export type TransferStatus =
  | "uploading"
  | "downloading"
  | "completed"
  | "failed"
  | "cancelled"

export type TransferDirection = "upload" | "download"