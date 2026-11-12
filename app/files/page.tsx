"use client"

import { useEffect, useState } from "react"
import { Search, Trash2, Download } from "lucide-react"
import { ConfirmationDialog } from "@/components/dashboard/confirmation-dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { formatBytes } from "@/lib/utils"
import { toast } from "@/hooks/use-toast"

interface FileItem {
  id: string
  original_name: string
  stored_name: string
  mime_type: string | null
  size: number
  created_at: string
  expires_at: string | null
}

const MIME_GROUPS: Record<string, string> = {
  "image/": "Image",
  "video/": "Video",
  "audio/": "Audio",
  "application/pdf": "PDF",
  "application/zip": "Archive",
  "application/x-zip-compressed": "Archive",
  "text/": "Text",
}

function mimeLabel(mime: string | null): string {
  if (!mime) return "File"
  for (const [prefix, label] of Object.entries(MIME_GROUPS)) {
    if (mime.startsWith(prefix)) return label
  }
  return "File"
}

export default function FilesPage() {
  const [files, setFiles] = useState<FileItem[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const [query, setQuery] = useState("")
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)

  const pageSize = 50
  const sort = "created_at"
  const dir = "desc"

  useEffect(() => {
    let cancelled = false
    const params = new URLSearchParams({
      page: String(page),
      pageSize: String(pageSize),
      ...(search && { search }),
      sort,
      dir,
    })
    fetch(`/api/files?${params}`)
      .then((r) => {
        if (!r.ok) throw new Error("Failed to load files")
        return r.json()
      })
      .then((data) => {
        if (cancelled) return
        setFiles(data.files || [])
        setTotal(data.total || 0)
      })
      .catch(() => {
        if (cancelled) return
        setFiles([])
        setTotal(0)
        toast({ title: "Failed to load files", variant: "destructive" })
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [page, pageSize, search, sort, dir, reloadKey])

  const reload = () => {
    setLoading(true)
    setReloadKey((key) => key + 1)
  }

  const goToPage = (next: number) => {
    setLoading(true)
    setPage(next)
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      if (query === search) return
      setLoading(true)
      setSearch(query)
      setPage(1)
    }, 250)
    return () => clearTimeout(timer)
  }, [query, search])

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const selectAll = (checked: boolean | "indeterminate") => {
    if (checked === true) {
      setSelected(new Set(files.map((f) => f.id)))
    } else {
      setSelected(new Set())
    }
  }

  const handleDelete = (id: string) => {
    fetch(`/api/files/${id}`, { method: "DELETE" })
      .then((r) => {
        if (!r.ok) throw new Error("Delete failed")
        return r.json()
      })
      .then(() => {
        setSelected((prev) => { const next = new Set(prev); next.delete(id); return next })
        toast({ title: "File deleted" })
        reload()
      })
      .catch(() => toast({ title: "Delete failed", variant: "destructive" }))
  }

  const handleBulkDelete = () => {
    if (selected.size === 0) return
    const count = selected.size
    Promise.all(Array.from(selected).map((id) =>
      fetch(`/api/files/${id}`, { method: "DELETE" }).then((r) => {
        if (!r.ok) throw new Error("Delete failed")
        return r.json()
      })
    ))
      .then(() => {
        setSelected(new Set())
        toast({ title: `${count} file(s) deleted` })
        reload()
      })
      .catch(() => toast({ title: "Bulk delete failed", variant: "destructive" }))
  }

  const handleBulkDownload = () => {
    if (selected.size === 0) return
    const ids = Array.from(selected)
    fetch("/api/files/bulk-download", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids }),
    })
      .then((r) => {
        if (!r.ok) throw new Error("Bulk download failed")
        return r.blob()
      })
      .then((blob) => {
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = "localdrop-bulk.zip"
        a.click()
        URL.revokeObjectURL(url)
        setSelected(new Set())
      })
      .catch(() => toast({ title: "Bulk download failed", variant: "destructive" }))
  }

  const handleDownload = (id: string, name: string) => {
    fetch(`/api/files/${id}/download`)
      .then((r) => {
        if (!r.ok) throw new Error("Download failed")
        return r.blob()
      })
      .then((blob) => {
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = name
        a.click()
        URL.revokeObjectURL(url)
      })
      .catch(() => toast({ title: "Download failed", variant: "destructive" }))
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative w-full lg:max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search files…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9"
            aria-label="Search files"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-muted-foreground">
            {total} file{total === 1 ? "" : "s"}
            {selected.size > 0 && ` · ${selected.size} selected`}
          </span>
          {selected.size > 0 && (
            <>
              <Button variant="destructive" size="sm" onClick={() => setDeleteOpen(true)}>
                <Trash2 className="h-4 w-4" />
                Delete
              </Button>
              <Button size="sm" variant="secondary" onClick={handleBulkDownload}>
                <Download className="h-4 w-4" />
                Download ZIP
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setSelected(new Set())}>
                Clear
              </Button>
            </>
          )}
        </div>
      </div>

      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-secondary/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="w-10 p-3">
                    <Checkbox
                      checked={
                        files.length > 0 && selected.size === files.length
                          ? true
                          : selected.size > 0
                            ? "indeterminate"
                            : false
                      }
                      onCheckedChange={selectAll}
                      aria-label="Select all files"
                    />
                  </th>
                  <th className="p-3 font-medium">Name</th>
                  <th className="p-3 font-medium">Type</th>
                  <th className="p-3 text-right font-medium">Size</th>
                  <th className="p-3 font-medium">Uploaded</th>
                  <th className="p-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-muted-foreground">
                      Loading…
                    </td>
                  </tr>
                ) : files.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-muted-foreground">
                      No files found
                    </td>
                  </tr>
                ) : (
                  files.map((file) => (
                    <tr
                      key={file.id}
                      className="border-b border-border transition-colors last:border-0 hover:bg-accent/40"
                    >
                      <td className="p-3">
                        <Checkbox
                          checked={selected.has(file.id)}
                          onCheckedChange={() => toggleSelect(file.id)}
                          aria-label={`Select ${file.original_name}`}
                        />
                      </td>
                      <td className="p-3">
                        <span
                          className="block max-w-[16rem] truncate text-card-foreground"
                          title={file.original_name}
                        >
                          {file.original_name}
                        </span>
                      </td>
                      <td className="p-3">
                        <Badge variant="outline" className="text-xs">{mimeLabel(file.mime_type)}</Badge>
                      </td>
                      <td className="p-3 text-right text-card-foreground">{formatBytes(file.size)}</td>
                      <td className="p-3 text-xs text-muted-foreground">
                        {new Date(file.created_at).toLocaleDateString()}
                      </td>
                      <td className="p-3">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDownload(file.id, file.original_name)}
                            className="h-8 w-8 p-0"
                            aria-label={`Download ${file.original_name}`}
                            title="Download"
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDelete(file.id)}
                            className="h-8 w-8 p-0 text-muted-foreground hover:text-primary"
                            aria-label={`Delete ${file.original_name}`}
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {total > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">
            {(page - 1) * pageSize + 1} - {Math.min(page * pageSize, total)} of {total}
          </p>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="sm" disabled={page === 1} onClick={() => goToPage(page - 1)}>
              Prev
            </Button>
            <Button variant="outline" size="sm" disabled={page * pageSize >= total} onClick={() => goToPage(page + 1)}>
              Next
            </Button>
          </div>
        </div>
      )}

      <ConfirmationDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete selected files?"
        description={`This will permanently delete ${selected.size} file(s). This cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={handleBulkDelete}
      />
    </div>
  )
}
