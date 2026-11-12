import { z } from "zod"

export const MaxFileSizeSchema = z
  .string()
  .refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
    message: "Max file size must be a positive number",
  })

export const UploadQuerySchema = z.object({
  pairingToken: z.string().optional(),
  pairingPin: z.string().optional(),
})

export const FileListQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(50),
  search: z.string().optional(),
  sort: z.enum(["created_at", "original_name", "size"]).default("created_at"),
  dir: z.enum(["asc", "desc"]).default("desc"),
  mimeType: z.string().optional(),
})

export const TransferListQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(50),
  search: z.string().optional(),
  status: z.string().optional(),
  direction: z.enum(["upload", "download"]).optional(),
  sort: z.enum(["created_at", "filename", "size", "status"]).default("created_at"),
  dir: z.enum(["asc", "desc"]).default("desc"),
})

export const BulkDownloadSchema = z.object({
  ids: z.array(z.string()).min(1, "At least one file is required"),
})

export type FileListInput = z.infer<typeof FileListQuerySchema>
export type TransferListInput = z.infer<typeof TransferListQuerySchema>
export type BulkDownloadInput = z.infer<typeof BulkDownloadSchema>