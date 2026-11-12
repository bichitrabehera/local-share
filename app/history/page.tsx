"use client"

import { useEffect, useState } from "react"
import { Download, Trash2, Filter, Search } from "lucide-react"
import { ConfirmationDialog } from "@/components/dashboard/confirmation-dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge, type BadgeProps } from "@/components/ui/badge"
import { formatBytes } from "@/lib/utils"
import { toast } from "@/hooks/use-toast"

interface Transfer {
  id: string
  filename: string
  size: number
  direction: "upload" | "download"
  status: string
  created_at: string
  completed_at: string | null
  error_message: string | null
}

const STATUS_VARIANTS: Record<string, BadgeProps["variant"]> = {
  completed: "secondary",
  failed: "destructive",
  uploading: "default",
  downloading: "default",
  cancelled: "outline",
}

export default function HistoryPage() {
  const [transfers, setTransfers] = useState<Transfer[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const [query, setQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [directionFilter, setDirectionFilter] = useState("")
  const [loading, setLoading] = useState(true)
  const [clearOpen, setClearOpen] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)

  const pageSize = 50

  useEffect(() => {
    let cancelled = false
    const params = new URLSearchParams({
      page: String(page),
      pageSize: String(pageSize),
      ...(search && { search }),
      ...(statusFilter && { status: statusFilter }),
      ...(directionFilter && { direction: directionFilter }),
      sort: "created_at",
      dir: "desc",
    })
    fetch(`/api/transfers?${params}`)
      .then((r) => {
        if (!r.ok) throw new Error("Failed to load transfers")
        return r.json()
      })
      .then((data) => {
        if (cancelled) return
        setTransfers(data.transfers || [])
        setTotal(data.total || 0)
      })
      .catch(() => {
        if (cancelled) return
        setTransfers([])
        setTotal(0)
        toast({ title: "Failed to load transfer history", variant: "destructive" })
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [page, pageSize, search, statusFilter, directionFilter, reloadKey])

  useEffect(() => {
    const timer = setTimeout(() => {
      if (query === search) return
      setLoading(true)
      setSearch(query)
      setPage(1)
    }, 250)
    return () => clearTimeout(timer)
  }, [query, search])

  const goToPage = (next: number) => {
    setLoading(true)
    setPage(next)
  }

  const handleClear = () => {
    fetch("/api/transfers", { method: "DELETE" })
      .then((r) => {
        if (!r.ok) throw new Error("Clear failed")
        return r.json()
      })
      .then(() => {
        toast({ title: "History cleared" })
        setTransfers([])
        setTotal(0)
        setPage(1)
        setReloadKey((key) => key + 1)
      })
      .catch(() => toast({ title: "Clear failed", variant: "destructive" }))
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
          <div className="relative w-full sm:w-64">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search transfers…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9"
              aria-label="Search transfers"
            />
          </div>

          <div className="relative">
            <Filter className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <select
              value={statusFilter}
              onChange={(e) => {
                setLoading(true)
                setStatusFilter(e.target.value)
                setPage(1)
              }}
              aria-label="Filter by status"
              className="h-10 w-full appearance-none rounded-md border border-border bg-background pl-9 pr-8 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary sm:w-40"
            >
              <option value="">All statuses</option>
              <option value="completed">Completed</option>
              <option value="failed">Failed</option>
              <option value="uploading">Uploading</option>
              <option value="downloading">Downloading</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <div className="relative">
            <Download className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <select
              value={directionFilter}
              onChange={(e) => {
                setLoading(true)
                setDirectionFilter(e.target.value)
                setPage(1)
              }}
              aria-label="Filter by direction"
              className="h-10 w-full appearance-none rounded-md border border-border bg-background pl-9 pr-8 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary sm:w-40"
            >
              <option value="">All directions</option>
              <option value="upload">Uploads</option>
              <option value="download">Downloads</option>
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 xl:justify-end">
          <span className="text-xs text-muted-foreground">
            {total} transfer{total === 1 ? "" : "s"}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setClearOpen(true)}
            disabled={total === 0 || loading}
          >
            <Trash2 className="h-4 w-4" />
            Clear history
          </Button>
        </div>
      </div>

      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-secondary/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="p-3 font-medium">Transfer ID</th>
                  <th className="p-3 font-medium">Filename</th>
                  <th className="p-3 font-medium">Direction</th>
                  <th className="p-3 font-medium">Status</th>
                  <th className="p-3 text-right font-medium">Size</th>
                  <th className="p-3 font-medium">Started</th>
                  <th className="p-3 font-medium">Completed</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-muted-foreground">
                      Loading…
                    </td>
                  </tr>
                ) : transfers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-muted-foreground">
                      No transfers found
                    </td>
                  </tr>
                ) : (
                  transfers.map((t) => (
                    <tr
                      key={t.id}
                      className="border-b border-border transition-colors last:border-0 hover:bg-accent/40"
                    >
                      <td className="p-3 font-mono text-xs text-muted-foreground">
                        <span className="block max-w-[7rem] truncate" title={t.id}>
                          {t.id}
                        </span>
                      </td>
                      <td className="p-3">
                        <span
                          className="block max-w-[14rem] truncate text-card-foreground"
                          title={t.filename}
                        >
                          {t.filename}
                        </span>
                      </td>
                      <td className="p-3">
                        <span
                          className={
                            t.direction === "upload"
                              ? "text-xs font-medium text-primary"
                              : "text-xs font-medium text-muted-foreground"
                          }
                        >
                          {t.direction}
                        </span>
                      </td>
                      <td className="p-3">
                        <Badge
                          variant={STATUS_VARIANTS[t.status] || "outline"}
                          className="text-xs"
                        >
                          {t.status}
                        </Badge>
                      </td>
                      <td className="p-3 text-right text-card-foreground">
                        {formatBytes(t.size)}
                      </td>
                      <td className="p-3 text-xs text-muted-foreground">
                        {new Date(t.created_at).toLocaleString()}
                      </td>
                      <td className="p-3 text-xs text-muted-foreground">
                        {t.completed_at
                          ? new Date(t.completed_at).toLocaleString()
                          : "—"}
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
        open={clearOpen}
        onOpenChange={setClearOpen}
        title="Clear transfer history?"
        description="This removes all transfer records. Files on disk are not deleted. This cannot be undone."
        confirmLabel="Clear history"
        onConfirm={handleClear}
      />
    </div>
  )
}
