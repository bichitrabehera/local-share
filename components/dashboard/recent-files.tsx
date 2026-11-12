"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Download, FileText, Loader2, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatBytes } from "@/lib/utils"

interface StoredFile {
  id: string
  original_name: string
  size: number
  created_at: string
}

export function RecentFiles({ refreshKey = 0 }: { refreshKey?: number }) {
  const [files, setFiles] = useState<StoredFile[]>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    fetch("/api/files?pageSize=5")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("failed"))))
      .then((data: { files?: StoredFile[] }) => {
        if (!cancelled) setFiles(data.files || [])
      })
      .catch(() => {
        if (!cancelled) setFiles([])
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [refreshKey])

  const remove = async (id: string) => {
    setDeleting(id)
    try {
      await fetch(`/api/files/${id}`, { method: "DELETE" })
      setFiles((prev) => prev.filter((f) => f.id !== id))
    } finally {
      setDeleting(null)
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="text-base">Recent files</CardTitle>
        <Link
          href="/files"
          className="text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          View all
        </Link>
      </CardHeader>
      <CardContent className="p-0">
        {loading ? (
          <div className="flex items-center justify-center gap-2 p-6 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading…
          </div>
        ) : files.length === 0 ? (
          <p className="p-6 text-sm text-muted-foreground">
            No files yet. Upload one above.
          </p>
        ) : (
          <ul className="divide-y divide-border border-t border-border">
            {files.map((file) => (
              <li
                key={file.id}
                className="flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-secondary/40"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-border bg-background text-muted-foreground">
                  <FileText className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-foreground" title={file.original_name}>
                    {file.original_name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatBytes(file.size)} ·{" "}
                    {new Date(file.created_at).toLocaleString()}
                  </p>
                </div>
                <a
                  href={`/api/files/${file.id}/download`}
                  className="inline-flex h-8 items-center gap-1.5 rounded-md border border-border px-2.5 text-xs text-foreground transition-colors hover:bg-secondary"
                  download
                >
                  <Download className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Download</span>
                </a>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => remove(file.id)}
                  disabled={deleting === file.id}
                  aria-label={`Delete ${file.original_name}`}
                  className="h-8 w-8 p-0"
                >
                  {deleting === file.id ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="h-3.5 w-3.5" />
                  )}
                </Button>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
