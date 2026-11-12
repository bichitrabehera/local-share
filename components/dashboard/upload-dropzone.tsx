"use client"

import { useState, useCallback } from "react"
import { useDropzone } from "react-dropzone"
import { Upload, Loader2, FileText, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatBytes, createId } from "@/lib/utils"
import { toast } from "@/hooks/use-toast"

interface SelectedFile {
  id: string
  file: File
  preview: string
  status: "pending" | "uploading" | "complete" | "error"
  error?: string
}

export function UploadDropzone({ onUploaded }: { onUploaded?: () => void }) {
  const [files, setFiles] = useState<SelectedFile[]>([])

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles: SelectedFile[] = acceptedFiles.map((file) => ({
      id: createId(),
      file,
      preview: URL.createObjectURL(file),
      status: "pending",
    }))
    setFiles((prev) => [...prev, ...newFiles])
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: true,
  })

  const removeFile = (id: string) => {
    const file = files.find((f) => f.id === id)
    if (file) URL.revokeObjectURL(file.preview)
    setFiles((prev) => prev.filter((f) => f.id !== id))
  }

  const uploadFile = async (file: SelectedFile) => {
    setFiles((prev) =>
      prev.map((f) => (f.id === file.id ? { ...f, status: "uploading" } : f))
    )

    const formData = new FormData()
    formData.append("file", file.file)

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

      setFiles((prev) =>
        prev.map((f) => (f.id === file.id ? { ...f, status: "complete" } : f))
      )
      toast({ title: "Uploaded", description: file.file.name })
      onUploaded?.()
    } catch (err) {
      setFiles((prev) =>
        prev.map((f) =>
          f.id === file.id
            ? {
                ...f,
                status: "error",
                error: err instanceof Error ? err.message : String(err),
              }
            : f
        )
      )
      toast({
        title: "Upload failed",
        description: file.file.name,
        variant: "destructive",
      })
    }
  }

  const uploadAll = async () => {
    const pending = files.filter((f) => f.status === "pending")
    for (const file of pending) {
      await uploadFile(file)
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-base">Upload files</CardTitle>
        {files.length > 0 && (
          <Button
            size="sm"
            onClick={uploadAll}
            disabled={files.some((f) => f.status === "uploading")}
          >
            Upload all
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        <div
          {...getRootProps()}
          className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed px-6 py-8 text-center transition-colors ${
            isDragActive
              ? "border-primary bg-primary/5"
              : "border-border bg-background hover:border-primary/60"
          }`}
        >
          <input {...getInputProps()} />
          <Upload
            className={`h-5 w-5 ${isDragActive ? "text-primary" : "text-muted-foreground"}`}
          />
          <p className="mt-3 text-sm text-foreground">
            {isDragActive ? "Drop to upload" : "Drop files here or click to browse"}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Sends to this device only
          </p>
        </div>

        {files.map((file) => (
          <div
            key={file.id}
            className="flex items-center gap-3 rounded-md border border-border bg-background p-2.5"
          >
            {file.file.type.startsWith("image/") ? (
              // eslint-disable-next-line @next/next/no-img-element -- local object URL preview
              <img
                src={file.preview}
                alt=""
                className="h-8 w-8 shrink-0 rounded object-cover"
              />
            ) : (
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded border border-border text-muted-foreground">
                <FileText className="h-4 w-4" />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm text-foreground" title={file.file.name}>
                {file.file.name}
              </p>
              <p className="text-xs text-muted-foreground">
                {formatBytes(file.file.size)}
                {file.status === "uploading" && " · Uploading…"}
                {file.status === "complete" && " · Uploaded"}
                {file.status === "error" && ` · ${file.error}`}
              </p>
            </div>
            {file.status === "uploading" ? (
              <Loader2 className="h-4 w-4 shrink-0 animate-spin text-primary" />
            ) : (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => removeFile(file.id)}
                className="h-7 w-7 shrink-0 p-0"
                aria-label={`Remove ${file.file.name}`}
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
