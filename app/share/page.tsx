"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { Download, FileText, Loader2, Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatBytes } from "@/lib/utils"
import { toast } from "@/hooks/use-toast"

interface StoredFile {
  id: string
  name: string
  size: number
}

export default function SharePage() {
  const [uploading, setUploading] = useState(false)
  const [files, setFiles] = useState<StoredFile[]>([])
  const [loading, setLoading] = useState(true)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const loadFiles = useCallback(() => {
    fetch("/api/files?pageSize=20")
      .then((r) => r.json())
      .then((data: { files?: StoredFile[] }) => setFiles(data.files || []))
      .catch(() => undefined)
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    loadFiles()
  }, [loadFiles])

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const formData = new FormData()
    formData.append("file", file)

    try {
      const pairing = await fetch("/api/pairing").then((r) => r.json())
      const headers: Record<string, string> = {}
      if (pairing.required && pairing.token) {
        headers["x-pairing-token"] = pairing.token
        if (pairing.pin) headers["x-pairing-pin"] = pairing.pin
      }

      const res = await fetch("/api/upload", {
        method: "POST",
        headers,
        body: formData,
      })
      const result = await res.json()
      const fileResult = result.results?.[0]

      if (!res.ok || fileResult?.status !== "completed") {
        throw new Error(result.error || fileResult?.error || "Upload failed")
      }

      toast({ title: "Uploaded", description: file.name })
      loadFiles()
    } catch (err) {
      toast({
        title: "Upload failed",
        description: err instanceof Error ? err.message : String(err),
        variant: "destructive",
      })
    } finally {
      setUploading(false)
      e.target.value = ""
    }
  }

  const download = async (id: string) => {
    const res = await fetch(`/api/files/${id}/download`)
    if (!res.ok) {
      toast({ title: "Download failed", variant: "destructive" })
      return
    }
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    const disposition = res.headers.get("content-disposition") || ""
    const match = disposition.match(/filename="?([^";]+)"?/)
    a.download = match ? decodeURIComponent(match[1]) : "download"
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="mx-auto w-full max-w-xl space-y-5">
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base">Send a file</CardTitle>
        </CardHeader>
        <CardContent>
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileSelect}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex w-full flex-col items-center justify-center rounded-lg border border-dashed border-border bg-background px-6 py-10 text-center transition-colors hover:border-primary/60 disabled:opacity-60"
          >
            {uploading ? (
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            ) : (
              <Upload className="h-6 w-6 text-muted-foreground" />
            )}
            <span className="mt-3 text-sm text-foreground">
              {uploading ? "Uploading…" : "Select a file"}
            </span>
            <span className="mt-1 text-xs text-muted-foreground">
              Sent directly to the host device
            </span>
          </button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Files on this device</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center gap-2 p-6 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading…
            </div>
          ) : files.length === 0 ? (
            <p className="p-6 text-sm text-muted-foreground">No files yet.</p>
          ) : (
            <ul className="divide-y divide-border border-t border-border">
              {files.map((file) => (
                <li key={file.id} className="flex items-center gap-3 px-4 py-2.5">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-border text-muted-foreground">
                    <FileText className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-foreground" title={file.name}>
                      {file.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatBytes(file.size)}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => download(file.id)}
                    className="shrink-0"
                  >
                    <Download className="h-3.5 w-3.5" />
                    Save
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
